begin;

create table if not exists public.secretaria_horarios_celebracoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  dia_semana integer not null check (dia_semana between 0 and 6),
  horario time not null,
  descricao text not null default 'Santa Missa',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(paroquia_id,dia_semana,horario)
);

alter table public.secretaria_horarios_celebracoes enable row level security;
create policy "horarios celebracoes leitura" on public.secretaria_horarios_celebracoes for select to authenticated using(public.mesma_paroquia(paroquia_id));
create policy "horarios celebracoes administracao" on public.secretaria_horarios_celebracoes for all to authenticated using(public.sou_admin()) with check(public.sou_admin());

commit;
