begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.perfil_acesso as enum ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador', 'voluntario', 'leitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_usuario as enum ('PENDENTE', 'ATIVO', 'INATIVO');
exception when duplicate_object then null; end $$;

create table if not exists public.paroquias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  ativa boolean not null default true,
  endereco jsonb not null default '{}'::jsonb,
  latitude double precision,
  longitude double precision,
  raio_atuacao_km numeric(8,2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  paroquia_id uuid references public.paroquias(id),
  nome text not null,
  email text not null,
  telefone text not null default '',
  perfil public.perfil_acesso not null default 'leitor',
  status public.status_usuario not null default 'PENDENTE',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  entidade_tipo text not null check (entidade_tipo in ('FAMILIA', 'VOLUNTARIO', 'DOADOR', 'VISITA', 'PAROQUIA')),
  entidade_id text not null,
  tipo text not null,
  nome_original text not null,
  caminho_storage text not null unique,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  tamanho_bytes bigint not null check (tamanho_bytes > 0 and tamanho_bytes <= 5242880),
  observacao text not null default '',
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.meu_perfil()
returns public.perfis language sql stable security definer set search_path = public
as $$ select * from public.perfis where id = auth.uid() and status = 'ATIVO' limit 1 $$;

create or replace function public.sou_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select perfil in ('admin_plataforma', 'admin_paroquia') from public.meu_perfil()), false) $$;

create or replace function public.mesma_paroquia(alvo uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select perfil = 'admin_plataforma' or paroquia_id = alvo from public.meu_perfil()), false) $$;

alter table public.paroquias enable row level security;
alter table public.perfis enable row level security;
alter table public.documentos enable row level security;

drop policy if exists "paroquias leitura autenticada" on public.paroquias;
create policy "paroquias leitura autenticada" on public.paroquias for select to authenticated using (ativa and public.mesma_paroquia(id));
drop policy if exists "paroquias administracao" on public.paroquias;
create policy "paroquias administracao" on public.paroquias for all to authenticated using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists "perfil proprio" on public.perfis;
create policy "perfil proprio" on public.perfis for select to authenticated using (id = auth.uid());
drop policy if exists "perfis administracao" on public.perfis;
create policy "perfis administracao" on public.perfis for all to authenticated using (public.sou_admin()) with check (public.sou_admin());

drop policy if exists "documentos leitura paroquia" on public.documentos;
create policy "documentos leitura paroquia" on public.documentos for select to authenticated using (public.mesma_paroquia(paroquia_id));
drop policy if exists "documentos escrita pastoral" on public.documentos;
create policy "documentos escrita pastoral" on public.documentos for all to authenticated
using (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()))
with check (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agape-documentos', 'agape-documentos', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage leitura paroquia" on storage.objects;
create policy "storage leitura paroquia" on storage.objects for select to authenticated
using (bucket_id = 'agape-documentos' and public.mesma_paroquia(((storage.foldername(name))[1])::uuid));
drop policy if exists "storage envio pastoral" on storage.objects;
create policy "storage envio pastoral" on storage.objects for insert to authenticated
with check (bucket_id = 'agape-documentos' and public.mesma_paroquia(((storage.foldername(name))[1])::uuid)
  and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()));
drop policy if exists "storage remocao pastoral" on storage.objects;
create policy "storage remocao pastoral" on storage.objects for delete to authenticated
using (bucket_id = 'agape-documentos' and public.mesma_paroquia(((storage.foldername(name))[1])::uuid)
  and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()));

commit;
