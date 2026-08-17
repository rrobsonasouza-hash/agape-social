# Auditoria de segurança — 17/08/2026

## Escopo

Revisão do Ágape Social com foco em autorização server-side, segredos, autenticação, IDOR, Supabase/RLS, entradas de usuário, dependências e menor privilégio.

## Correções aplicadas

### Crítica — administração RLS entre paróquias

- **Localização:** `supabase/migrations/202607160001_fundacao.sql`, políticas originais de `paroquias` e `perfis`.
- **Exploração:** um administrador paroquial autenticado poderia tentar usar a API REST direta do Supabase para alcançar registros administrativos fora da própria paróquia.
- **Correção:** `202608170001_security_hardening.sql` restringe administração RLS direta ao `admin_plataforma`; operações paroquiais seguem pelas APIs server-side com filtro de tenant.
- **Status:** corrigida no código; requer aplicação da migração no Supabase.

### Alta — permissões verificadas apenas na interface

- **Localização:** `src/components/auth/ProtectedArea.tsx` e APIs operacionais.
- **Exploração:** ocultar uma tela no React não impede que um usuário chame sua API manualmente.
- **Correção:** `src/lib/auth/server-permissions.ts` consulta as permissões da paróquia no servidor; famílias, voluntários, dashboard, cestas, visitas e repositórios operacionais agora validam perfil e módulo antes da consulta.
- **Status:** corrigida.

### Alta — leitura direta excessiva no Supabase

- **Localização:** políticas de tabelas operacionais, documentos e Storage.
- **Exploração:** uma sessão autenticada poderia contornar a interface e consultar diretamente dados da própria paróquia além do necessário para sua função.
- **Correção:** a migração revoga privilégios diretos de `anon` e `authenticated`; somente o próprio perfil permanece disponível para inicialização da sessão. Dados e arquivos passam por APIs autenticadas e URLs assinadas.
- **Status:** corrigida no código; requer aplicação da migração.

### Alta — integridade da auditoria

- **Localização:** `src/app/api/auditoria/route.ts` e tabela `auditoria`.
- **Exploração:** qualquer usuário ativo podia enviar um evento arbitrário e contaminar a trilha de auditoria.
- **Correção:** POST público desativado; gravações permanecem internas, com `service_role`; tabela com RLS forçada e sem privilégios de escrita para clientes.
- **Status:** corrigida.

### Alta — privilégios e payload da distribuição

- **Localização:** `src/app/api/distribuicoes/route.ts` e `src/app/api/distribuicoes/[id]/route.ts`.
- **Exploração:** voluntários podiam criar/excluir filas e enviar alterações JSON sem lista permitida de campos.
- **Correção:** criação e exclusão limitadas a gestão; voluntário pode atualizar somente `status`; payloads validados com Zod e lotes limitados a 500 itens.
- **Status:** corrigida.

### Alta — dependências vulneráveis

- **Localização:** `package.json` e `package-lock.json`.
- **Exploração:** falhas conhecidas em Next.js, Sharp, PostCSS e NanoID poderiam atingir build ou execução conforme o pacote vulnerável.
- **Correção:** Next.js 15.5.23, Sharp 0.35.0, PostCSS 8.5.23 e NanoID 3.3.18; `npm audit --omit=dev` retorna zero vulnerabilidades.
- **Status:** corrigida.

### Média — IDOR em consulta de paróquia

- **Localização:** `src/app/api/paroquias/[id]/route.ts`.
- **Exploração:** administrador paroquial poderia trocar o identificador da URL e consultar outra paróquia.
- **Correção:** o GET agora compara o tenant do usuário; acesso cruzado permanece exclusivo do administrador da plataforma.
- **Status:** corrigida.

### Média — proteção do navegador e mensagens internas

- **Localização:** `next.config.ts` e respostas das APIs corrigidas.
- **Exploração:** ausência de CSP aumentava o impacto de um futuro XSS; erros brutos podiam revelar detalhes internos.
- **Correção:** CSP, bloqueio de objetos/frames e restrição de conexões; APIs alteradas registram detalhes no servidor e retornam mensagem genérica ao cliente.
- **Status:** corrigida nas áreas auditadas.

## Controles positivos confirmados

- `service_role` permanece somente no servidor e não existe segredo real versionado.
- Tokens são confirmados pelo Supabase Auth no backend.
- Consultas server-side filtram `paroquia_id`.
- Buckets são privados e arquivos são fornecidos por URL assinada.
- Não há `eval`, execução dinâmica de comandos ou `dangerouslySetInnerHTML` no projeto auditado.

## Validações

- TypeScript: aprovado.
- ESLint: aprovado, sem erros.
- Testes unitários: 38 aprovados.
- Build de produção: aprovado com Next.js 15.5.23.
- Auditoria de dependências de produção: zero vulnerabilidades.
