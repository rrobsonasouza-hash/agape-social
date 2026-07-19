begin;

alter table public.secretaria_movimentacoes_estoque
  drop constraint if exists secretaria_movimentacoes_estoque_tipo_check;
alter table public.secretaria_movimentacoes_estoque
  add constraint secretaria_movimentacoes_estoque_tipo_check
  check (tipo in ('ENTRADA','SAIDA','AJUSTE'));

create or replace function public.registrar_movimentacao_estoque_secretaria(
  p_paroquia_id uuid,
  p_produto_id uuid,
  p_tipo text,
  p_quantidade integer,
  p_motivo text,
  p_criado_por uuid
) returns integer language plpgsql security definer set search_path = public as $$
declare anterior integer; posterior integer; variacao integer;
begin
  if p_tipo not in ('ENTRADA','SAIDA') then raise exception 'Tipo de movimentação inválido'; end if;
  if p_quantidade <= 0 then raise exception 'A quantidade deve ser maior que zero'; end if;
  if char_length(trim(p_motivo)) < 3 then raise exception 'Informe o motivo da movimentação'; end if;
  select estoque into anterior from public.secretaria_produtos
    where id = p_produto_id and paroquia_id = p_paroquia_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  variacao := case when p_tipo = 'ENTRADA' then p_quantidade else -p_quantidade end;
  posterior := anterior + variacao;
  if posterior < 0 then raise exception 'A saída é maior que o estoque atual'; end if;
  update public.secretaria_produtos set estoque = posterior, updated_at = now() where id = p_produto_id;
  insert into public.secretaria_movimentacoes_estoque(paroquia_id, produto_id, tipo, quantidade, estoque_anterior, estoque_posterior, motivo, criado_por)
    values(p_paroquia_id, p_produto_id, p_tipo, variacao, anterior, posterior, trim(p_motivo), p_criado_por);
  return posterior;
end $$;

revoke all on function public.registrar_movimentacao_estoque_secretaria(uuid,uuid,text,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.registrar_movimentacao_estoque_secretaria(uuid,uuid,text,integer,text,uuid) to service_role;

commit;
