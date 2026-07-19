begin;

create table if not exists public.secretaria_eventos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  titulo text not null,
  tipo text not null check(tipo in ('BATISMO','CASAMENTO','CURSO','REUNIAO','CELEBRACAO','ATENDIMENTO','OUTRO')),
  inicio timestamptz not null,
  fim timestamptz not null,
  local text,
  responsavel text,
  observacoes text,
  status text not null default 'AGENDADO' check(status in ('AGENDADO','CONFIRMADO','CONCLUIDO','CANCELADO')),
  criado_por uuid,
  criado_por_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(fim > inicio)
);
create index if not exists secretaria_eventos_periodo_idx on public.secretaria_eventos(paroquia_id,inicio,fim);
alter table public.secretaria_eventos enable row level security;
create policy "agenda paroquial" on public.secretaria_eventos for all to authenticated using(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));

commit;
