begin;

create table if not exists public.ecc_comunicacoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  canal text not null default 'WHATSAPP' check (canal in ('WHATSAPP', 'EMAIL', 'AVISO')),
  publico text not null default 'TODOS' check (publico in ('TODOS', 'PARTICIPANTES', 'EQUIPE', 'COORDENACAO')),
  status text not null default 'RASCUNHO' check (status in ('RASCUNHO', 'PROGRAMADA', 'ENVIADA', 'CANCELADA')),
  programada_para timestamptz,
  enviada_em timestamptz,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecc_documentos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  titulo text not null,
  categoria text not null default 'OUTRO' check (categoria in ('FICHA', 'LISTA', 'ROTEIRO', 'TERMO', 'MATERIAL', 'OUTRO')),
  url text not null default '',
  observacoes text not null default '',
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'DISPONIVEL', 'ARQUIVADO')),
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_comunicacoes_encontro_status_idx
  on public.ecc_comunicacoes(encontro_id, status, programada_para);
create index if not exists ecc_documentos_encontro_categoria_idx
  on public.ecc_documentos(encontro_id, categoria, status);

alter table public.ecc_comunicacoes enable row level security;
alter table public.ecc_documentos enable row level security;

do $$
declare tabela text;
begin
  foreach tabela in array array['ecc_comunicacoes', 'ecc_documentos'] loop
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
