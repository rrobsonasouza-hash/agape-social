begin;

create table if not exists public.convites_usuarios (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  perfil public.perfil_acesso not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists convites_usuarios_paroquia_idx on public.convites_usuarios(paroquia_id, created_at desc);
create index if not exists convites_usuarios_validade_idx on public.convites_usuarios(expires_at) where used_at is null and revoked_at is null;

alter table public.convites_usuarios enable row level security;

drop policy if exists "convites usuarios administracao" on public.convites_usuarios;
create policy "convites usuarios administracao" on public.convites_usuarios for all to authenticated
using (
  public.mesma_paroquia(paroquia_id)
  and (select perfil::text in ('admin_plataforma', 'admin_paroquia') from public.meu_perfil())
)
with check (
  public.mesma_paroquia(paroquia_id)
  and (select perfil::text in ('admin_plataforma', 'admin_paroquia') from public.meu_perfil())
);

commit;
