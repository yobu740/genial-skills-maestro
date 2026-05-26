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
