begin;

alter table public.secretaria_dizimos_pagamentos
  add column if not exists status text not null default 'CONFIRMADO';
alter table public.secretaria_dizimos_pagamentos
  add column if not exists cancelado_em timestamptz;
alter table public.secretaria_dizimos_pagamentos
  add column if not exists cancelado_por uuid references auth.users(id);
alter table public.secretaria_dizimos_pagamentos
  add column if not exists motivo_cancelamento text;
alter table public.secretaria_dizimos_pagamentos
  drop constraint if exists secretaria_dizimos_pagamentos_dizimista_id_competencia_key;
alter table public.secretaria_dizimos_pagamentos
  drop constraint if exists secretaria_dizimos_pagamentos_status_check;
alter table public.secretaria_dizimos_pagamentos
  add constraint secretaria_dizimos_pagamentos_status_check check (status in ('CONFIRMADO','CANCELADO'));
create unique index if not exists secretaria_dizimos_pagamento_ativo_idx
  on public.secretaria_dizimos_pagamentos(dizimista_id, competencia)
  where status = 'CONFIRMADO';

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
  if exists(select 1 from public.secretaria_dizimos_pagamentos where dizimista_id=p_dizimista_id and competencia=p_competencia and status='CONFIRMADO') then raise exception 'O dízimo desta competência já foi registrado'; end if;
  select id into categoria from public.tesouraria_categorias where paroquia_id=p_paroquia_id and lower(nome)='dízimos' and natureza='RECEITA' limit 1;
  if categoria is null then insert into public.tesouraria_categorias(paroquia_id,nome,natureza) values(p_paroquia_id,'Dízimos','RECEITA') returning id into categoria; end if;
  insert into public.secretaria_dizimos_pagamentos(paroquia_id,dizimista_id,competencia,data_pagamento,valor,forma_pagamento,conta_id,observacao,criado_por)
    values(p_paroquia_id,p_dizimista_id,p_competencia,p_data_pagamento,p_valor,p_forma_pagamento,p_conta_id,coalesce(p_observacao,''),p_criado_por) returning id into pagamento;
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,categoria_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
    values(p_paroquia_id,p_conta_id,categoria,'ENTRADA',p_valor,p_data_pagamento,'Dízimo - '||dizimista.titular_nome,'DIZIMO',pagamento::text,p_criado_por) returning id into movimento;
  update public.secretaria_dizimos_pagamentos set movimentacao_id=movimento where id=pagamento;
  return pagamento;
end $$;

create or replace function public.cancelar_pagamento_dizimo(
  p_paroquia_id uuid, p_pagamento_id uuid, p_motivo text, p_cancelado_por uuid
) returns void language plpgsql security definer set search_path=public as $$
declare pagamento public.secretaria_dizimos_pagamentos%rowtype;
begin
  if length(trim(coalesce(p_motivo,''))) < 5 then raise exception 'Informe o motivo do cancelamento'; end if;
  select * into pagamento from public.secretaria_dizimos_pagamentos
    where id=p_pagamento_id and paroquia_id=p_paroquia_id for update;
  if not found then raise exception 'Pagamento não encontrado'; end if;
  if pagamento.status='CANCELADO' then raise exception 'Este pagamento já foi cancelado'; end if;
  update public.tesouraria_movimentacoes set status='CANCELADA',updated_at=now()
    where id=pagamento.movimentacao_id and paroquia_id=p_paroquia_id and status='CONFIRMADA';
  update public.secretaria_dizimos_pagamentos set status='CANCELADO',cancelado_em=now(),
    cancelado_por=p_cancelado_por,motivo_cancelamento=trim(p_motivo)
    where id=pagamento.id;
end $$;
revoke all on function public.cancelar_pagamento_dizimo(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.cancelar_pagamento_dizimo(uuid,uuid,text,uuid) to service_role;

commit;
