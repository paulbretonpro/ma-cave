CREATE TABLE IF NOT EXISTS "wine_collections" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bottles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wishlist_bottles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE public.wine_collections ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON public.wine_collections FROM public, anon;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wine_collections TO authenticated;
--> statement-breakpoint
DROP POLICY IF EXISTS "Users can manage their own wine collection" ON public.wine_collections;
--> statement-breakpoint
CREATE POLICY "Users can manage their own wine collection"
	ON public.wine_collections
	FOR ALL
	TO authenticated
	USING ((SELECT auth.uid()) = user_id)
	WITH CHECK ((SELECT auth.uid()) = user_id);
