begin;

alter type public.perfil_acesso add value if not exists 'tesoureiro';

create table if not exists public.tesouraria_contas (
  id uuid primary key default gen_random_uuid(), paroquia_id uuid not null references public.paroquias(id), nome text not null,
  tipo text not null check (tipo in ('CAIXA','BANCO','CONTA_PAGAMENTO')), banco text not null default '', agencia text not null default '', numero_conta text not null default '',
  saldo_inicial numeric(12,2) not null default 0, ativa boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists tesouraria_contas_nome_idx on public.tesouraria_contas(paroquia_id, lower(nome));

create table if not exists public.tesouraria_categorias (
  id uuid primary key default gen_random_uuid(), paroquia_id uuid not null references public.paroquias(id), nome text not null,
  natureza text not null check (natureza in ('RECEITA','DESPESA')), ativa boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists tesouraria_categorias_nome_idx on public.tesouraria_categorias(paroquia_id, lower(nome), natureza);

create table if not exists public.tesouraria_movimentacoes (
  id uuid primary key default gen_random_uuid(), paroquia_id uuid not null references public.paroquias(id), conta_id uuid not null references public.tesouraria_contas(id),
  categoria_id uuid references public.tesouraria_categorias(id), tipo text not null check (tipo in ('ENTRADA','SAIDA','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SAIDA')),
  valor numeric(12,2) not null check (valor > 0), data date not null default current_date, descricao text not null, origem text not null default 'MANUAL', origem_id text,
  status text not null default 'CONFIRMADA' check (status in ('CONFIRMADA','CANCELADA')), criado_por uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists tesouraria_movimentacao_origem_idx on public.tesouraria_movimentacoes(paroquia_id, origem, origem_id) where origem_id is not null;
create index if not exists tesouraria_movimentacoes_data_idx on public.tesouraria_movimentacoes(paroquia_id, data desc);

alter table public.tesouraria_contas enable row level security;
alter table public.tesouraria_categorias enable row level security;
alter table public.tesouraria_movimentacoes enable row level security;
drop policy if exists "tesouraria contas" on public.tesouraria_contas;
create policy "tesouraria contas" on public.tesouraria_contas for all to authenticated using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil())) with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil()));
drop policy if exists "tesouraria categorias" on public.tesouraria_categorias;
create policy "tesouraria categorias" on public.tesouraria_categorias for all to authenticated using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil())) with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil()));
drop policy if exists "tesouraria movimentacoes" on public.tesouraria_movimentacoes;
create policy "tesouraria movimentacoes" on public.tesouraria_movimentacoes for all to authenticated using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil())) with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil()));

create or replace function public.integrar_venda_tesouraria() returns trigger language plpgsql security definer set search_path = public as $$
declare conta uuid; categoria uuid; nome_conta text; tipo_conta text;
begin
  if new.status <> 'CONCLUIDA' or new.forma_pagamento = 'CORTESIA' then return new; end if;
  nome_conta := case when new.forma_pagamento = 'DINHEIRO' then 'Caixa da Secretaria' else 'Recebimentos Digitais' end;
  tipo_conta := case when new.forma_pagamento = 'DINHEIRO' then 'CAIXA' else 'CONTA_PAGAMENTO' end;
  select id into conta from public.tesouraria_contas where paroquia_id = new.paroquia_id and lower(nome) = lower(nome_conta) limit 1;
  if conta is null then insert into public.tesouraria_contas(paroquia_id,nome,tipo) values(new.paroquia_id,nome_conta,tipo_conta) returning id into conta; end if;
  select id into categoria from public.tesouraria_categorias where paroquia_id = new.paroquia_id and lower(nome) = 'vendas da secretaria' and natureza = 'RECEITA' limit 1;
  if categoria is null then insert into public.tesouraria_categorias(paroquia_id,nome,natureza) values(new.paroquia_id,'Vendas da Secretaria','RECEITA') returning id into categoria; end if;
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,categoria_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
  values(new.paroquia_id,conta,categoria,'ENTRADA',new.total,new.created_at::date,'Venda da Secretaria','VENDA_SECRETARIA',new.id::text,new.criado_por) on conflict do nothing;
  return new;
end $$;
drop trigger if exists secretaria_venda_tesouraria on public.secretaria_vendas;
create trigger secretaria_venda_tesouraria after insert or update on public.secretaria_vendas for each row execute function public.integrar_venda_tesouraria();
update public.secretaria_vendas set status = status where status = 'CONCLUIDA' and forma_pagamento <> 'CORTESIA';

commit;
