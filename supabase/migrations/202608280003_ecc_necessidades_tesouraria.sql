begin;

create table if not exists public.ecc_necessidades (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  categoria text not null check (categoria in ('ALIMENTO', 'BEBIDA', 'VALOR', 'OUTRO')),
  item text not null,
  unidade text not null default 'unidade',
  quantidade_necessaria numeric(12,2) not null default 0 check (quantidade_necessaria >= 0),
  valor_necessario numeric(12,2) not null default 0 check (valor_necessario >= 0),
  observacoes text not null default '',
  ativa boolean not null default true,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ecc_necessidades_item_idx
  on public.ecc_necessidades(encontro_id, categoria, lower(item), lower(unidade));
create index if not exists ecc_necessidades_encontro_idx
  on public.ecc_necessidades(encontro_id, ativa, categoria);

alter table public.ecc_necessidades enable row level security;

drop policy if exists "ecc necessidades leitura" on public.ecc_necessidades;
create policy "ecc necessidades leitura" on public.ecc_necessidades
for select to authenticated using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc necessidades gestao" on public.ecc_necessidades;
create policy "ecc necessidades gestao" on public.ecc_necessidades
for all to authenticated
using (
  public.mesma_paroquia(paroquia_id)
  and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
)
with check (
  public.mesma_paroquia(paroquia_id)
  and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil())
);

create or replace function public.integrar_valor_ecc_tesouraria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conta uuid;
  categoria_receita uuid;
  encontro_nome text;
begin
  if new.categoria <> 'VALOR' then return new; end if;

  select id into conta from public.tesouraria_contas
  where paroquia_id = new.paroquia_id and lower(nome) = 'caixa do ecc' and ativa = true
  limit 1;

  if conta is null then
    insert into public.tesouraria_contas(paroquia_id, nome, tipo)
    values(new.paroquia_id, 'Caixa do ECC', 'CAIXA') returning id into conta;
  end if;

  select id into categoria_receita from public.tesouraria_categorias
  where paroquia_id = new.paroquia_id and lower(nome) = 'doações do ecc' and natureza = 'RECEITA'
  limit 1;

  if categoria_receita is null then
    insert into public.tesouraria_categorias(paroquia_id, nome, natureza)
    values(new.paroquia_id, 'Doações do ECC', 'RECEITA') returning id into categoria_receita;
  end if;

  select concat(numero, 'º ', nome) into encontro_nome
  from public.ecc_encontros where id = new.encontro_id;

  if new.status = 'CANCELADO' or new.valor_recebido <= 0 then
    update public.tesouraria_movimentacoes
      set status = 'CANCELADA', updated_at = now()
    where paroquia_id = new.paroquia_id and origem = 'DOACAO_ECC' and origem_id = new.id::text;
  else
    insert into public.tesouraria_movimentacoes(
      paroquia_id, conta_id, categoria_id, tipo, valor, data, descricao, origem, origem_id
    ) values (
      new.paroquia_id, conta, categoria_receita, 'ENTRADA', new.valor_recebido, current_date,
      concat('Doação recebida para ', coalesce(encontro_nome, 'ECC'), ': ', new.item,
        case when new.responsavel <> '' then concat(' — ', new.responsavel) else '' end),
      'DOACAO_ECC', new.id::text
    )
    on conflict (paroquia_id, origem, origem_id) where origem_id is not null
    do update set conta_id = excluded.conta_id, categoria_id = excluded.categoria_id,
      valor = excluded.valor, data = excluded.data, descricao = excluded.descricao,
      status = 'CONFIRMADA', updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists ecc_valor_tesouraria on public.ecc_arrecadacoes;
create trigger ecc_valor_tesouraria
after insert or update of valor_recebido, status on public.ecc_arrecadacoes
for each row execute function public.integrar_valor_ecc_tesouraria();

update public.ecc_arrecadacoes
set updated_at = updated_at
where categoria = 'VALOR' and valor_recebido > 0 and status <> 'CANCELADO';

commit;
