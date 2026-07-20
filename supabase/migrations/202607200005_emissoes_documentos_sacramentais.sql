begin;

create table if not exists public.secretaria_documentos_emitidos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  registro_id uuid not null references public.secretaria_registros_sacramentais(id) on delete cascade,
  tipo text not null check(tipo in ('CERTIDAO','SEGUNDA_VIA')),
  motivo text not null default '',
  emitido_por uuid,
  emitido_por_nome text not null,
  created_at timestamptz not null default now()
);
create index if not exists documentos_emitidos_registro_idx on public.secretaria_documentos_emitidos(registro_id,created_at desc);
alter table public.secretaria_documentos_emitidos enable row level security;
create policy "documentos sacramentais emitidos" on public.secretaria_documentos_emitidos for all to authenticated using(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check(public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));

commit;
