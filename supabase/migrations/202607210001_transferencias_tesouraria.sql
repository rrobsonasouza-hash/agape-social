begin;

create or replace function public.registrar_transferencia_tesouraria(
  p_paroquia_id uuid,
  p_conta_origem_id uuid,
  p_conta_destino_id uuid,
  p_valor numeric,
  p_data date,
  p_descricao text,
  p_criado_por uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare transferencia_id uuid := gen_random_uuid(); saldo_origem numeric;
begin
  if p_conta_origem_id = p_conta_destino_id then raise exception 'Selecione contas diferentes'; end if;
  if p_valor <= 0 then raise exception 'Informe um valor maior que zero'; end if;
  if length(trim(coalesce(p_descricao,''))) < 3 then raise exception 'Informe a descrição da transferência'; end if;
  if not exists(select 1 from public.tesouraria_contas where id=p_conta_origem_id and paroquia_id=p_paroquia_id and ativa) then raise exception 'Conta de origem inválida'; end if;
  if not exists(select 1 from public.tesouraria_contas where id=p_conta_destino_id and paroquia_id=p_paroquia_id and ativa) then raise exception 'Conta de destino inválida'; end if;
  select c.saldo_inicial + coalesce(sum(case when m.tipo in ('ENTRADA','TRANSFERENCIA_ENTRADA') then m.valor else -m.valor end) filter (where m.status='CONFIRMADA'),0)
    into saldo_origem from public.tesouraria_contas c left join public.tesouraria_movimentacoes m on m.conta_id=c.id
    where c.id=p_conta_origem_id and c.paroquia_id=p_paroquia_id group by c.saldo_inicial;
  if saldo_origem < p_valor then raise exception 'Saldo insuficiente na conta de origem'; end if;

  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
  values(p_paroquia_id,p_conta_origem_id,'TRANSFERENCIA_SAIDA',p_valor,p_data,trim(p_descricao),'TRANSFERENCIA',transferencia_id::text,p_criado_por);
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
  values(p_paroquia_id,p_conta_destino_id,'TRANSFERENCIA_ENTRADA',p_valor,p_data,trim(p_descricao),'TRANSFERENCIA',transferencia_id::text||':entrada',p_criado_por);
  return transferencia_id;
end $$;

revoke all on function public.registrar_transferencia_tesouraria(uuid,uuid,uuid,numeric,date,text,uuid) from public,anon,authenticated;
grant execute on function public.registrar_transferencia_tesouraria(uuid,uuid,uuid,numeric,date,text,uuid) to service_role;

commit;
