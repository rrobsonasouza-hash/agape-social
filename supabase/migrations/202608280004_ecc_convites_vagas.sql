begin;

alter table public.ecc_encontro_casais
  add column if not exists convite_enviado_em timestamptz,
  add column if not exists resposta_em timestamptz,
  add column if not exists confirmado_em timestamptz;

create index if not exists ecc_encontro_casais_convites_idx
  on public.ecc_encontro_casais(encontro_id, situacao, convite_enviado_em);

comment on column public.ecc_encontro_casais.convite_enviado_em is
  'Data em que a equipe registrou o envio do convite ao casal.';
comment on column public.ecc_encontro_casais.resposta_em is
  'Data da primeira resposta registrada para o convite ou inscrição.';
comment on column public.ecc_encontro_casais.confirmado_em is
  'Data em que a participação do casal foi confirmada.';

commit;
