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
