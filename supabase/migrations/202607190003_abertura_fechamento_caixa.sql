begin;

create table if not exists public.tesouraria_caixas (
  id uuid primary key default gen_random_uuid(), paroquia_id uuid not null references public.paroquias(id), conta_id uuid not null references public.tesouraria_contas(id),
  atendente_id uuid not null references auth.users(id), atendente_nome text not null, aberto_em timestamptz not null default now(), fundo_abertura numeric(12,2) not null check (fundo_abertura >= 0),
  status text not null default 'ABERTO' check (status in ('ABERTO','FECHADO','CONFERIDO')), fechado_em timestamptz, valor_esperado numeric(12,2), valor_contado numeric(12,2), diferenca numeric(12,2),
  observacao_fechamento text not null default '', conferido_por uuid references auth.users(id), conferido_em timestamptz, observacao_conferencia text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists tesouraria_caixa_aberto_usuario_idx on public.tesouraria_caixas(paroquia_id, atendente_id) where status = 'ABERTO';
create index if not exists tesouraria_caixas_data_idx on public.tesouraria_caixas(paroquia_id, aberto_em desc);

create table if not exists public.tesouraria_caixa_operacoes (
  id uuid primary key default gen_random_uuid(), paroquia_id uuid not null references public.paroquias(id), caixa_id uuid not null references public.tesouraria_caixas(id),
  tipo text not null check (tipo in ('REFORCO','SANGRIA')), valor numeric(12,2) not null check (valor > 0), descricao text not null, criado_por uuid references auth.users(id), created_at timestamptz not null default now()
);

alter table public.secretaria_vendas add column if not exists caixa_id uuid references public.tesouraria_caixas(id);
create index if not exists secretaria_vendas_caixa_idx on public.secretaria_vendas(caixa_id);

alter table public.tesouraria_caixas enable row level security;
alter table public.tesouraria_caixa_operacoes enable row level security;
drop policy if exists "caixa operador" on public.tesouraria_caixas;
create policy "caixa operador" on public.tesouraria_caixas for all to authenticated using (public.mesma_paroquia(paroquia_id) and (atendente_id = auth.uid() or (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil()))) with check (public.mesma_paroquia(paroquia_id) and (atendente_id = auth.uid() or (select perfil::text in ('admin_plataforma','admin_paroquia','tesoureiro') from public.meu_perfil())));
drop policy if exists "caixa operacoes" on public.tesouraria_caixa_operacoes;
create policy "caixa operacoes" on public.tesouraria_caixa_operacoes for all to authenticated using (public.mesma_paroquia(paroquia_id)) with check (public.mesma_paroquia(paroquia_id));

drop function if exists public.registrar_venda_secretaria(uuid,jsonb,text,numeric,uuid);
create function public.registrar_venda_secretaria(p_paroquia_id uuid, p_itens jsonb, p_forma_pagamento text, p_valor_recebido numeric, p_criado_por uuid, p_caixa_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare item jsonb; produto public.secretaria_produtos%rowtype; quantidade integer; total_calculado numeric(10,2):=0; venda_id uuid:=gen_random_uuid(); itens_registrados jsonb:='[]'::jsonb; troco_calculado numeric(10,2):=0;
begin
  if not exists(select 1 from public.tesouraria_caixas where id=p_caixa_id and paroquia_id=p_paroquia_id and atendente_id=p_criado_por and status='ABERTO') then raise exception 'Abra o caixa antes de registrar vendas'; end if;
  if p_forma_pagamento not in ('DINHEIRO','PIX','CARTAO','CORTESIA') then raise exception 'Forma de pagamento inválida'; end if;
  if jsonb_array_length(p_itens)=0 then raise exception 'A venda precisa ter pelo menos um item'; end if;
  for item in select * from jsonb_array_elements(p_itens) loop quantidade:=(item->>'quantidade')::integer; if quantidade<=0 then raise exception 'Quantidade inválida'; end if; select * into produto from public.secretaria_produtos where id=(item->>'produtoId')::uuid and paroquia_id=p_paroquia_id and ativo for update; if not found then raise exception 'Produto não encontrado ou inativo'; end if; if produto.estoque<quantidade then raise exception 'Estoque insuficiente para %',produto.nome; end if; update public.secretaria_produtos set estoque=estoque-quantidade,updated_at=now() where id=produto.id; total_calculado:=total_calculado+(produto.preco*quantidade); itens_registrados:=itens_registrados||jsonb_build_array(jsonb_build_object('produtoId',produto.id,'nome',produto.nome,'quantidade',quantidade,'precoUnitario',produto.preco,'subtotal',produto.preco*quantidade)); end loop;
  if p_forma_pagamento='DINHEIRO' then if coalesce(p_valor_recebido,0)<total_calculado then raise exception 'Valor recebido é menor que o total'; end if; troco_calculado:=p_valor_recebido-total_calculado; end if;
  insert into public.secretaria_vendas(id,paroquia_id,total,forma_pagamento,valor_recebido,troco,itens,criado_por,caixa_id) values(venda_id,p_paroquia_id,total_calculado,p_forma_pagamento,p_valor_recebido,troco_calculado,itens_registrados,p_criado_por,p_caixa_id); return venda_id;
end $$;
revoke all on function public.registrar_venda_secretaria(uuid,jsonb,text,numeric,uuid,uuid) from public,anon,authenticated;
grant execute on function public.registrar_venda_secretaria(uuid,jsonb,text,numeric,uuid,uuid) to service_role;

create or replace function public.integrar_venda_tesouraria() returns trigger language plpgsql security definer set search_path=public as $$
declare conta uuid; categoria uuid; nome_conta text; tipo_conta text;
begin if new.status<>'CONCLUIDA' or new.forma_pagamento='CORTESIA' then return new; end if;
  if new.forma_pagamento='DINHEIRO' and new.caixa_id is not null then select conta_id into conta from public.tesouraria_caixas where id=new.caixa_id; end if;
  if conta is null then nome_conta:=case when new.forma_pagamento='DINHEIRO' then 'Caixa da Secretaria' else 'Recebimentos Digitais' end; tipo_conta:=case when new.forma_pagamento='DINHEIRO' then 'CAIXA' else 'CONTA_PAGAMENTO' end; select id into conta from public.tesouraria_contas where paroquia_id=new.paroquia_id and lower(nome)=lower(nome_conta) limit 1; if conta is null then insert into public.tesouraria_contas(paroquia_id,nome,tipo) values(new.paroquia_id,nome_conta,tipo_conta) returning id into conta; end if; end if;
  select id into categoria from public.tesouraria_categorias where paroquia_id=new.paroquia_id and lower(nome)='vendas da secretaria' and natureza='RECEITA' limit 1; if categoria is null then insert into public.tesouraria_categorias(paroquia_id,nome,natureza) values(new.paroquia_id,'Vendas da Secretaria','RECEITA') returning id into categoria; end if;
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,categoria_id,tipo,valor,data,descricao,origem,origem_id,criado_por) values(new.paroquia_id,conta,categoria,'ENTRADA',new.total,new.created_at::date,'Venda da Secretaria','VENDA_SECRETARIA',new.id::text,new.criado_por) on conflict do nothing; return new;
end $$;

commit;
