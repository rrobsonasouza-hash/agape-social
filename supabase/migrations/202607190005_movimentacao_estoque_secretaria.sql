begin;

create table if not exists public.secretaria_movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  produto_id uuid not null references public.secretaria_produtos(id),
  tipo text not null check (tipo in ('ENTRADA','AJUSTE')),
  quantidade integer not null check (quantidade <> 0),
  estoque_anterior integer not null,
  estoque_posterior integer not null check (estoque_posterior >= 0),
  motivo text not null,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists secretaria_movimentacoes_estoque_produto_idx
  on public.secretaria_movimentacoes_estoque(paroquia_id, produto_id, created_at desc);

alter table public.secretaria_movimentacoes_estoque enable row level security;
drop policy if exists "movimentacoes estoque leitura" on public.secretaria_movimentacoes_estoque;
create policy "movimentacoes estoque leitura" on public.secretaria_movimentacoes_estoque
  for select to authenticated using (public.mesma_paroquia(paroquia_id));

create or replace function public.registrar_entrada_estoque_secretaria(
  p_paroquia_id uuid,
  p_produto_id uuid,
  p_quantidade integer,
  p_motivo text,
  p_criado_por uuid
) returns integer language plpgsql security definer set search_path = public as $$
declare anterior integer; posterior integer;
begin
  if p_quantidade <= 0 then raise exception 'A quantidade deve ser maior que zero'; end if;
  if char_length(trim(p_motivo)) < 3 then raise exception 'Informe o motivo da entrada'; end if;
  select estoque into anterior from public.secretaria_produtos
    where id = p_produto_id and paroquia_id = p_paroquia_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  posterior := anterior + p_quantidade;
  update public.secretaria_produtos set estoque = posterior, updated_at = now() where id = p_produto_id;
  insert into public.secretaria_movimentacoes_estoque(paroquia_id, produto_id, tipo, quantidade, estoque_anterior, estoque_posterior, motivo, criado_por)
    values(p_paroquia_id, p_produto_id, 'ENTRADA', p_quantidade, anterior, posterior, trim(p_motivo), p_criado_por);
  return posterior;
end $$;

revoke all on function public.registrar_entrada_estoque_secretaria(uuid,uuid,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.registrar_entrada_estoque_secretaria(uuid,uuid,integer,text,uuid) to service_role;

commit;
