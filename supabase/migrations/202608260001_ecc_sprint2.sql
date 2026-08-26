begin;

alter table public.ecc_casais
  add column if not exists cep text not null default '',
  add column if not exists logradouro text not null default '',
  add column if not exists numero text not null default '',
  add column if not exists complemento text not null default '',
  add column if not exists bairro text not null default '',
  add column if not exists cidade text not null default '',
  add column if not exists estado text not null default '',
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists ecc_casais_paroquia_localizacao_idx
  on public.ecc_casais(paroquia_id, latitude, longitude);

create table if not exists public.ecc_programacao (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  data date not null,
  hora_inicio time not null,
  hora_fim time,
  ambiente text not null default '',
  equipe text not null default '',
  responsavel_voluntario_id text references public.voluntarios(id) on delete set null,
  status text not null default 'PLANEJADA' check (status in ('PLANEJADA', 'CONFIRMADA', 'CONCLUIDA', 'CANCELADA')),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecc_programacao_horario_valido check (hora_fim is null or hora_fim >= hora_inicio)
);

create table if not exists public.ecc_tarefas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  equipe text not null default '',
  responsavel_voluntario_id text references public.voluntarios(id) on delete set null,
  prazo date,
  prioridade text not null default 'MEDIA' check (prioridade in ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_programacao_encontro_data_idx
  on public.ecc_programacao(encontro_id, data, hora_inicio);
create index if not exists ecc_tarefas_encontro_status_prazo_idx
  on public.ecc_tarefas(encontro_id, status, prazo);

alter table public.ecc_programacao enable row level security;
alter table public.ecc_tarefas enable row level security;

do $$
declare tabela text;
begin
  foreach tabela in array array['ecc_programacao', 'ecc_tarefas'] loop
    execute format('drop policy if exists "ecc leitura na paroquia" on public.%I', tabela);
    execute format('create policy "ecc leitura na paroquia" on public.%I for select to authenticated using (public.mesma_paroquia(paroquia_id))', tabela);
    execute format('drop policy if exists "ecc gestao pastoral" on public.%I', tabela);
    execute format($politica$
      create policy "ecc gestao pastoral" on public.%I for all to authenticated
      using (
        public.mesma_paroquia(paroquia_id)
        and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
      )
      with check (
        public.mesma_paroquia(paroquia_id)
        and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
      )
    $politica$, tabela);
  end loop;
end $$;

commit;
