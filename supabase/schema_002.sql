-- Run this once in the Supabase SQL Editor, after schema.sql.
-- Adds: starring tasks, Projects (+ checklist), Library (books + quotes).

alter table tasks add column is_starred boolean not null default false;
create index on tasks (user_id, is_starred);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  notes text,
  target_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  author text,
  cover_image_url text,
  status text not null default 'want_to_read' check (status in ('want_to_read', 'reading', 'finished', 'dnf')),
  format text not null default 'none' check (format in ('none', 'physical', 'ebook', 'audiobook')),
  started_date date,
  finished_date date,
  rating integer check (rating is null or rating between 1 and 5),
  isbn text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  book_id uuid references books(id) on delete cascade,
  attribution text,
  quote_text text not null,
  is_favorite boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index on projects (user_id);
create index on project_tasks (user_id, project_id);
create index on books (user_id);
create index on quotes (user_id, book_id);

alter table projects enable row level security;
alter table project_tasks enable row level security;
alter table books enable row level security;
alter table quotes enable row level security;

create policy "owner full access" on projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner full access" on project_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner full access" on books
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner full access" on quotes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
