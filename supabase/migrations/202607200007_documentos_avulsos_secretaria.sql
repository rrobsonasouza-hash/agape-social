begin;

create table if not exists public.secretaria_documentos_avulsos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  tipo text not null check(tipo in ('DECLARACAO','AUTORIZACAO','COMPROVANTE_CURSO')),
  titulo text not null,
  destinatario text not null,
  documento_destinatario text not null default '',
  conteudo text not null,
  referencia text not null default '',
  emitido_por uuid,
  emitido_por_nome text not null,
  created_at timestamptz not null default now()
);
create index if not exists documentos_avulsos_busca_idx on public.secretaria_documentos_avulsos(paroquia_id,created_at desc);
alter table public.secretaria_documentos_avulsos enable row level security;
create policy "documentos avulsos secretaria" on public.secretaria_documentos_avulsos for all to authenticated using(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));

commit;
