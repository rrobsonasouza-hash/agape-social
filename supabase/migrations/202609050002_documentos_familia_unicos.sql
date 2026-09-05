begin;

create unique index if not exists familias_cpf_unico_por_paroquia
  on public.familias (
    paroquia_id,
    regexp_replace(coalesce(dados->>'cpf', ''), '\D', '', 'g')
  )
  where regexp_replace(coalesce(dados->>'cpf', ''), '\D', '', 'g') <> '';

create unique index if not exists familias_rg_unico_por_paroquia
  on public.familias (
    paroquia_id,
    upper(regexp_replace(coalesce(dados->>'rg', ''), '[^a-zA-Z0-9]', '', 'g'))
  )
  where upper(regexp_replace(coalesce(dados->>'rg', ''), '[^a-zA-Z0-9]', '', 'g')) <> '';

commit;
