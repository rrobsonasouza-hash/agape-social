begin;

create table if not exists public.ecc_visitas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  casal_id uuid not null references public.ecc_casais(id) on delete cascade,
  visitador_voluntario_id text references public.voluntarios(id) on delete set null,
  data_agendada date not null,
  hora_agendada time,
  data_realizada date,
  retorno_data date,
  status text not null default 'AGENDADA'
    check (status in ('PENDENTE', 'AGENDADA', 'REALIZADA', 'RETORNO_NECESSARIO', 'CANCELADA')),
  questionario jsonb not null default '{}'::jsonb,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_visitas_encontro_data_idx
  on public.ecc_visitas(encontro_id, data_agendada, status);
create index if not exists ecc_visitas_casal_historico_idx
  on public.ecc_visitas(casal_id, data_agendada desc);

alter table public.ecc_visitas enable row level security;

drop policy if exists "ecc visitas gestao pastoral" on public.ecc_visitas;
create policy "ecc visitas gestao pastoral"
  on public.ecc_visitas for all to authenticated
  using (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  )
  with check (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  );

commit;
