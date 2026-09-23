begin;
create table if not exists public.birthday_rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  attending boolean not null,
  guest_count integer not null default 0 check (guest_count between 0 and 10),
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  constraint declined_without_guests check (attending or guest_count = 0)
);
alter table public.birthday_rsvps enable row level security;
alter table public.birthday_rsvps force row level security;
-- No public reads, updates, deletes, or control over timestamps.
revoke all on table public.birthday_rsvps from public, anon, authenticated;
grant usage on schema public to anon;
grant insert (id, name, attending, guest_count, message) on public.birthday_rsvps to anon;
-- Remove any earlier policies on this dedicated RSVP table so reruns stay private.
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'birthday_rsvps' loop
    execute format('drop policy %I on public.birthday_rsvps', p.policyname);
  end loop;
end $$;
create policy "Visitors can insert a valid RSVP"
on public.birthday_rsvps for insert to anon
with check (
  char_length(btrim(name)) between 1 and 100
  and guest_count between 0 and 10
  and (attending or guest_count = 0)
  and (message is null or char_length(message) <= 1000)
);
comment on column public.birthday_rsvps.guest_count is 'Additional guests; does not include the named attendee.';
commit;
