create index if not exists idx_ecc_casais_paroquia_voluntario_um
  on public.ecc_casais (paroquia_id, voluntario_um_id)
  where voluntario_um_id is not null;

create index if not exists idx_ecc_casais_paroquia_voluntario_dois
  on public.ecc_casais (paroquia_id, voluntario_dois_id)
  where voluntario_dois_id is not null;

create or replace function public.sincronizar_casal_voluntario_ecc(
  p_paroquia_id uuid,
  p_voluntario_id text,
  p_dados jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_casal public.ecc_casais%rowtype;
  v_nome text := trim(coalesce(p_dados ->> 'nome', ''));
  v_conjuge text := trim(coalesce(p_dados ->> 'conjugeNome', ''));
  v_latitude numeric := case when jsonb_typeof(p_dados -> 'latitude') = 'number' then (p_dados ->> 'latitude')::numeric else null end;
  v_longitude numeric := case when jsonb_typeof(p_dados -> 'longitude') = 'number' then (p_dados ->> 'longitude')::numeric else null end;
begin
  if not coalesce(nullif(p_dados ->> 'atuaEcc', '')::boolean, false)
     or coalesce(p_dados ->> 'status', 'ATIVO') <> 'ATIVO'
     or v_conjuge = '' then
    return null;
  end if;

  select * into v_casal
  from public.ecc_casais
  where paroquia_id = p_paroquia_id
    and (voluntario_um_id = p_voluntario_id or voluntario_dois_id = p_voluntario_id)
  limit 1;

  if v_casal.id is null then
    select * into v_casal
    from public.ecc_casais
    where paroquia_id = p_paroquia_id
      and (
        (lower(trim(conjuge_um_nome)) = lower(v_nome) and lower(trim(conjuge_dois_nome)) = lower(v_conjuge))
        or
        (lower(trim(conjuge_um_nome)) = lower(v_conjuge) and lower(trim(conjuge_dois_nome)) = lower(v_nome))
      )
    limit 1;
  end if;

  if v_casal.id is null then
    insert into public.ecc_casais (
      paroquia_id, conjuge_um_nome, conjuge_dois_nome, telefone, email,
      voluntario_um_id, situacao, observacoes, cep, logradouro, numero,
      complemento, bairro, cidade, estado, latitude, longitude
    ) values (
      p_paroquia_id, v_nome, v_conjuge, coalesce(p_dados ->> 'telefone', ''),
      coalesce(p_dados ->> 'email', ''), p_voluntario_id, 'ELEGIVEL',
      'Casal criado automaticamente a partir do cadastro de voluntário do ECC.',
      coalesce(p_dados ->> 'cep', ''), coalesce(p_dados ->> 'logradouro', ''),
      coalesce(p_dados ->> 'numero', ''), coalesce(p_dados ->> 'complemento', ''),
      coalesce(p_dados ->> 'bairro', ''), coalesce(p_dados ->> 'cidade', ''),
      upper(coalesce(p_dados ->> 'estado', '')), v_latitude, v_longitude
    ) returning id into v_casal.id;
    return v_casal.id;
  end if;

  if v_casal.voluntario_dois_id = p_voluntario_id or lower(trim(v_casal.conjuge_dois_nome)) = lower(v_nome) then
    update public.ecc_casais set
      conjuge_um_nome = v_conjuge, conjuge_dois_nome = v_nome,
      voluntario_dois_id = p_voluntario_id,
      telefone = coalesce(p_dados ->> 'telefone', ''), email = coalesce(p_dados ->> 'email', ''),
      cep = coalesce(p_dados ->> 'cep', ''), logradouro = coalesce(p_dados ->> 'logradouro', ''),
      numero = coalesce(p_dados ->> 'numero', ''), complemento = coalesce(p_dados ->> 'complemento', ''),
      bairro = coalesce(p_dados ->> 'bairro', ''), cidade = coalesce(p_dados ->> 'cidade', ''),
      estado = upper(coalesce(p_dados ->> 'estado', '')), latitude = v_latitude,
      longitude = v_longitude, updated_at = now()
    where id = v_casal.id and paroquia_id = p_paroquia_id;
  else
    update public.ecc_casais set
      conjuge_um_nome = v_nome, conjuge_dois_nome = v_conjuge,
      voluntario_um_id = p_voluntario_id,
      telefone = coalesce(p_dados ->> 'telefone', ''), email = coalesce(p_dados ->> 'email', ''),
      cep = coalesce(p_dados ->> 'cep', ''), logradouro = coalesce(p_dados ->> 'logradouro', ''),
      numero = coalesce(p_dados ->> 'numero', ''), complemento = coalesce(p_dados ->> 'complemento', ''),
      bairro = coalesce(p_dados ->> 'bairro', ''), cidade = coalesce(p_dados ->> 'cidade', ''),
      estado = upper(coalesce(p_dados ->> 'estado', '')), latitude = v_latitude,
      longitude = v_longitude, updated_at = now()
    where id = v_casal.id and paroquia_id = p_paroquia_id;
  end if;

  return v_casal.id;
end;
$$;

revoke all on function public.sincronizar_casal_voluntario_ecc(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.sincronizar_casal_voluntario_ecc(uuid, text, jsonb) to service_role;
