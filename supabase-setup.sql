-- Genial Skills Maestro Supabase schema
-- Run this in Supabase SQL Editor for the project connected to Render.

create extension if not exists pgcrypto;

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  published boolean not null default true,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_assignments enable row level security;

drop policy if exists "service role full access teacher_assignments" on public.teacher_assignments;
create policy "service role full access teacher_assignments"
on public.teacher_assignments
for all
to service_role
using (true)
with check (true);

create or replace function public.set_teacher_assignments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_teacher_assignments_updated_at on public.teacher_assignments;
create trigger set_teacher_assignments_updated_at
before update on public.teacher_assignments
for each row execute function public.set_teacher_assignments_updated_at();

create table if not exists public.teacher_documents (
  id text primary key,
  title text not null,
  tool_title text not null default 'Herramienta IA',
  category text not null default 'ia',
  kind text not null default 'markdown',
  model text not null default '',
  content text not null default '',
  prompt text not null default '',
  values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_documents enable row level security;

drop policy if exists "service role full access teacher_documents" on public.teacher_documents;
create policy "service role full access teacher_documents"
on public.teacher_documents
for all
to service_role
using (true)
with check (true);

create or replace function public.set_teacher_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_teacher_documents_updated_at on public.teacher_documents;
create trigger set_teacher_documents_updated_at
before update on public.teacher_documents
for each row execute function public.set_teacher_documents_updated_at();

create table if not exists public.teacher_plannings (
  id uuid primary key default gen_random_uuid(),
  plan_name text not null,
  subject_name text,
  level_code text,
  group_name text,
  open_date text,
  close_date text,
  week_number text default '209',
  period_label text,
  academic_year text,
  closes_on text,
  is_plan_open boolean default true,
  lessons jsonb not null default '[]'::jsonb,
  section_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_plannings enable row level security;

drop policy if exists "teacher_plannings_service_role_all" on public.teacher_plannings;
create policy "teacher_plannings_service_role_all"
on public.teacher_plannings
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.set_teacher_plannings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_plannings_updated_at on public.teacher_plannings;
create trigger teacher_plannings_updated_at
before update on public.teacher_plannings
for each row
execute function public.set_teacher_plannings_updated_at();

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  teacher_id text,
  title text not null,
  subject text,
  grade text,
  source_tool text,
  markdown text,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade,
  teacher_id text,
  code text unique not null,
  status text not null default 'open',
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.session_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.assessment_sessions(id) on delete cascade,
  student_name text not null,
  student_identifier text,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  max_score numeric,
  submitted_at timestamptz default now()
);

create index if not exists assessment_sessions_code_idx
on public.assessment_sessions(code);

create index if not exists session_responses_session_id_idx
on public.session_responses(session_id);
