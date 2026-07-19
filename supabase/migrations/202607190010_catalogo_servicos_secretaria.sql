begin;

create table if not exists public.secretaria_servicos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias(id),
  codigo text not null,
  nome text not null,
  valor numeric(10,2) not null default 0 check (valor >= 0),
  prazo_dias integer not null default 0 check (prazo_dias >= 0),
  documentos jsonb not null default '[]'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists secretaria_servicos_nome_idx on public.secretaria_servicos(paroquia_id,lower(nome));
create unique index if not exists secretaria_servicos_codigo_idx on public.secretaria_servicos(paroquia_id,codigo);

insert into public.secretaria_servicos(paroquia_id,codigo,nome,valor,prazo_dias,documentos)
select p.id,s.codigo,s.nome,0,s.prazo,s.documentos::jsonb from public.paroquias p cross join (values
('BATISMO','Batismo',30,'["Certidão de nascimento","Documento dos pais","Documento dos padrinhos","Comprovante do curso de batismo"]'),
('CASAMENTO','Casamento',60,'["Certidão de batismo atualizada","Documentos dos noivos","Comprovante de residência","Comprovante do curso de noivos"]'),
('PRIMEIRA_COMUNHAO','Primeira Comunhão',30,'["Certidão de batismo","Comprovante da catequese"]'),
('CRISMA','Crisma',30,'["Certidão de batismo","Comprovante da catequese","Documento do padrinho ou madrinha"]'),
('SEGUNDA_VIA','Segunda via de documento',7,'["Documento de identificação","Dados para localização do registro"]'),
('INTENCAO_MISSA','Intenção de missa',0,'[]'),
('OUTROS','Outros',0,'[]')) as s(codigo,nome,prazo,documentos) on conflict do nothing;

alter table public.secretaria_solicitacoes drop constraint if exists secretaria_solicitacoes_tipo_check;
alter table public.secretaria_solicitacoes add column if not exists servico_id uuid references public.secretaria_servicos(id);
alter table public.secretaria_solicitacoes add column if not exists servico_nome text;
update public.secretaria_solicitacoes r set servico_id=s.id,servico_nome=s.nome from public.secretaria_servicos s where s.paroquia_id=r.paroquia_id and s.codigo=r.tipo and r.servico_id is null;
update public.secretaria_solicitacoes set servico_nome=tipo where servico_nome is null;

alter table public.secretaria_servicos enable row level security;
drop policy if exists "servicos secretaria leitura" on public.secretaria_servicos;
create policy "servicos secretaria leitura" on public.secretaria_servicos for select to authenticated using(public.mesma_paroquia(paroquia_id));
drop policy if exists "servicos secretaria administracao" on public.secretaria_servicos;
create policy "servicos secretaria administracao" on public.secretaria_servicos for all to authenticated using(public.sou_admin()) with check(public.sou_admin());

create or replace function public.criar_servicos_secretaria_paroquia() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.secretaria_servicos(paroquia_id,codigo,nome,valor,prazo_dias,documentos) values
  (new.id,'BATISMO','Batismo',0,30,'["Certidão de nascimento","Documento dos pais","Documento dos padrinhos","Comprovante do curso de batismo"]'),
  (new.id,'CASAMENTO','Casamento',0,60,'["Certidão de batismo atualizada","Documentos dos noivos","Comprovante de residência","Comprovante do curso de noivos"]'),
  (new.id,'PRIMEIRA_COMUNHAO','Primeira Comunhão',0,30,'["Certidão de batismo","Comprovante da catequese"]'),
  (new.id,'CRISMA','Crisma',0,30,'["Certidão de batismo","Comprovante da catequese","Documento do padrinho ou madrinha"]'),
  (new.id,'SEGUNDA_VIA','Segunda via de documento',0,7,'["Documento de identificação","Dados para localização do registro"]'),
  (new.id,'INTENCAO_MISSA','Intenção de missa',0,0,'[]'),(new.id,'OUTROS','Outros',0,0,'[]') on conflict do nothing;return new;
end $$;
drop trigger if exists criar_servicos_secretaria_paroquia on public.paroquias;
create trigger criar_servicos_secretaria_paroquia after insert on public.paroquias for each row execute function public.criar_servicos_secretaria_paroquia();

commit;
