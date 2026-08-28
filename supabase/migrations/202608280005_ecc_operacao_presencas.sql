begin;

alter table public.ecc_credenciamentos
  add column if not exists restricoes_alimentares text not null default '',
  add column if not exists medicamentos text not null default '',
  add column if not exists contato_emergencia text not null default '',
  add column if not exists circulo text not null default '';

create table if not exists public.ecc_presencas_diarias (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  casal_id uuid not null references public.ecc_casais(id) on delete cascade,
  data date not null,
  presente boolean not null,
  registrado_em timestamptz not null default now(),
  registrado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (encontro_id, casal_id, data)
);

create index if not exists ecc_presencas_diarias_painel_idx
  on public.ecc_presencas_diarias(encontro_id, data, presente);

alter table public.ecc_presencas_diarias enable row level security;

drop policy if exists "ecc leitura na paroquia" on public.ecc_presencas_diarias;
create policy "ecc leitura na paroquia"
  on public.ecc_presencas_diarias for select to authenticated
  using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc gestao pastoral" on public.ecc_presencas_diarias;
create policy "ecc gestao pastoral"
  on public.ecc_presencas_diarias for all to authenticated
  using (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  )
  with check (
    public.mesma_paroquia(paroquia_id)
    and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
  );

commit;
