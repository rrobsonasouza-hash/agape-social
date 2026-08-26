begin;

create table if not exists public.ecc_encontros (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  numero integer not null check (numero > 0),
  nome text not null,
  tema text not null default '',
  lema text not null default '',
  data_inicio date not null,
  data_fim date not null,
  prazo_inscricao date,
  local text not null default '',
  capacidade_casais integer not null default 0 check (capacidade_casais >= 0),
  status text not null default 'PLANEJAMENTO' check (status in ('PLANEJAMENTO', 'INSCRICOES', 'PREPARACAO', 'REALIZADO', 'ENCERRADO')),
  observacoes text not null default '',
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecc_encontros_periodo_valido check (data_fim >= data_inicio),
  constraint ecc_encontros_numero_paroquia_unique unique (paroquia_id, numero)
);

create table if not exists public.ecc_casais (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  conjuge_um_nome text not null,
  conjuge_dois_nome text not null,
  telefone text not null default '',
  email text not null default '',
  data_casamento date,
  voluntario_um_id text references public.voluntarios(id) on delete set null,
  voluntario_dois_id text references public.voluntarios(id) on delete set null,
  situacao text not null default 'ELEGIVEL' check (situacao in ('ELEGIVEL', 'CONVIDADO', 'INSCRITO', 'CONFIRMADO', 'LISTA_ESPERA', 'DESISTENTE', 'PARTICIPOU')),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecc_encontro_casais (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  casal_id uuid not null references public.ecc_casais(id) on delete cascade,
  situacao text not null default 'INSCRITO' check (situacao in ('CONVIDADO', 'INSCRITO', 'CONFIRMADO', 'LISTA_ESPERA', 'DESISTENTE', 'PARTICIPOU')),
  inscrito_em timestamptz not null default now(),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecc_encontro_casais_unique unique (encontro_id, casal_id)
);

create table if not exists public.ecc_equipes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  voluntario_id text not null references public.voluntarios(id) on delete cascade,
  equipe text not null,
  funcao text not null default 'Voluntário',
  coordenador boolean not null default false,
  status text not null default 'CONVIDADO' check (status in ('CONVIDADO', 'CONFIRMADO', 'INDISPONIVEL', 'PARTICIPOU')),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecc_equipes_voluntario_unique unique (encontro_id, voluntario_id)
);

create index if not exists ecc_encontros_paroquia_status_idx on public.ecc_encontros(paroquia_id, status);
create index if not exists ecc_casais_paroquia_situacao_idx on public.ecc_casais(paroquia_id, situacao);
create index if not exists ecc_encontro_casais_encontro_idx on public.ecc_encontro_casais(encontro_id, situacao);
create index if not exists ecc_equipes_encontro_idx on public.ecc_equipes(encontro_id, equipe);

alter table public.ecc_encontros enable row level security;
alter table public.ecc_casais enable row level security;
alter table public.ecc_encontro_casais enable row level security;
alter table public.ecc_equipes enable row level security;

do $$
declare tabela text;
begin
  foreach tabela in array array['ecc_encontros', 'ecc_casais', 'ecc_encontro_casais', 'ecc_equipes'] loop
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
