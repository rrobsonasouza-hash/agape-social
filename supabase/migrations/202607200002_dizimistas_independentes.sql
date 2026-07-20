begin;

-- Compatibilidade caso a primeira versão da migração já tenha sido aplicada.
alter table public.secretaria_dizimistas add column if not exists cpf text not null default '';
alter table public.secretaria_dizimistas add column if not exists email text not null default '';
alter table public.secretaria_dizimistas drop constraint if exists secretaria_dizimistas_paroquia_id_familia_id_key;
alter table public.secretaria_dizimistas drop constraint if exists secretaria_dizimistas_familia_id_fkey;
alter table public.secretaria_dizimistas drop column if exists familia_id;
create unique index if not exists secretaria_dizimistas_cpf_idx on public.secretaria_dizimistas(paroquia_id, cpf) where cpf <> '';

commit;
