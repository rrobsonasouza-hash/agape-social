begin;

create table if not exists public.ecc_credenciamentos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  casal_id uuid not null references public.ecc_casais(id) on delete cascade,
  status text not null default 'AGUARDANDO' check (status in ('AGUARDANDO', 'CREDENCIADO', 'AUSENTE', 'CANCELADO')),
  credenciado_em timestamptz,
  cracha_entregue boolean not null default false,
  material_entregue boolean not null default false,
  observacoes text not null default '',
  registrado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (encontro_id, casal_id)
);

create index if not exists ecc_credenciamentos_painel_idx
  on public.ecc_credenciamentos(encontro_id, status, credenciado_em);

alter table public.ecc_credenciamentos enable row level security;

drop policy if exists "ecc leitura na paroquia" on public.ecc_credenciamentos;
create policy "ecc leitura na paroquia"
  on public.ecc_credenciamentos for select to authenticated
  using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc gestao pastoral" on public.ecc_credenciamentos;
create policy "ecc gestao pastoral"
  on public.ecc_credenciamentos for all to authenticated
  using (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  )
  with check (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  );

commit;
