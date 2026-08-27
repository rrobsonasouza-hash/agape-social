-- Estrutura as frentes de atuação nos cadastros legados e leva os casais do ECC
-- para o banco de casais, sem vinculá-los automaticamente a uma edição.

update public.voluntarios
set dados = dados || jsonb_build_object(
  'atuaEcc', coalesce(nullif(dados ->> 'atuaEcc', '')::boolean, (dados ->> 'pastoral') ~* '(^|[^a-z])ECC([^a-z]|$)'),
  'funcaoEcc', coalesce(nullif(dados ->> 'funcaoEcc', ''), case when (dados ->> 'pastoral') ~* '(^|[^a-z])ECC([^a-z]|$)' then coalesce(dados ->> 'funcao', 'Voluntário') else '' end),
  'atuaPromocaoHumana', coalesce(
    nullif(dados ->> 'atuaPromocaoHumana', '')::boolean,
    not ((dados ->> 'pastoral') ~* '(^|[^a-z])ECC([^a-z]|$)') or (dados ->> 'pastoral') ~* '(social|promoção humana)'
  ),
  'funcaoPromocaoHumana', coalesce(
    nullif(dados ->> 'funcaoPromocaoHumana', ''),
    case when not ((dados ->> 'pastoral') ~* '(^|[^a-z])ECC([^a-z]|$)') or (dados ->> 'pastoral') ~* '(social|promoção humana)'
      then coalesce(dados ->> 'funcao', 'Voluntário') else '' end
  )
)
where dados is not null;

insert into public.ecc_casais (
  paroquia_id, conjuge_um_nome, conjuge_dois_nome, telefone, email,
  voluntario_um_id, situacao, observacoes,
  cep, logradouro, numero, complemento, bairro, cidade, estado
)
select
  v.paroquia_id,
  trim(v.dados ->> 'nome'),
  trim(v.dados ->> 'conjugeNome'),
  coalesce(v.dados ->> 'telefone', ''),
  coalesce(v.dados ->> 'email', ''),
  v.id,
  'ELEGIVEL',
  'Casal criado automaticamente a partir do cadastro de voluntário do ECC.',
  coalesce(v.dados ->> 'cep', ''),
  coalesce(v.dados ->> 'logradouro', ''),
  coalesce(v.dados ->> 'numero', ''),
  coalesce(v.dados ->> 'complemento', ''),
  coalesce(v.dados ->> 'bairro', ''),
  coalesce(v.dados ->> 'cidade', ''),
  upper(coalesce(v.dados ->> 'estado', ''))
from public.voluntarios v
where coalesce(nullif(v.dados ->> 'atuaEcc', '')::boolean, false)
  and coalesce(v.dados ->> 'status', 'ATIVO') = 'ATIVO'
  and nullif(trim(v.dados ->> 'conjugeNome'), '') is not null
  and not exists (
    select 1 from public.ecc_casais c
    where c.paroquia_id = v.paroquia_id
      and (c.voluntario_um_id = v.id or c.voluntario_dois_id = v.id)
  )
  and not exists (
    select 1 from public.ecc_casais c
    where c.paroquia_id = v.paroquia_id
      and lower(trim(c.conjuge_um_nome)) = lower(trim(v.dados ->> 'nome'))
      and lower(trim(c.conjuge_dois_nome)) = lower(trim(v.dados ->> 'conjugeNome'))
  );
