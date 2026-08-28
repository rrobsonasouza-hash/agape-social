begin;

create table if not exists public.ecc_arrecadacoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  categoria text not null check (categoria in ('ALIMENTO', 'BEBIDA', 'VALOR', 'OUTRO')),
  item text not null,
  responsavel text not null default '',
  telefone text not null default '',
  unidade text not null default 'unidade',
  quantidade_prometida numeric(12,2) not null default 0 check (quantidade_prometida >= 0),
  quantidade_recebida numeric(12,2) not null default 0 check (quantidade_recebida >= 0),
  valor_prometido numeric(12,2) not null default 0 check (valor_prometido >= 0),
  valor_recebido numeric(12,2) not null default 0 check (valor_recebido >= 0),
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'PARCIAL', 'RECEBIDO', 'CANCELADO')),
  observacoes text not null default '',
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_arrecadacoes_encontro_status_idx
  on public.ecc_arrecadacoes(encontro_id, status, categoria);

alter table public.ecc_arrecadacoes enable row level security;

drop policy if exists "ecc arrecadacoes leitura" on public.ecc_arrecadacoes;
create policy "ecc arrecadacoes leitura" on public.ecc_arrecadacoes
for select to authenticated
using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc arrecadacoes gestao" on public.ecc_arrecadacoes;
create policy "ecc arrecadacoes gestao" on public.ecc_arrecadacoes
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
