begin;

alter type public.perfil_acesso add value if not exists 'atendente_secretaria';

create table if not exists public.secretaria_produtos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  nome text not null,
  categoria text not null default 'Outros',
  preco numeric(10,2) not null check (preco >= 0),
  estoque integer not null default 0 check (estoque >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.secretaria_vendas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  total numeric(10,2) not null check (total >= 0),
  forma_pagamento text not null check (forma_pagamento in ('DINHEIRO','PIX','CARTAO','CORTESIA')),
  valor_recebido numeric(10,2),
  troco numeric(10,2) not null default 0,
  itens jsonb not null,
  status text not null default 'CONCLUIDA' check (status in ('CONCLUIDA','CANCELADA')),
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists secretaria_produtos_paroquia_idx on public.secretaria_produtos(paroquia_id, ativo);
create index if not exists secretaria_vendas_paroquia_data_idx on public.secretaria_vendas(paroquia_id, created_at desc);

alter table public.secretaria_produtos enable row level security;
alter table public.secretaria_vendas enable row level security;

drop policy if exists "secretaria produtos leitura" on public.secretaria_produtos;
create policy "secretaria produtos leitura" on public.secretaria_produtos for select to authenticated using (public.mesma_paroquia(paroquia_id));
drop policy if exists "secretaria produtos administracao" on public.secretaria_produtos;
create policy "secretaria produtos administracao" on public.secretaria_produtos for all to authenticated using (public.sou_admin()) with check (public.sou_admin());
drop policy if exists "secretaria vendas leitura" on public.secretaria_vendas;
create policy "secretaria vendas leitura" on public.secretaria_vendas for select to authenticated using (public.mesma_paroquia(paroquia_id));

create or replace function public.registrar_venda_secretaria(p_paroquia_id uuid, p_itens jsonb, p_forma_pagamento text, p_valor_recebido numeric, p_criado_por uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  item jsonb; produto public.secretaria_produtos%rowtype; quantidade integer; total_calculado numeric(10,2) := 0; venda_id uuid := gen_random_uuid(); itens_registrados jsonb := '[]'::jsonb; troco_calculado numeric(10,2) := 0;
begin
  if p_forma_pagamento not in ('DINHEIRO','PIX','CARTAO','CORTESIA') then raise exception 'Forma de pagamento inválida'; end if;
  if jsonb_array_length(p_itens) = 0 then raise exception 'A venda precisa ter pelo menos um item'; end if;
  for item in select * from jsonb_array_elements(p_itens) loop
    quantidade := (item->>'quantidade')::integer;
    if quantidade <= 0 then raise exception 'Quantidade inválida'; end if;
    select * into produto from public.secretaria_produtos where id = (item->>'produtoId')::uuid and paroquia_id = p_paroquia_id and ativo for update;
    if not found then raise exception 'Produto não encontrado ou inativo'; end if;
    if produto.estoque < quantidade then raise exception 'Estoque insuficiente para %', produto.nome; end if;
    update public.secretaria_produtos set estoque = estoque - quantidade, updated_at = now() where id = produto.id;
    total_calculado := total_calculado + (produto.preco * quantidade);
    itens_registrados := itens_registrados || jsonb_build_array(jsonb_build_object('produtoId', produto.id, 'nome', produto.nome, 'quantidade', quantidade, 'precoUnitario', produto.preco, 'subtotal', produto.preco * quantidade));
  end loop;
  if p_forma_pagamento = 'DINHEIRO' then
    if coalesce(p_valor_recebido, 0) < total_calculado then raise exception 'Valor recebido é menor que o total'; end if;
    troco_calculado := p_valor_recebido - total_calculado;
  end if;
  insert into public.secretaria_vendas(id, paroquia_id, total, forma_pagamento, valor_recebido, troco, itens, criado_por) values (venda_id, p_paroquia_id, total_calculado, p_forma_pagamento, p_valor_recebido, troco_calculado, itens_registrados, p_criado_por);
  return venda_id;
end $$;

revoke all on function public.registrar_venda_secretaria(uuid,jsonb,text,numeric,uuid) from public, anon, authenticated;
grant execute on function public.registrar_venda_secretaria(uuid,jsonb,text,numeric,uuid) to service_role;

commit;
