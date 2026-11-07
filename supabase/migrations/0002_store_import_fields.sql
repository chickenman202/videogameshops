-- Extra facts from the shop file: country, social links, hours text,
-- photos, and where each row came from.
-- Country is stored as written. A shop outside the US stays outside the US.
-- A missing street, city, or region stays empty. Nothing is filled in with a guess.

alter table public.stores
  alter column address drop not null,
  alter column city drop not null,
  alter column state drop not null,
  alter column country drop not null,
  alter column country drop default;

alter table public.stores
  add column if not exists country_name text,
  add column if not exists website_domain text,
  add column if not exists opening_hours_raw text,
  add column if not exists brand text,
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists twitter_url text,
  add column if not exists other_socials text,
  add column if not exists store_info text,
  add column if not exists source text,
  add column if not exists source_id text,
  add column if not exists osm_url text,
  add column if not exists wikidata_url text,
  add column if not exists fetched_at timestamptz,
  add column if not exists data_updated_at timestamptz,
  add column if not exists enrichment_notes text,
  add column if not exists alternate_source_ids text[] not null default '{}';

alter table public.stores
  drop constraint if exists stores_country_iso;

alter table public.stores
  add constraint stores_country_iso check (country is null or country ~ '^[A-Z]{2}$');

create unique index if not exists stores_source_identity_key
  on public.stores (source, source_id);

create index if not exists stores_country_idx
  on public.stores (country)
  where is_active = true;

create or replace function public.stores_before_write()
returns trigger
language plpgsql
as $$
begin
  new.city_slug := public.slugify(coalesce(new.city, ''));

  if new.country is not null then
    new.country := upper(btrim(new.country));
    if new.country = '' then
      new.country := null;
    end if;
  end if;

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
