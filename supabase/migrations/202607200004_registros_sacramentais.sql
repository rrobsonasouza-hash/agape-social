begin;

create table if not exists public.secretaria_registros_sacramentais (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  sacramento text not null check(sacramento in ('BATISMO','PRIMEIRA_COMUNHAO','CRISMA','MATRIMONIO')),
  pessoa_nome text not null,
  pessoa_nascimento date,
  pessoa_naturalidade text not null default '',
  pai_nome text not null default '',
  mae_nome text not null default '',
  padrinhos jsonb not null default '[]'::jsonb,
  data_sacramento date not null,
  celebrante text not null default '',
  local_sacramento text not null default '',
  livro text not null,
  folha text not null,
  termo text not null,
  numero_registro text not null,
  observacoes text not null default '',
  ativo boolean not null default true,
  criado_por uuid,
  criado_por_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists registros_sacramentais_numero_idx on public.secretaria_registros_sacramentais(paroquia_id,sacramento,livro,numero_registro) where ativo;
create index if not exists registros_sacramentais_pessoa_idx on public.secretaria_registros_sacramentais(paroquia_id,lower(pessoa_nome));

create table if not exists public.secretaria_registros_sacramentais_historico (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  registro_id uuid not null references public.secretaria_registros_sacramentais(id) on delete cascade,
  acao text not null,
  descricao text not null,
  criado_por uuid,
  criado_por_nome text not null,
  created_at timestamptz not null default now()
);
create index if not exists registros_sacramentais_historico_idx on public.secretaria_registros_sacramentais_historico(registro_id,created_at desc);

alter table public.secretaria_registros_sacramentais enable row level security;
alter table public.secretaria_registros_sacramentais_historico enable row level security;
create policy "registros sacramentais" on public.secretaria_registros_sacramentais for all to authenticated using(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));
create policy "historico sacramental" on public.secretaria_registros_sacramentais_historico for all to authenticated using(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));

commit;
