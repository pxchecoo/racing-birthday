begin;
-- One public, read-only event. Do not reset it when applying this migration again.
create table if not exists public.event_settings (
  id smallint primary key default 1 check (id = 1),
  event_date date not null check (event_date between date '2020-01-01' and date '2100-12-31'),
  event_time time(0) not null,
  updated_at timestamptz not null default now()
);
insert into public.event_settings (id, event_date, event_time)
values (1, '2026-10-24', '15:00:00') on conflict (id) do nothing;
alter table public.event_settings enable row level security;
alter table public.event_settings force row level security;
revoke all on public.event_settings from public, anon, authenticated;
grant select on public.event_settings to anon;
grant all on public.event_settings to service_role;
drop policy if exists "Public event schedule is readable" on public.event_settings;
create policy "Public event schedule is readable" on public.event_settings for select to anon using (id = 1);

-- Opaque session tokens are stored only as SHA-256 hashes, never in plaintext.
create table if not exists public.admin_sessions (
  token_hash text primary key check (length(token_hash) = 64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_expiry_idx on public.admin_sessions (expires_at);
alter table public.admin_sessions enable row level security;
alter table public.admin_sessions force row level security;
revoke all on public.admin_sessions from public, anon, authenticated;
grant all on public.admin_sessions to service_role;

-- Persistent, atomic login limits survive Edge Function cold starts.
create table if not exists public.admin_login_limits (
  scope text primary key,
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.admin_login_limits enable row level security;
alter table public.admin_login_limits force row level security;
revoke all on public.admin_login_limits from public, anon, authenticated;
grant all on public.admin_login_limits to service_role;
create or replace function public.consume_admin_login_attempt(ip_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare bucket text; entry public.admin_login_limits; cap integer;
begin
  if ip_hash is null or length(ip_hash) <> 64 then return false; end if;
  perform pg_advisory_xact_lock(826104240);
  delete from public.admin_login_limits where window_start < now() - interval '1 day';
  foreach bucket in array array['global', 'ip:' || ip_hash] loop
    cap := case when bucket = 'global' then 30 else 5 end;
    insert into public.admin_login_limits(scope) values(bucket) on conflict do nothing;
    select * into entry from public.admin_login_limits where scope = bucket for update;
    if entry.window_start <= now() - interval '15 minutes' then
      update public.admin_login_limits set attempts = 0, window_start = now() where scope = bucket;
    elsif entry.attempts >= cap then
      return false;
    end if;
  end loop;
  update public.admin_login_limits set attempts = attempts + 1 where scope in ('global', 'ip:' || ip_hash);
  return true;
end;
$$;
revoke all on function public.consume_admin_login_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_admin_login_attempt(text) to service_role;
-- Existing RSVP grants and INSERT-only RLS remain unchanged.
grant select on public.birthday_rsvps to service_role;
commit;
