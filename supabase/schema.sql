-- SLOT TRACKER schema
-- Run this in the Supabase SQL editor.

-- Tracking sessions (fields TBD per game type — placeholder for now)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

-- Marketplace: slot plays for sale
create table if not exists plays (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game text,
  location text,
  description text,
  price_usd numeric(10,2) not null default 0,
  status text not null default 'active',  -- active | sold | removed
  created_at timestamptz default now()
);

-- Marketplace: purchases
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  play_id uuid references plays(id) on delete cascade,
  price_paid numeric(10,2),
  created_at timestamptz default now()
);

-- Temporary open RLS (same as TDL session 1 — tighten when auth is added)
alter table sessions enable row level security;
alter table plays enable row level security;
alter table purchases enable row level security;

create policy "open sessions" on sessions for all using (true) with check (true);
create policy "open plays" on plays for all using (true) with check (true);
create policy "open purchases" on purchases for all using (true) with check (true);
