-- ============================================================================
-- ShiftNote AU - Supabase PostgreSQL Schema & Row-Level Security (RLS)
-- Migration: 001_init.sql
-- Compliance: Australian NDIS Quality and Safeguards Commission & ATO GST-Free
-- ============================================================================

-- Enable UUID generation extension
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLE: profiles
-- Stores independent NDIS support worker (sole trader) business & Xero config.
-- Note: id references auth.users(id) directly (worker_id = id).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  abn text not null default '',
  bsb text not null default '',
  account_number text not null default '',
  xero_tenant_id text,
  xero_token_set jsonb,
  default_hourly_rate_override numeric(10, 2),
  stripe_subscription_status text not null default 'trialing'
    check (stripe_subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Independent NDIS Support Worker sole trader profiles, banking details, and Xero OAuth2 token sets.';

-- ----------------------------------------------------------------------------
-- 2. TABLE: participants
-- Stores NDIS participant records, funding management type, and NDIS plan goals.
-- ----------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  ndis_number text not null check (ndis_number ~ '^[0-9]{9}$'),
  funding_type text not null default 'plan_managed'
    check (funding_type in ('plan_managed', 'self_managed', 'ndia_managed')),
  plan_manager_name text,
  plan_manager_email text,
  xero_contact_id text,
  ndis_goals_summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_participants_worker_id on public.participants(worker_id);
create index if not exists idx_participants_ndis_number on public.participants(ndis_number);

comment on table public.participants is 'NDIS Participants supported by the worker, including 9-digit NDIS number, Plan Manager details, and NDIS goals summary.';

-- ----------------------------------------------------------------------------
-- 3. TABLE: shifts_and_claims
-- Stores post-shift voice transcripts, structured NDIS audit case notes,
-- validated NDIS support line items, and Xero/PDF invoice status.
-- ----------------------------------------------------------------------------
create table if not exists public.shifts_and_claims (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete restrict,
  shift_date date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  duration_hours numeric(6, 2) not null check (duration_hours > 0 and duration_hours <= 24),
  km_travelled numeric(7, 2) not null default 0 check (km_travelled >= 0),
  raw_transcript text not null default '',
  case_note_activities text not null default '',
  case_note_engagement text not null default '',
  case_note_goals text not null default '',
  line_items jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  invoice_number text not null,
  xero_invoice_id text,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'xero_synced', 'pdf_emailed', 'paid', 'voided')),
  created_at timestamptz not null default now()
);

create index if not exists idx_shifts_worker_id on public.shifts_and_claims(worker_id);
create index if not exists idx_shifts_participant_id on public.shifts_and_claims(participant_id);
create index if not exists idx_shifts_shift_date on public.shifts_and_claims(shift_date desc);
create unique index if not exists idx_shifts_worker_invoice_number on public.shifts_and_claims(worker_id, invoice_number);

comment on table public.shifts_and_claims is 'Completed support shifts, objective 3-part NDIS clinical case notes, GST-free line items, and Xero/PDF claim tracking.';

-- ----------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- Strict tenant isolation: every read/write requires auth.uid() = worker_id
-- (and auth.uid() = id on profiles).
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.participants enable row level security;
alter table public.shifts_and_claims enable row level security;

-- Profiles RLS (id is the worker_id)
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- Participants RLS (restricted strictly to auth.uid() = worker_id)
create policy "participants_select_own"
  on public.participants
  for select
  to authenticated
  using (auth.uid() = worker_id);

create policy "participants_insert_own"
  on public.participants
  for insert
  to authenticated
  with check (auth.uid() = worker_id);

create policy "participants_update_own"
  on public.participants
  for update
  to authenticated
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create policy "participants_delete_own"
  on public.participants
  for delete
  to authenticated
  using (auth.uid() = worker_id);

-- Shifts and Claims RLS (restricted strictly to auth.uid() = worker_id)
create policy "shifts_and_claims_select_own"
  on public.shifts_and_claims
  for select
  to authenticated
  using (auth.uid() = worker_id);

create policy "shifts_and_claims_insert_own"
  on public.shifts_and_claims
  for insert
  to authenticated
  with check (auth.uid() = worker_id);

create policy "shifts_and_claims_update_own"
  on public.shifts_and_claims
  for update
  to authenticated
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create policy "shifts_and_claims_delete_own"
  on public.shifts_and_claims
  for delete
  to authenticated
  using (auth.uid() = worker_id);

-- ----------------------------------------------------------------------------
-- 5. AUTOMATIC PROFILE PROVISIONING TRIGGER ON AUTH SIGNUP
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, business_name, abn, bsb, account_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'Independent NDIS Support Services'),
    coalesce(new.raw_user_meta_data->>'abn', ''),
    coalesce(new.raw_user_meta_data->>'bsb', ''),
    coalesce(new.raw_user_meta_data->>'account_number', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
