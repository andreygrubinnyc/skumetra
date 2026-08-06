-- Founding Seller Pilot applications.
--
-- Access model: this table is written to ONLY by the server-side Route
-- Handler (src/app/api/pilot-application/route.ts), using the Supabase
-- service-role key, which bypasses Row Level Security entirely. Browser
-- clients never talk to Supabase directly for this table, so RLS is left
-- with NO permissive policies for anon/authenticated roles below — the
-- safest default. If a public read/insert path is ever added, write an
-- explicit, narrowly-scoped policy for it then; do not widen this by
-- default.

create table if not exists public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  email text not null,
  business_name text,

  amazon_selling_status text not null,
  listing_count_range text not null,
  supplier_count text not null,
  supplier_file_format text not null,
  primary_problem text not null,
  file_willingness text not null,
  additional_details text,

  status text not null default 'new'
    check (status in ('new', 'reviewing', 'accepted', 'rejected')),
  source text not null default 'website'
);

comment on table public.pilot_applications is
  'Founding Seller Pilot applications submitted from skumetra.com/pilot. Inserted only by the server route handler using the service-role key.';

create index if not exists pilot_applications_created_at_idx
  on public.pilot_applications (created_at desc);

create index if not exists pilot_applications_email_created_at_idx
  on public.pilot_applications (email, created_at desc);

alter table public.pilot_applications enable row level security;

-- Intentionally no policies for `anon` or `authenticated` roles: this
-- table is not readable or writable from the browser. Only the
-- service-role key (used server-side only) can access it, since that
-- key bypasses RLS.

-- Bypassing RLS is separate from table-level grants: `service_role` still
-- needs an explicit GRANT to touch this table at all. Some projects'
-- default-privilege rules cover this automatically for tables created via
-- the dashboard SQL Editor; this statement makes it explicit so the app
-- works the same regardless of that project setting.
grant select, insert, update, delete on public.pilot_applications to service_role;
