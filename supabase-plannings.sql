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
