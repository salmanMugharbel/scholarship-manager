-- Scholarship Manager database schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- ---------- Tables ----------

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  provider text,
  country text,
  universities text,
  degree_level text default 'Master',
  funding_type text,
  funding_details text,
  deadline date,
  deadline_note text,
  official_link text,
  syrian_eligible text,
  apply_from_kazakhstan text,
  eligibility_summary text,
  english_requirement text,
  application_steps text,
  notes text,
  status text not null default 'Researching'
    check (status in ('Researching', 'Preparing', 'Submitted', 'Accepted', 'Rejected')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  status text not null default 'Not started'
    check (status in ('Not started', 'In progress', 'Ready')),
  due_date date,
  notes text,
  file_path text,
  file_name text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Which scholarship needs which document
create table if not exists public.scholarship_documents (
  scholarship_id uuid not null references public.scholarships (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (scholarship_id, document_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  due_date date,
  scholarship_id uuid references public.scholarships (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Row Level Security: each user only sees their own rows ----------

alter table public.scholarships enable row level security;
alter table public.documents enable row level security;
alter table public.scholarship_documents enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "own scholarships" on public.scholarships;
create policy "own scholarships" on public.scholarships
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own documents" on public.documents;
create policy "own documents" on public.documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own scholarship_documents" on public.scholarship_documents;
create policy "own scholarship_documents" on public.scholarship_documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- File storage (private bucket, files stored under <user_id>/...) ----------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "own files read" on storage.objects;
create policy "own files read" on storage.objects
  for select using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own files insert" on storage.objects;
create policy "own files insert" on storage.objects
  for insert with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own files update" on storage.objects;
create policy "own files update" on storage.objects
  for update using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own files delete" on storage.objects;
create policy "own files delete" on storage.objects
  for delete using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
