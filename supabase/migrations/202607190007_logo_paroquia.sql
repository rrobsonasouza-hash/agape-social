begin;

alter table public.paroquias
  add column if not exists logo_caminho text;

commit;
