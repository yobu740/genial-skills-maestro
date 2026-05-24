create table if not exists assessments (
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

create table if not exists assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  teacher_id text,
  code text unique not null,
  status text not null default 'open',
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists session_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references assessment_sessions(id) on delete cascade,
  student_name text not null,
  student_identifier text,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  max_score numeric,
  submitted_at timestamptz default now()
);

create index if not exists assessment_sessions_code_idx
on assessment_sessions(code);

create index if not exists session_responses_session_id_idx
on session_responses(session_id);
