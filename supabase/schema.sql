-- Riffólio — run this once in the Supabase SQL Editor.

create table if not exists public.musicas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  artista text not null,
  arquivo_tab text not null,
  status text not null default 'quero aprender'
    check (status in ('quero aprender', 'aprendendo', 'aprendida')),
  data_adicionada timestamptz not null default now()
);

create index if not exists musicas_data_adicionada_idx
  on public.musicas (data_adicionada desc);

-- Single-user, read-only-from-the-web app: the site reads with the anon key,
-- writes happen from the Supabase dashboard. RLS stays on with a read policy
-- only, so a leaked anon key cannot modify the library.
alter table public.musicas enable row level security;

drop policy if exists "public read musicas" on public.musicas;
create policy "public read musicas"
  on public.musicas for select
  to anon, authenticated
  using (true);

-- Storage bucket for the .gp5 / .gpx / .musicxml files.
--
-- A public bucket already serves files over their public URL, which is all the
-- player needs. No select policy is added on purpose: one would additionally let
-- anyone *list* the whole bucket without unlocking anything the app uses.
--
-- Note when uploading: Storage object keys must be ASCII. Accented names like
-- "o-papa-é-pop.gp4" are rejected with "File name is invalid" — the display name
-- lives in musicas.titulo, so file names can be plain.
insert into storage.buckets (id, name, public)
values ('tabs', 'tabs', true)
on conflict (id) do update set public = true;

drop policy if exists "public read tabs" on storage.objects;
