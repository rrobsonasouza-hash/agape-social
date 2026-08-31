begin;

create table if not exists public.ecc_checkin_tentativas (
  id bigint generated always as identity primary key,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  ip_hash text not null,
  sucesso boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ecc_checkin_tentativas_limite_idx
  on public.ecc_checkin_tentativas(encontro_id, ip_hash, created_at desc)
  where sucesso = false;

alter table public.ecc_checkin_tentativas enable row level security;
comment on table public.ecc_checkin_tentativas is 'Controle interno antiabuso do check-in público; acessível somente pelo backend service role.';

commit;
