-- Physical video game stores in the United States.
-- Retro is a platform tag (in platforms), not its own yes/no column.
-- Re-imports must update the row with the same google_place_id.
-- They must not create a second slug.
-- updated_at changes only when a fact changes, so sitemap dates stay honest.

create extension if not exists pgcrypto;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(lower(coalesce(input, '')), '[''’]', '', 'g'),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text not null,
  city text not null,
  city_slug text not null default '',
  state text not null,
  zip_code text,
  country text not null default 'US',
  phone text,
  latitude double precision,
  longitude double precision,
  website text,
  about text,
  opening_hours jsonb,
  platforms text[] not null default '{}',
  sells_new boolean not null default false,
  sells_used boolean not null default false,
  accepts_trade_ins boolean not null default false,
  repairs_consoles boolean not null default false,
  is_active boolean not null default false,
  google_place_id text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_platforms_allowed check (
    platforms <@ array['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Handheld', 'Retro', 'VR']::text[]
  )
);

create unique index stores_google_place_id_key
  on public.stores (google_place_id)
  where google_place_id is not null;

create index stores_public_place_idx
  on public.stores (state, city_slug)
  where is_active = true;

create or replace function public.stores_before_write()
returns trigger
language plpgsql
as $$
begin
  new.city_slug := public.slugify(new.city);
  new.country := 'US';

  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
    return new;
  end if;

  new.created_at := old.created_at;
  if (to_jsonb(new) - 'updated_at' - 'created_at')
    is distinct from (to_jsonb(old) - 'updated_at' - 'created_at') then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

create trigger stores_before_write
before insert or update on public.stores
for each row execute function public.stores_before_write();

alter table public.stores enable row level security;

create policy "Public reads active stores"
on public.stores
for select
to anon, authenticated
using (is_active = true);

create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'store_submission')),
  name text,
  email text,
  store_name text,
  address text,
  city text,
  state text,
  phone text,
  website text,
  platforms text[] not null default '{}',
  sells_new boolean not null default false,
  sells_used boolean not null default false,
  accepts_trade_ins boolean not null default false,
  repairs_consoles boolean not null default false,
  message text,
  created_at timestamptz not null default now(),
  constraint inbox_platforms_allowed check (
    platforms <@ array['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Handheld', 'Retro', 'VR']::text[]
  )
);

alter table public.inbox_messages enable row level security;
