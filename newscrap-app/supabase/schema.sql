create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  article_id text not null,
  saved_at timestamptz not null default now(),
  unique (user_id, folder_id, article_id)
);

create table if not exists public.folder_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  summary_date date not null,
  summary_text text not null,
  article_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, folder_id, summary_date)
);

alter table public.folders enable row level security;
alter table public.saved_articles enable row level security;
alter table public.folder_insights enable row level security;

grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.saved_articles to authenticated;
grant select, insert on public.folder_insights to authenticated;

drop policy if exists "Users manage their own folders" on public.folders;
create policy "Users manage their own folders"
  on public.folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own saved articles" on public.saved_articles;
create policy "Users manage their own saved articles"
  on public.saved_articles for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.folders
      where folders.id = folder_id and folders.user_id = auth.uid()
    )
  );

drop policy if exists "Users read their own folder insights" on public.folder_insights;
create policy "Users read their own folder insights"
  on public.folder_insights for select
  using (auth.uid() = user_id);

drop policy if exists "Users create their own folder insights" on public.folder_insights;
create policy "Users create their own folder insights"
  on public.folder_insights for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.folders
      where folders.id = folder_id and folders.user_id = auth.uid()
    )
  );