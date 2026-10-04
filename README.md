# Ma cave à vin

Application Nuxt de gestion de cave avec authentification Supabase et persistance PostgreSQL via Drizzle ORM. Les bouteilles sont stockées une par ligne dans `bottles`; `user_bottles` associe chaque bouteille à son compte et à sa liste.

## Configuration Supabase et Drizzle

1. Créez un projet sur [Supabase](https://supabase.com/) et récupérez son URL ainsi que sa clé **publishable** dans les paramètres API du projet.
2. Copiez `.env.example` vers `.env`, puis renseignez `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY` et `NUXT_DATABASE_URL`. La dernière valeur est la chaîne de connexion PostgreSQL du projet Supabase (idéalement le pooler de session si nécessaire), et reste strictement côté serveur.
3. Exécutez `npm run db:migrate`. Drizzle crée le schéma relationnel et transfère les bouteilles existantes de `wine_collections` avant de supprimer l’ancienne table.
5. Lancez l’application avec `npm run dev`. Depuis `/login`, créez votre compte personnel. Si la confirmation d’adresse est activée dans Supabase, confirmez-la depuis le message reçu.
6. Pour garder l’accès privé, désactivez ensuite les inscriptions publiques dans **Authentication → Settings → Allow new users to sign up**. La connexion reste possible.

L’authentification et la validation de session restent gérées par Supabase Auth. Les routes serveur vérifient l’utilisateur avant chaque accès Drizzle et filtrent chaque requête par son identifiant. Les politiques RLS restent activées comme défense supplémentaire. N’utilisez jamais une clé `service_role` ou `secret` dans une variable `NUXT_PUBLIC_*`.

À la première connexion, les listes présentes dans le stockage local du navigateur sont importées si aucune bouteille n’existe encore pour le compte. Les modifications suivantes sont sauvegardées par les routes serveur via Drizzle.

Pour modifier le schéma, mettez à jour [`server/database/schema.ts`](./server/database/schema.ts), puis générez et appliquez la migration :

```sh
npm run db:generate
npm run db:migrate
```

## Organisation du code

Les domaines sont implémentés comme layers Nuxt locaux et déclarés dans `nuxt.config.ts` :

- `layers/cellar` regroupe les composants, composables, store, données et utilitaires de la cave.
- `layers/auth` regroupe les composants et le composable d’authentification Supabase.
- `app/pages` contient les routes de l’application ; les accès aux données restent dans les API serveur.

## Développement

```sh
npm install
npm run dev
npm run typecheck
npm run build
```
