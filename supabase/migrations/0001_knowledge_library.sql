-- DevPath: biblioteca de conhecimento. Execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  author text,
  file_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'processed', 'failed')),
  error_message text,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_chunks (
  id bigint generated always as identity primary key,
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  page_start integer not null check (page_start > 0),
  page_end integer not null check (page_end >= page_start),
  chunk_index integer not null,
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now(),
  unique (book_id, chunk_index)
);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('summary', 'lesson', 'flashcards', 'quiz')),
  title text not null,
  content jsonb not null,
  source_refs jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists book_chunks_book_idx on public.book_chunks(book_id, chunk_index);
create index if not exists generated_content_status_idx on public.generated_content(status, created_at desc);

create or replace function public.is_devpath_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;
revoke all on function public.is_devpath_admin() from public;
grant execute on function public.is_devpath_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_chunks enable row level security;
alter table public.generated_content enable row level security;

drop policy if exists "profile can read self" on public.profiles;
create policy "profile can read self" on public.profiles for select to authenticated using (id = auth.uid() or public.is_devpath_admin());
drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles for all to authenticated using (public.is_devpath_admin()) with check (public.is_devpath_admin());

drop policy if exists "owner reads own books and admin reads all" on public.books;
create policy "owner reads own books and admin reads all" on public.books for select to authenticated using (owner_id = auth.uid() or public.is_devpath_admin());
drop policy if exists "admin inserts books for owner" on public.books;
create policy "admin inserts books for owner" on public.books for insert to authenticated with check (public.is_devpath_admin() and owner_id = auth.uid());
drop policy if exists "admin updates books" on public.books;
create policy "admin updates books" on public.books for update to authenticated using (public.is_devpath_admin()) with check (public.is_devpath_admin());
drop policy if exists "admin deletes books" on public.books;
create policy "admin deletes books" on public.books for delete to authenticated using (public.is_devpath_admin());

drop policy if exists "admin manages chunks" on public.book_chunks;
create policy "admin manages chunks" on public.book_chunks for all to authenticated using (public.is_devpath_admin()) with check (public.is_devpath_admin());

drop policy if exists "published content readable by anyone" on public.generated_content;
create policy "published content readable by anyone" on public.generated_content for select to anon, authenticated using (status = 'published');
drop policy if exists "admin reads all generated content" on public.generated_content;
create policy "admin reads all generated content" on public.generated_content for select to authenticated using (public.is_devpath_admin());
drop policy if exists "admin creates generated content" on public.generated_content;
create policy "admin creates generated content" on public.generated_content for insert to authenticated with check (public.is_devpath_admin() and owner_id = auth.uid());
drop policy if exists "admin updates generated content" on public.generated_content;
create policy "admin updates generated content" on public.generated_content for update to authenticated using (public.is_devpath_admin()) with check (public.is_devpath_admin());
drop policy if exists "admin deletes generated content" on public.generated_content;
create policy "admin deletes generated content" on public.generated_content for delete to authenticated using (public.is_devpath_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-pdfs', 'book-pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['application/pdf'];

drop policy if exists "admins upload their book pdfs" on storage.objects;
create policy "admins upload their book pdfs" on storage.objects for insert to authenticated with check (bucket_id = 'book-pdfs' and (storage.foldername(name))[1] = auth.uid()::text and public.is_devpath_admin());
drop policy if exists "admins read book pdfs" on storage.objects;
create policy "admins read book pdfs" on storage.objects for select to authenticated using (bucket_id = 'book-pdfs' and public.is_devpath_admin());
drop policy if exists "admins delete book pdfs" on storage.objects;
create policy "admins delete book pdfs" on storage.objects for delete to authenticated using (bucket_id = 'book-pdfs' and public.is_devpath_admin());

-- Todo novo usuário começa como estudante; o papel admin deve ser concedido manualmente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_devpath on auth.users;
create trigger on_auth_user_created_devpath after insert on auth.users
for each row execute procedure public.handle_new_user();
