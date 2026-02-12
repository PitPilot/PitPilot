create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  event_sync_min_year integer not null default 2025 check (event_sync_min_year >= 1992),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, event_sync_min_year)
values (1, 2025)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "authenticated can read platform settings" on public.platform_settings;
create policy "authenticated can read platform settings"
  on public.platform_settings
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "service role can write platform settings" on public.platform_settings;
create policy "service role can write platform settings"
  on public.platform_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
