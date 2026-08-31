begin;

alter table public.ecc_equipes add column if not exists data_escala date;
alter table public.ecc_equipes add column if not exists hora_inicio time;
alter table public.ecc_equipes add column if not exists hora_fim time;

create table if not exists public.ecc_equipe_presencas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  equipe_id uuid not null references public.ecc_equipes(id) on delete cascade,
  data date not null,
  presente boolean not null,
  registrado_em timestamptz not null default now(),
  registrado_por uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (equipe_id, data)
);

create index if not exists ecc_equipe_presencas_painel_idx on public.ecc_equipe_presencas(encontro_id, data, presente);
alter table public.ecc_equipe_presencas enable row level security;
drop policy if exists "ecc equipe presencas leitura" on public.ecc_equipe_presencas;
create policy "ecc equipe presencas leitura" on public.ecc_equipe_presencas for select to authenticated using (public.mesma_paroquia(paroquia_id));
drop policy if exists "ecc equipe presencas gestao" on public.ecc_equipe_presencas;
create policy "ecc equipe presencas gestao" on public.ecc_equipe_presencas for all to authenticated
  using (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()))
  with check (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()));

commit;
