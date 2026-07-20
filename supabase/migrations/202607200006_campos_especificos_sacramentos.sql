begin;

alter table public.secretaria_registros_sacramentais
  add column if not exists dados_especificos jsonb not null default '{}'::jsonb;

commit;
