begin;

create or replace function public.pode_operar()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()), false) $$;

create or replace function public.pode_coordenar()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador') from public.meu_perfil()), false) $$;

create or replace function public.pode_campo()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador', 'voluntario') from public.meu_perfil()), false) $$;

create table if not exists public.familias (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.voluntarios (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.doadores (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.parceiros (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.visitas (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.areas_pastorais (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.campanhas_cestas (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.movimentacoes_cestas (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.distribuicoes_cestas (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.configuracoes (id text primary key, paroquia_id uuid not null references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.auditoria (id text primary key, paroquia_id uuid references public.paroquias(id), dados jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

do $$ declare tabela text; begin
  foreach tabela in array array['familias','voluntarios','doadores','parceiros','visitas','areas_pastorais','campanhas_cestas','movimentacoes_cestas','distribuicoes_cestas','configuracoes'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('drop policy if exists "leitura paroquia" on public.%I', tabela);
    execute format('create policy "leitura paroquia" on public.%I for select to authenticated using (public.mesma_paroquia(paroquia_id))', tabela);
  end loop;
end $$;

do $$ declare tabela text; begin
  foreach tabela in array array['familias','doadores','campanhas_cestas','movimentacoes_cestas','configuracoes'] loop
    execute format('drop policy if exists "escrita operacao" on public.%I', tabela);
    execute format('create policy "escrita operacao" on public.%I for all to authenticated using (public.mesma_paroquia(paroquia_id) and public.pode_operar()) with check (public.mesma_paroquia(paroquia_id) and public.pode_operar())', tabela);
  end loop;
end $$;

do $$ declare tabela text; begin
  foreach tabela in array array['voluntarios','parceiros','areas_pastorais'] loop
    execute format('drop policy if exists "escrita coordenacao" on public.%I', tabela);
    execute format('create policy "escrita coordenacao" on public.%I for all to authenticated using (public.mesma_paroquia(paroquia_id) and public.pode_coordenar()) with check (public.mesma_paroquia(paroquia_id) and public.pode_coordenar())', tabela);
  end loop;
end $$;

drop policy if exists "escrita campo" on public.visitas;
create policy "escrita campo" on public.visitas for all to authenticated using (public.mesma_paroquia(paroquia_id) and public.pode_campo()) with check (public.mesma_paroquia(paroquia_id) and public.pode_campo());
drop policy if exists "escrita campo" on public.distribuicoes_cestas;
create policy "escrita campo" on public.distribuicoes_cestas for all to authenticated using (public.mesma_paroquia(paroquia_id) and public.pode_campo()) with check (public.mesma_paroquia(paroquia_id) and public.pode_campo());
drop policy if exists "auditoria imutavel" on public.auditoria;
create policy "auditoria imutavel" on public.auditoria for select to authenticated using (public.sou_admin() and public.mesma_paroquia(paroquia_id));

create index if not exists familias_paroquia_idx on public.familias(paroquia_id);
create index if not exists visitas_paroquia_idx on public.visitas(paroquia_id);
create index if not exists movimentacoes_paroquia_idx on public.movimentacoes_cestas(paroquia_id);
create index if not exists distribuicoes_paroquia_idx on public.distribuicoes_cestas(paroquia_id);

commit;
