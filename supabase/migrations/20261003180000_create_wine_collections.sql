create table if not exists public.wine_collections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bottles jsonb not null default '[]'::jsonb,
  wishlist_bottles jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.wine_collections enable row level security;

revoke all on public.wine_collections from public, anon;
grant select, insert, update, delete on public.wine_collections to authenticated;

drop policy if exists "Users can manage their own wine collection" on public.wine_collections;
create policy "Users can manage their own wine collection"
  on public.wine_collections
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
