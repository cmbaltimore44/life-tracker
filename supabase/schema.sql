-- Run this once in the Supabase SQL Editor for a fresh project.

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  category_id uuid references categories(id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'evening')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  routine_id uuid not null references routines(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now(),
  unique (routine_id, completed_date)
);

create index on tasks (user_id, status);
create index on categories (user_id);
create index on routines (user_id, time_of_day);
create index on routine_completions (user_id, routine_id, completed_date);

alter table categories enable row level security;
alter table tasks enable row level security;
alter table routines enable row level security;
alter table routine_completions enable row level security;

create policy "owner full access" on categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner full access" on tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner full access" on routines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner full access" on routine_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
