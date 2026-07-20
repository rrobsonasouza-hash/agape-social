begin;

create table if not exists public.secretaria_dizimistas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  familia_id text not null references public.familias(id),
  titular_nome text not null,
  conjuge_nome text not null default '',
  telefone text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (paroquia_id, familia_id)
);

create table if not exists public.secretaria_dizimos_pagamentos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  dizimista_id uuid not null references public.secretaria_dizimistas(id),
  competencia date not null,
  data_pagamento date not null default current_date,
  valor numeric(12,2) not null check (valor > 0),
  forma_pagamento text not null check (forma_pagamento in ('DINHEIRO','PIX','CARTAO','TRANSFERENCIA')),
  conta_id uuid not null references public.tesouraria_contas(id),
  movimentacao_id uuid references public.tesouraria_movimentacoes(id),
  observacao text not null default '',
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (dizimista_id, competencia)
);

create index if not exists secretaria_dizimistas_paroquia_idx on public.secretaria_dizimistas(paroquia_id, ativo);
create index if not exists secretaria_dizimos_competencia_idx on public.secretaria_dizimos_pagamentos(paroquia_id, competencia desc);

alter table public.secretaria_dizimistas enable row level security;
alter table public.secretaria_dizimos_pagamentos enable row level security;
create policy "dizimistas secretaria" on public.secretaria_dizimistas for all to authenticated
  using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria','tesoureiro') from public.meu_perfil()))
  with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria','tesoureiro') from public.meu_perfil()));
create policy "pagamentos dizimos" on public.secretaria_dizimos_pagamentos for all to authenticated
  using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria','tesoureiro') from public.meu_perfil()))
  with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria','tesoureiro') from public.meu_perfil()));

create or replace function public.registrar_pagamento_dizimo(
  p_paroquia_id uuid, p_dizimista_id uuid, p_competencia date, p_data_pagamento date,
  p_valor numeric, p_forma_pagamento text, p_conta_id uuid, p_observacao text, p_criado_por uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare dizimista public.secretaria_dizimistas%rowtype; categoria uuid; pagamento uuid; movimento uuid;
begin
  select * into dizimista from public.secretaria_dizimistas where id=p_dizimista_id and paroquia_id=p_paroquia_id and ativo;
  if not found then raise exception 'Dizimista não encontrado ou inativo'; end if;
  if extract(day from p_competencia) <> 1 then raise exception 'A competência deve ser o primeiro dia do mês'; end if;
  if p_valor <= 0 then raise exception 'Informe um valor maior que zero'; end if;
  if p_forma_pagamento not in ('DINHEIRO','PIX','CARTAO','TRANSFERENCIA') then raise exception 'Forma de pagamento inválida'; end if;
  if not exists(select 1 from public.tesouraria_contas where id=p_conta_id and paroquia_id=p_paroquia_id and ativa) then raise exception 'Selecione uma conta ativa'; end if;
  if exists(select 1 from public.secretaria_dizimos_pagamentos where dizimista_id=p_dizimista_id and competencia=p_competencia) then raise exception 'O dízimo desta competência já foi registrado'; end if;
  select id into categoria from public.tesouraria_categorias where paroquia_id=p_paroquia_id and lower(nome)='dízimos' and natureza='RECEITA' limit 1;
  if categoria is null then insert into public.tesouraria_categorias(paroquia_id,nome,natureza) values(p_paroquia_id,'Dízimos','RECEITA') returning id into categoria; end if;
  insert into public.secretaria_dizimos_pagamentos(paroquia_id,dizimista_id,competencia,data_pagamento,valor,forma_pagamento,conta_id,observacao,criado_por)
    values(p_paroquia_id,p_dizimista_id,p_competencia,p_data_pagamento,p_valor,p_forma_pagamento,p_conta_id,coalesce(p_observacao,''),p_criado_por) returning id into pagamento;
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,categoria_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
    values(p_paroquia_id,p_conta_id,categoria,'ENTRADA',p_valor,p_data_pagamento,'Dízimo - '||dizimista.titular_nome,'DIZIMO',pagamento::text,p_criado_por) returning id into movimento;
  update public.secretaria_dizimos_pagamentos set movimentacao_id=movimento where id=pagamento;
  return pagamento;
end $$;
revoke all on function public.registrar_pagamento_dizimo(uuid,uuid,date,date,numeric,text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.registrar_pagamento_dizimo(uuid,uuid,date,date,numeric,text,uuid,text,uuid) to service_role;

commit;
