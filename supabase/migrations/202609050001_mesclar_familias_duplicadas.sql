begin;

create or replace function public.mesclar_familias_duplicadas(
  p_paroquia_id uuid,
  p_manter_id uuid,
  p_remover_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_principal jsonb;
  v_duplicado jsonb;
  v_combinado jsonb;
  v_nome text;
  v_distribuicoes integer;
  v_movimentacoes integer;
  v_visitas integer;
  v_documentos integer;
begin
  if p_manter_id = p_remover_id then raise exception 'Selecione dois cadastros diferentes.'; end if;

  select dados into v_principal from public.familias
   where id = p_manter_id::text and paroquia_id = p_paroquia_id for update;
  select dados into v_duplicado from public.familias
   where id = p_remover_id::text and paroquia_id = p_paroquia_id for update;
  if v_principal is null or v_duplicado is null then raise exception 'Um dos cadastros não foi encontrado.'; end if;

  if not (
    (regexp_replace(coalesce(v_principal->>'cpf',''), '\D', '', 'g') <> '' and regexp_replace(coalesce(v_principal->>'cpf',''), '\D', '', 'g') = regexp_replace(coalesce(v_duplicado->>'cpf',''), '\D', '', 'g'))
    or
    (upper(regexp_replace(coalesce(v_principal->>'rg',''), '[^a-zA-Z0-9]', '', 'g')) <> '' and upper(regexp_replace(coalesce(v_principal->>'rg',''), '[^a-zA-Z0-9]', '', 'g')) = upper(regexp_replace(coalesce(v_duplicado->>'rg',''), '[^a-zA-Z0-9]', '', 'g')))
  ) then raise exception 'Os cadastros não possuem o mesmo CPF ou RG.'; end if;

  v_combinado := v_duplicado || v_principal;
  if coalesce(trim(v_principal->>'observacoes'),'') = '' then
    v_combinado := jsonb_set(v_combinado, '{observacoes}', to_jsonb(coalesce(v_duplicado->>'observacoes','')));
  elsif coalesce(trim(v_duplicado->>'observacoes'),'') <> '' and trim(v_principal->>'observacoes') <> trim(v_duplicado->>'observacoes') then
    v_combinado := jsonb_set(v_combinado, '{observacoes}', to_jsonb(trim(v_principal->>'observacoes') || E'\n' || trim(v_duplicado->>'observacoes')));
  end if;
  v_nome := v_combinado->>'nomeResponsavel';

  update public.familias set dados = v_combinado, updated_at = now() where id = p_manter_id::text and paroquia_id = p_paroquia_id;
  update public.distribuicoes_cestas set dados = jsonb_set(jsonb_set(dados, '{familiaId}', to_jsonb(p_manter_id::text)), '{familiaNome}', to_jsonb(v_nome)), updated_at = now() where paroquia_id = p_paroquia_id and dados->>'familiaId' = p_remover_id::text;
  get diagnostics v_distribuicoes = row_count;
  update public.movimentacoes_cestas set dados = jsonb_set(jsonb_set(dados, '{familiaId}', to_jsonb(p_manter_id::text)), '{familiaNome}', to_jsonb(v_nome)), updated_at = now() where paroquia_id = p_paroquia_id and dados->>'familiaId' = p_remover_id::text;
  get diagnostics v_movimentacoes = row_count;
  update public.visitas set dados = jsonb_set(jsonb_set(dados, '{familiaId}', to_jsonb(p_manter_id::text)), '{familiaNome}', to_jsonb(v_nome)), updated_at = now() where paroquia_id = p_paroquia_id and dados->>'familiaId' = p_remover_id::text;
  get diagnostics v_visitas = row_count;
  update public.documentos set entidade_id = p_manter_id::text, updated_at = now() where paroquia_id = p_paroquia_id and entidade_tipo = 'FAMILIA' and entidade_id = p_remover_id::text;
  get diagnostics v_documentos = row_count;
  delete from public.familias where id = p_remover_id::text and paroquia_id = p_paroquia_id;

  return jsonb_build_object('id', p_manter_id, 'transferidos', jsonb_build_object('distribuicoes', v_distribuicoes, 'movimentacoes', v_movimentacoes, 'visitas', v_visitas, 'documentos', v_documentos));
end;
$$;

revoke all on function public.mesclar_familias_duplicadas(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.mesclar_familias_duplicadas(uuid, uuid, uuid) to service_role;

commit;
