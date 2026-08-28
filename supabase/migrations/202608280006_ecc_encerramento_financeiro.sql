begin;

create table if not exists public.ecc_despesas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id) on delete cascade,
  encontro_id uuid not null references public.ecc_encontros(id) on delete cascade,
  descricao text not null,
  fornecedor text not null default '',
  valor numeric(12,2) not null check (valor > 0),
  data date not null,
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'PAGA', 'CANCELADA')),
  observacoes text not null default '',
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecc_despesas_painel_idx on public.ecc_despesas(encontro_id, status, data);
alter table public.ecc_despesas enable row level security;

drop policy if exists "ecc leitura na paroquia" on public.ecc_despesas;
create policy "ecc leitura na paroquia" on public.ecc_despesas for select to authenticated
  using (public.mesma_paroquia(paroquia_id));

drop policy if exists "ecc gestao pastoral" on public.ecc_despesas;
create policy "ecc gestao pastoral" on public.ecc_despesas for all to authenticated
  using (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()))
  with check (public.mesma_paroquia(paroquia_id) and (select perfil in ('admin_plataforma', 'admin_paroquia', 'coordenador', 'operador') from public.meu_perfil()));

create or replace function public.integrar_despesa_ecc_tesouraria() returns trigger
language plpgsql security definer set search_path = public as $$
declare conta uuid; categoria uuid; encontro_nome text;
begin
  select id into conta from public.tesouraria_contas
  where paroquia_id = new.paroquia_id and lower(nome) = 'caixa do ecc' and ativa = true limit 1;
  if conta is null then
    insert into public.tesouraria_contas(paroquia_id, nome, tipo) values(new.paroquia_id, 'Caixa do ECC', 'CAIXA') returning id into conta;
  end if;

  select id into categoria from public.tesouraria_categorias
  where paroquia_id = new.paroquia_id and lower(nome) = 'despesas do ecc' and natureza = 'DESPESA' limit 1;
  if categoria is null then
    insert into public.tesouraria_categorias(paroquia_id, nome, natureza) values(new.paroquia_id, 'Despesas do ECC', 'DESPESA') returning id into categoria;
  end if;

  select concat(numero, 'º ', nome) into encontro_nome from public.ecc_encontros where id = new.encontro_id;
  if new.status <> 'PAGA' then
    update public.tesouraria_movimentacoes set status = 'CANCELADA', updated_at = now()
    where paroquia_id = new.paroquia_id and origem = 'DESPESA_ECC' and origem_id = new.id::text;
  else
    insert into public.tesouraria_movimentacoes(paroquia_id, conta_id, categoria_id, tipo, valor, data, descricao, origem, origem_id)
    values(new.paroquia_id, conta, categoria, 'SAIDA', new.valor, new.data,
      concat('Despesa do ', coalesce(encontro_nome, 'ECC'), ': ', new.descricao,
        case when new.fornecedor <> '' then concat(' — ', new.fornecedor) else '' end),
      'DESPESA_ECC', new.id::text)
    on conflict (paroquia_id, origem, origem_id) where origem_id is not null
    do update set conta_id = excluded.conta_id, categoria_id = excluded.categoria_id,
      valor = excluded.valor, data = excluded.data, descricao = excluded.descricao,
      status = 'CONFIRMADA', updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists ecc_despesa_tesouraria on public.ecc_despesas;
create trigger ecc_despesa_tesouraria after insert or update of valor, data, descricao, fornecedor, status
on public.ecc_despesas for each row execute function public.integrar_despesa_ecc_tesouraria();

create or replace function public.encerrar_edicao_ecc(p_encontro_id uuid, p_paroquia_id uuid)
returns integer language plpgsql security invoker set search_path = public as $$
declare concluidos integer := 0;
begin
  perform 1 from public.ecc_encontros
  where id = p_encontro_id and paroquia_id = p_paroquia_id and status <> 'ENCERRADO' for update;
  if not found then raise exception 'Edição não encontrada ou já encerrada'; end if;

  update public.ecc_encontro_casais participacao
  set situacao = 'PARTICIPOU', updated_at = now()
  where participacao.encontro_id = p_encontro_id and participacao.paroquia_id = p_paroquia_id
    and participacao.classificacao in ('INDICADO', 'ENCONTRISTA', 'CONVIDADO', 'VISITANTE')
    and (
      exists(select 1 from public.ecc_credenciamentos credenciamento
        where credenciamento.encontro_id = p_encontro_id and credenciamento.casal_id = participacao.casal_id
          and credenciamento.status = 'CREDENCIADO')
      or exists(select 1 from public.ecc_presencas_diarias presenca
        where presenca.encontro_id = p_encontro_id and presenca.casal_id = participacao.casal_id and presenca.presente)
    );
  get diagnostics concluidos = row_count;

  update public.ecc_equipes set status = 'PARTICIPOU', updated_at = now()
  where encontro_id = p_encontro_id and paroquia_id = p_paroquia_id and status = 'CONFIRMADO';
  update public.ecc_encontros set status = 'ENCERRADO', updated_at = now()
  where id = p_encontro_id and paroquia_id = p_paroquia_id;
  return concluidos;
end;
$$;

revoke all on function public.encerrar_edicao_ecc(uuid, uuid) from public;
grant execute on function public.encerrar_edicao_ecc(uuid, uuid) to authenticated;

commit;
