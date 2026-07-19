begin;

create table if not exists public.secretaria_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  protocolo text not null unique,
  tipo text not null check (tipo in ('BATISMO','CASAMENTO','PRIMEIRA_COMUNHAO','CRISMA','SEGUNDA_VIA','INTENCAO_MISSA','OUTROS')),
  solicitante_nome text not null,
  telefone text not null default '',
  interessado_nome text not null default '',
  prazo date,
  observacoes text not null default '',
  status text not null default 'RECEBIDA' check (status in ('RECEBIDA','EM_ANDAMENTO','AGUARDANDO_DOCUMENTOS','PRONTA','CONCLUIDA','CANCELADA')),
  valor numeric(10,2) not null default 0 check (valor >= 0),
  pago boolean not null default false,
  pago_em timestamptz,
  conta_pagamento_id uuid references public.tesouraria_contas(id),
  criado_por uuid references auth.users(id),
  criado_por_nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.secretaria_solicitacoes_historico (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  solicitacao_id uuid not null references public.secretaria_solicitacoes(id) on delete cascade,
  status text not null,
  observacao text not null default '',
  criado_por uuid references auth.users(id),
  criado_por_nome text not null,
  created_at timestamptz not null default now()
);

create index if not exists secretaria_solicitacoes_status_idx on public.secretaria_solicitacoes(paroquia_id,status,created_at desc);
create index if not exists secretaria_solicitacoes_historico_idx on public.secretaria_solicitacoes_historico(solicitacao_id,created_at desc);
alter table public.secretaria_solicitacoes enable row level security;
alter table public.secretaria_solicitacoes_historico enable row level security;
drop policy if exists "solicitacoes secretaria" on public.secretaria_solicitacoes;
create policy "solicitacoes secretaria" on public.secretaria_solicitacoes for all to authenticated using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));
drop policy if exists "historico solicitacoes secretaria" on public.secretaria_solicitacoes_historico;
create policy "historico solicitacoes secretaria" on public.secretaria_solicitacoes_historico for all to authenticated using (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil())) with check (public.mesma_paroquia(paroquia_id) and (select perfil::text in ('admin_plataforma','admin_paroquia','atendente_secretaria') from public.meu_perfil()));

create or replace function public.registrar_pagamento_solicitacao_secretaria(p_paroquia_id uuid,p_solicitacao_id uuid,p_conta_id uuid,p_criado_por uuid)
returns void language plpgsql security definer set search_path=public as $$
declare solicitacao public.secretaria_solicitacoes%rowtype; categoria uuid;
begin
  select * into solicitacao from public.secretaria_solicitacoes where id=p_solicitacao_id and paroquia_id=p_paroquia_id for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if solicitacao.pago then raise exception 'Esta solicitação já foi paga'; end if;
  if solicitacao.valor<=0 then raise exception 'Esta solicitação não possui cobrança'; end if;
  if not exists(select 1 from public.tesouraria_contas where id=p_conta_id and paroquia_id=p_paroquia_id and ativa) then raise exception 'Selecione uma conta ativa'; end if;
  select id into categoria from public.tesouraria_categorias where paroquia_id=p_paroquia_id and lower(nome)='serviços da secretaria' and natureza='RECEITA' limit 1;
  if categoria is null then insert into public.tesouraria_categorias(paroquia_id,nome,natureza) values(p_paroquia_id,'Serviços da Secretaria','RECEITA') returning id into categoria; end if;
  insert into public.tesouraria_movimentacoes(paroquia_id,conta_id,categoria_id,tipo,valor,data,descricao,origem,origem_id,criado_por)
  values(p_paroquia_id,p_conta_id,categoria,'ENTRADA',solicitacao.valor,current_date,'Recebimento '||solicitacao.protocolo,'SOLICITACAO_SECRETARIA',solicitacao.id::text,p_criado_por);
  update public.secretaria_solicitacoes set pago=true,pago_em=now(),conta_pagamento_id=p_conta_id,updated_at=now() where id=solicitacao.id;
end $$;
revoke all on function public.registrar_pagamento_solicitacao_secretaria(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.registrar_pagamento_solicitacao_secretaria(uuid,uuid,uuid,uuid) to service_role;

commit;
