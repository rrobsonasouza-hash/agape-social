begin;

alter table public.secretaria_solicitacoes
  add column if not exists solicitante_email text,
  add column if not exists detalhes jsonb not null default '{}'::jsonb,
  add column if not exists impresso_em timestamptz,
  add column if not exists impresso_por_nome text;

commit;
