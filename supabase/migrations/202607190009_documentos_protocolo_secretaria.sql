begin;

alter table public.secretaria_solicitacoes
  add column if not exists documentos_checklist jsonb not null default '[]'::jsonb;

commit;
