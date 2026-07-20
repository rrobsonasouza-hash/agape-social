begin;

alter table public.secretaria_dizimistas add column if not exists cep text not null default '';
alter table public.secretaria_dizimistas add column if not exists logradouro text not null default '';
alter table public.secretaria_dizimistas add column if not exists numero text not null default '';
alter table public.secretaria_dizimistas add column if not exists complemento text not null default '';
alter table public.secretaria_dizimistas add column if not exists bairro text not null default '';
alter table public.secretaria_dizimistas add column if not exists cidade text not null default '';
alter table public.secretaria_dizimistas add column if not exists estado text not null default '';

commit;
