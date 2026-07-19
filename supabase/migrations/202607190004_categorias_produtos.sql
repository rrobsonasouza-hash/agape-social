begin;

create table if not exists public.secretaria_categorias_produtos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  nome text not null check (char_length(trim(nome)) >= 2),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists secretaria_categorias_produtos_nome_idx
  on public.secretaria_categorias_produtos(paroquia_id, lower(nome));

alter table public.secretaria_produtos
  add column if not exists categoria_id uuid references public.secretaria_categorias_produtos(id);

insert into public.secretaria_categorias_produtos(paroquia_id, nome)
select p.id, categoria.nome
from public.paroquias p
cross join (values
  ('Artigos religiosos'),
  ('Velas'),
  ('Livros e folhetos'),
  ('Lembranças'),
  ('Serviços de secretaria'),
  ('Outros')
) as categoria(nome)
on conflict do nothing;

insert into public.secretaria_categorias_produtos(paroquia_id, nome)
select distinct produto.paroquia_id, trim(produto.categoria)
from public.secretaria_produtos produto
where trim(produto.categoria) <> ''
on conflict do nothing;

update public.secretaria_produtos produto
set categoria_id = categoria.id
from public.secretaria_categorias_produtos categoria
where categoria.paroquia_id = produto.paroquia_id
  and lower(categoria.nome) = lower(produto.categoria)
  and produto.categoria_id is null;

create index if not exists secretaria_produtos_categoria_idx
  on public.secretaria_produtos(paroquia_id, categoria_id);

alter table public.secretaria_categorias_produtos enable row level security;
drop policy if exists "categorias produtos leitura" on public.secretaria_categorias_produtos;
create policy "categorias produtos leitura" on public.secretaria_categorias_produtos
  for select to authenticated using (public.mesma_paroquia(paroquia_id));
drop policy if exists "categorias produtos administracao" on public.secretaria_categorias_produtos;
create policy "categorias produtos administracao" on public.secretaria_categorias_produtos
  for all to authenticated using (public.sou_admin()) with check (public.sou_admin());

create or replace function public.criar_categorias_secretaria_paroquia()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.secretaria_categorias_produtos(paroquia_id, nome)
  values
    (new.id, 'Artigos religiosos'),
    (new.id, 'Velas'),
    (new.id, 'Livros e folhetos'),
    (new.id, 'Lembranças'),
    (new.id, 'Serviços de secretaria'),
    (new.id, 'Outros')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists criar_categorias_secretaria_paroquia on public.paroquias;
create trigger criar_categorias_secretaria_paroquia
after insert on public.paroquias
for each row execute function public.criar_categorias_secretaria_paroquia();

commit;
