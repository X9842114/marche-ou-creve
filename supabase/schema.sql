-- Tables Marche ou Creve (prefix moc_ pour cohabiter avec le reste du projet CVE)
-- À exécuter dans Supabase → SQL Editor

create table if not exists public.moc_settings (
  id int primary key check (id = 1),
  mode text not null default 'inscription',
  updated_at timestamptz not null default now(),
  mixer_at timestamptz null,
  show_drawn boolean not null default false,
  revision int not null default 1
);

create table if not exists public.moc_participants (
  id uuid primary key,
  nom text not null,
  prenom text not null,
  matricule text not null unique,
  id_unique text not null unique,
  district text not null,
  registered_at timestamptz not null default now(),
  selected boolean not null default false,
  warnings int not null default 0,
  status text not null default 'en_course'
);

create index if not exists idx_moc_participants_district
  on public.moc_participants (district);

create index if not exists idx_moc_participants_selected
  on public.moc_participants (selected);

insert into public.moc_settings (id, mode, updated_at, mixer_at, show_drawn, revision)
values (1, 'inscription', now(), null, false, 1)
on conflict (id) do nothing;

-- Accès uniquement via service_role côté serveur Next.js
alter table public.moc_settings enable row level security;
alter table public.moc_participants enable row level security;
