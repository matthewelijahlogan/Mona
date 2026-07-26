-- Supabase migration: create elements and findings tables

create table if not exists elements (
  id integer primary key,
  symbol text not null,
  name text not null,
  properties jsonb,
  created_at timestamptz default now()
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_display text,
  title text not null,
  composition jsonb not null,
  drugs_referenced jsonb,
  computed_score numeric,
  validation_state text default 'draft',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_findings_score on findings (computed_score desc);
