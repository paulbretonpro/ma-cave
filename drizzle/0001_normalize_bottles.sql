CREATE TABLE "bottles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"appellation" text NOT NULL,
	"region" text NOT NULL,
	"year" text NOT NULL,
	"color" text NOT NULL,
	"pairing" text NOT NULL,
	"bought_at" text NOT NULL,
	"tasted_at" text,
	"note" text NOT NULL,
	"image" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bottles" (
	"user_id" uuid NOT NULL,
	"bottle_id" uuid NOT NULL,
	"shelf" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"recommended_from_bottle_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_bottles_user_id_bottle_id_pk" PRIMARY KEY("user_id","bottle_id"),
	CONSTRAINT "user_bottles_shelf_check" CHECK ("shelf" in ('cellar', 'drunk', 'wishlist'))
);
--> statement-breakpoint
ALTER TABLE "user_bottles" ADD CONSTRAINT "user_bottles_bottle_id_bottles_id_fk" FOREIGN KEY ("bottle_id") REFERENCES "public"."bottles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_bottles" ADD CONSTRAINT "user_bottles_recommended_from_bottle_id_bottles_id_fk" FOREIGN KEY ("recommended_from_bottle_id") REFERENCES "public"."bottles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_bottles" ADD CONSTRAINT "user_bottles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DO $migration$
DECLARE
	collection record;
	bottle_json jsonb;
	new_bottle_id uuid;
	source_bottle_id uuid;
	source_legacy_id text;
	legacy_id text;
	raw_appellation text;
	region_name text;
	normalized_appellation text;
BEGIN
	CREATE TEMPORARY TABLE bottle_legacy_id_map (
		user_id uuid NOT NULL,
		legacy_id text NOT NULL,
		bottle_id uuid NOT NULL,
		PRIMARY KEY (user_id, legacy_id)
	) ON COMMIT DROP;

	FOR collection IN
		SELECT user_id, bottles, wishlist_bottles
		FROM public.wine_collections
	LOOP
		FOR bottle_json IN
			SELECT value FROM jsonb_array_elements(COALESCE(collection.bottles, '[]'::jsonb))
		LOOP
			new_bottle_id := gen_random_uuid();
			raw_appellation := COALESCE(NULLIF(bottle_json->>'appellation', ''), 'Appellation à préciser');
			region_name := COALESCE(NULLIF(bottle_json->>'region', ''), NULLIF(regexp_replace(raw_appellation, '^.* · ', ''), raw_appellation), 'Région à préciser');
			normalized_appellation := CASE
				WHEN NULLIF(bottle_json->>'region', '') IS NULL AND position(' · ' in raw_appellation) > 0
					THEN regexp_replace(raw_appellation, ' · [^·]+$', '')
				ELSE raw_appellation
			END;

			INSERT INTO public.bottles (
				id, name, appellation, region, year, color, pairing,
				bought_at, tasted_at, note, image
			) VALUES (
				new_bottle_id,
				COALESCE(NULLIF(bottle_json->>'name', ''), 'Vin sans nom'),
				normalized_appellation,
				region_name,
				COALESCE(NULLIF(bottle_json->>'year', ''), 'NV'),
				COALESCE(NULLIF(bottle_json->>'color', ''), 'Rouge'),
				COALESCE(NULLIF(bottle_json->>'pairing', ''), 'Apéro'),
				COALESCE(NULLIF(bottle_json->>'boughtAt', ''), 'Lieu d’achat à préciser'),
				NULLIF(bottle_json->>'tastedAt', ''),
				COALESCE(NULLIF(bottle_json->>'note', ''), 'Aucun commentaire pour le moment.'),
				COALESCE(NULLIF(bottle_json->>'image', ''), '')
			);

			legacy_id := bottle_json->>'id';
			IF legacy_id IS NOT NULL THEN
				INSERT INTO bottle_legacy_id_map (user_id, legacy_id, bottle_id)
				VALUES (collection.user_id, legacy_id, new_bottle_id)
				ON CONFLICT ON CONSTRAINT bottle_legacy_id_map_pkey DO NOTHING;
			END IF;

			INSERT INTO public.user_bottles (
				user_id, bottle_id, shelf, consumed_at, updated_at
			) VALUES (
				collection.user_id,
				new_bottle_id,
				CASE WHEN NULLIF(bottle_json->>'consumedAt', '') IS NULL THEN 'cellar' ELSE 'drunk' END,
				NULLIF(bottle_json->>'consumedAt', '')::timestamptz,
				now()
			);
		END LOOP;

		FOR bottle_json IN
			SELECT value FROM jsonb_array_elements(COALESCE(collection.wishlist_bottles, '[]'::jsonb))
		LOOP
			new_bottle_id := gen_random_uuid();
			raw_appellation := COALESCE(NULLIF(bottle_json->>'appellation', ''), 'Appellation à préciser');
			region_name := COALESCE(NULLIF(bottle_json->>'region', ''), NULLIF(regexp_replace(raw_appellation, '^.* · ', ''), raw_appellation), 'Région à préciser');
			normalized_appellation := CASE
				WHEN NULLIF(bottle_json->>'region', '') IS NULL AND position(' · ' in raw_appellation) > 0
					THEN regexp_replace(raw_appellation, ' · [^·]+$', '')
				ELSE raw_appellation
			END;

			INSERT INTO public.bottles (
				id, name, appellation, region, year, color, pairing,
				bought_at, tasted_at, note, image
			) VALUES (
				new_bottle_id,
				COALESCE(NULLIF(bottle_json->>'name', ''), 'Vin sans nom'),
				normalized_appellation,
				region_name,
				COALESCE(NULLIF(bottle_json->>'year', ''), 'NV'),
				COALESCE(NULLIF(bottle_json->>'color', ''), 'Rouge'),
				COALESCE(NULLIF(bottle_json->>'pairing', ''), 'Apéro'),
				COALESCE(NULLIF(bottle_json->>'boughtAt', ''), 'Lieu d’achat à préciser'),
				NULLIF(bottle_json->>'tastedAt', ''),
				COALESCE(NULLIF(bottle_json->>'note', ''), 'Aucun commentaire pour le moment.'),
				COALESCE(NULLIF(bottle_json->>'image', ''), '')
			);

			source_legacy_id := bottle_json->>'recommendedFromId';
			source_bottle_id := NULL;
			IF source_legacy_id IS NOT NULL THEN
				SELECT legacy_map.bottle_id INTO source_bottle_id
				FROM bottle_legacy_id_map AS legacy_map
				WHERE legacy_map.user_id = collection.user_id AND legacy_map.legacy_id = source_legacy_id;
			END IF;

			INSERT INTO public.user_bottles (
				user_id, bottle_id, shelf, recommended_from_bottle_id, updated_at
			) VALUES (
				collection.user_id,
				new_bottle_id,
				'wishlist',
				source_bottle_id,
				now()
			);
		END LOOP;
	END LOOP;

	DROP TABLE public.wine_collections;
END
$migration$;
--> statement-breakpoint
REVOKE ALL ON public.bottles, public.user_bottles FROM public, anon, authenticated;
