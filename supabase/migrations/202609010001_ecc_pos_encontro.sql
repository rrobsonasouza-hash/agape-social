begin;

create table if not exists public.ecc_pos_encontro (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  casal_id uuid not null references public.ecc_casais(id) on delete cascade,
  avaliacao smallint check (avaliacao between 1 and 5),
  testemunho text not null default '',
  acompanhamento_necessario boolean not null default false,
  acompanhamento_observacoes text not null default '',
  interesse_trabalhar boolean not null default false,
  areas_interesse text[] not null default '{}',
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'RESPONDIDO', 'EM_ACOMPANHAMENTO', 'ENCAMINHADO_VOLUNTARIADO', 'CONCLUIDO')),
  contatado_em timestamptz,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (encontro_id, casal_id)
);

create index if not exists ecc_pos_encontro_painel_idx
  on public.ecc_pos_encontro(encontro_id, status, interesse_trabalhar);

alter table public.ecc_pos_encontro enable row level security;

drop policy if exists "ecc pos encontro leitura" on public.ecc_pos_encontro;
create policy "ecc pos encontro leitura" on public.ecc_pos_encontro
  for select to authenticated using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc pos encontro gestao" on public.ecc_pos_encontro;
create policy "ecc pos encontro gestao" on public.ecc_pos_encontro
  for all to authenticated
  using (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  )
  with check (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  );

commit;
