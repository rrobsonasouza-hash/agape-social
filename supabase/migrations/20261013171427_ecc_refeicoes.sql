begin;

create table if not exists public.ecc_refeicoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  tipo text not null check (tipo in ('CAFE_MANHA', 'ALMOCO', 'CAFE_TARDE', 'JANTAR', 'CEIA', 'OUTRO')),
  titulo text not null,
  data date not null,
  hora time not null,
  local text not null default '',
  publico text not null default 'TODOS' check (publico in ('TODOS', 'PARTICIPANTES', 'EQUIPE')),
  quantidade_prevista integer not null default 0 check (quantidade_prevista >= 0),
  cardapio text not null,
  responsavel text not null default '',
  status text not null default 'PLANEJADA' check (status in ('PLANEJADA', 'CONFIRMADA', 'SERVIDA', 'CANCELADA')),
  observacoes text not null default '',
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_refeicoes_paroquia_encontro_idx
  on public.ecc_refeicoes(paroquia_id, encontro_id, data, hora);

alter table public.ecc_refeicoes enable row level security;

drop policy if exists "ecc refeicoes leitura" on public.ecc_refeicoes;
create policy "ecc refeicoes leitura" on public.ecc_refeicoes
for select to authenticated
using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc refeicoes gestao" on public.ecc_refeicoes;
create policy "ecc refeicoes gestao" on public.ecc_refeicoes
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
