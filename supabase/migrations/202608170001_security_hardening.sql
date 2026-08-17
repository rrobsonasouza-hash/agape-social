begin;

-- A administração direta por RLS fica restrita ao administrador da plataforma.
create or replace function public.sou_admin_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select perfil = 'admin_plataforma' from public.meu_perfil()), false)
$$;

revoke all on function public.sou_admin_plataforma() from public;

drop policy if exists "paroquias administracao" on public.paroquias;
create policy "paroquias administracao plataforma"
on public.paroquias
for all
to authenticated
using (public.sou_admin_plataforma())
with check (public.sou_admin_plataforma());

drop policy if exists "perfis administracao" on public.perfis;
create policy "perfis administracao plataforma"
on public.perfis
for all
to authenticated
using (public.sou_admin_plataforma())
with check (public.sou_admin_plataforma());

-- A auditoria é imutável para clientes. Somente rotas internas com service_role gravam.
alter table public.auditoria enable row level security;
alter table public.auditoria force row level security;
drop policy if exists "auditoria imutavel" on public.auditoria;

-- Toda informação operacional passa pelas APIs autenticadas do Ágape.
-- O service_role usado exclusivamente no servidor não é afetado por estes REVOKE.
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'areas_pastorais', 'auditoria', 'campanhas_cestas', 'configuracoes',
    'convites_usuarios', 'distribuicoes_cestas', 'doadores', 'documentos',
    'familias', 'movimentacoes_cestas', 'parceiros',
    'secretaria_categorias_produtos', 'secretaria_dizimistas',
    'secretaria_dizimos_pagamentos', 'secretaria_documentos_avulsos',
    'secretaria_documentos_emitidos', 'secretaria_eventos',
    'secretaria_horarios_celebracoes', 'secretaria_movimentacoes_estoque',
    'secretaria_produtos', 'secretaria_registros_sacramentais',
    'secretaria_registros_sacramentais_historico', 'secretaria_servicos',
    'secretaria_solicitacoes', 'secretaria_solicitacoes_historico',
    'secretaria_vendas', 'tesouraria_caixa_operacoes', 'tesouraria_caixas',
    'tesouraria_categorias', 'tesouraria_contas', 'tesouraria_movimentacoes',
    'visitas', 'voluntarios'
  ] loop
    if to_regclass(format('public.%I', tabela)) is not null then
      execute format('alter table public.%I enable row level security', tabela);
      execute format('alter table public.%I force row level security', tabela);
      execute format('revoke all privileges on table public.%I from anon, authenticated', tabela);
    end if;
  end loop;
end
$$;

-- Paróquias também são consultadas apenas pelo backend; o perfil próprio é a
-- única leitura direta mantida para a inicialização segura da sessão.
revoke all privileges on table public.paroquias from anon, authenticated;
revoke all privileges on table public.perfis from anon, authenticated;
grant select on table public.perfis to authenticated;
alter table public.paroquias force row level security;
alter table public.perfis force row level security;

-- Fecha RPCs do schema público para o navegador. As APIs server-side continuam
-- operando com service_role e menor superfície de ataque.
revoke execute on all functions in schema public from anon, authenticated;
grant execute on function public.meu_perfil() to authenticated;
grant execute on function public.sou_admin_plataforma() to authenticated;

-- Arquivos privados são acessados somente por URLs curtas e assinadas pela API.
drop policy if exists "storage leitura paroquia" on storage.objects;
drop policy if exists "storage envio pastoral" on storage.objects;
drop policy if exists "storage remocao pastoral" on storage.objects;

commit;
