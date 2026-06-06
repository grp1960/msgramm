-- ─── Ms. Gramm Quota System Migration ────────────────────────────────────────
-- Run this in the Supabase SQL editor (once).

-- 1. License types ─────────────────────────────────────────────────────────────
create table if not exists license_types (
  id                   text primary key,          -- 'basic', 'premium', etc.
  monthly_token_limit  int  not null,
  description          text not null default ''
);

insert into license_types (id, monthly_token_limit, description) values
  ('basic',   100000, 'Pilot / standard users — 100k tokens per period'),
  ('premium', 500000, 'Premium users — 500k tokens per period')
on conflict (id) do nothing;


-- 2. Profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  role                     text not null default 'user' check (role in ('admin', 'user')),
  license_type             text references license_types(id),
  token_limit_override     int,                   -- overrides license_type limit when set
  subscription_start       date,                  -- billing anchor date
  subscription_interval_days int not null default 30,
  display_name             text,
  bio                      text,
  avatar_url               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- RLS: users can read their own profile; only service role can write
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = user_id);


-- 3. Token usage ───────────────────────────────────────────────────────────────
create table if not exists token_usage (
  user_id      uuid not null references auth.users(id) on delete cascade,
  period_start date not null,                     -- start of the billing period
  tokens_used  int  not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, period_start)
);

-- RLS: users can read their own usage; only service role can write
alter table token_usage enable row level security;

create policy "Users can read own token usage"
  on token_usage for select
  using (auth.uid() = user_id);


-- 4. increment_token_usage RPC ─────────────────────────────────────────────────
-- Called by recordUsage() after each OpenAI call.
-- Upserts the row, adding tokens atomically.
create or replace function increment_token_usage(
  p_user_id    uuid,
  p_period_start date,
  p_tokens     int
)
returns void
language plpgsql
security definer
as $$
begin
  insert into token_usage (user_id, period_start, tokens_used, updated_at)
  values (p_user_id, p_period_start, p_tokens, now())
  on conflict (user_id, period_start)
  do update set
    tokens_used = token_usage.tokens_used + excluded.tokens_used,
    updated_at  = now();
end;
$$;


-- 5. Seed admin profile ────────────────────────────────────────────────────────
-- Replace <YOUR_USER_ID> with your auth.users UUID (find in Supabase → Auth → Users)
/*
insert into profiles (user_id, role, license_type, subscription_start)
values (
  '<YOUR_USER_ID>',
  'admin',
  null,                          -- admin role bypasses quota; no license needed
  current_date
)
on conflict (user_id) do update set role = 'admin';
*/
