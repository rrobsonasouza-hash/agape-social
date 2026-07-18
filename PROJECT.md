# Ágape Social — Contexto do Projeto

> Documento de referência permanente para desenvolvimento. Consulte este arquivo antes de implementar qualquer funcionalidade.

## Identidade


| Campo                   | Valor                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| **Nome**                | Ágape Social                                                               |
| **Propósito**           | Sistema web gratuito para gestão da Pastoral Social de paróquias católicas |
| **Idioma da interface** | Português (Brasil) — `pt-BR`                                               |
| **Público**             | Coordenadores, voluntários e administradores da pastoral social paroquial  |


## Stack (decisões fechadas)


| Camada         | Tecnologia                        |
| -------------- | --------------------------------- |
| Framework      | Next.js (App Router) + TypeScript |
| UI             | Tailwind CSS + shadcn/ui          |
| Formulários    | React Hook Form + Zod             |
| Banco de dados | Supabase PostgreSQL               |
| Autenticação   | Supabase Auth                     |
| Arquivos       | Supabase Storage                  |
| Hospedagem     | Vercel                            |
| Arquitetura    | Monólito modular                  |
| Multi-tenant   | Sim — isolamento por `paroquiaId` |


**Não usar** neste projeto: Prisma, NextAuth/Auth.js como provider principal, ou backend separado (NestJS), salvo decisão explícita futura documentada em ADR.

## Arquitetura em uma frase

Monólito Next.js com módulos de domínio em `src/modules/`, Supabase como BaaS e isolamento rigoroso de dados por paróquia com validação server-side e RLS.

## Estrutura de pastas (alvo)

```
src/
├── app/              # Rotas e layouts (App Router)
├── components/       # UI reutilizável (ui, forms, layout, shared)
├── modules/          # Domínios: auth, paroquias, usuarios, familias, ...
├── lib/              # supabase, auth, permissions, utils
├── hooks/
├── types/
└── config/           # navigation, roles, site
```

Cada módulo segue: `actions/`, `services/`, `repositories/`, `schemas/`, `types/`.

## Multi-tenancy — regras invioláveis

1. Toda entidade de negócio tem campo `paroquiaId`
2. Toda consulta operacional filtra por `paroquia_id` da paróquia selecionada
3. Toda Server Action chama `assertTenant(paroquiaId)` antes de ler/escrever
4. As APIs server-side e políticas RLS garantem o isolamento do tenant
5. Path de arquivos inicia com `{paroquiaId}/...`



## Papéis de usuário (RBAC)


| Papel               | Código             |
| ------------------- | ------------------ |
| Admin da plataforma | `admin_plataforma` |
| Admin da paróquia   | `admin_paroquia`   |
| Coordenador         | `coordenador`      |
| Operador            | `operador`         |
| Voluntário          | `voluntario`       |
| Leitor              | `leitor`           |


Matriz detalhada em [docs/regras-negocio.md](./docs/regras-negocio.md).

## Módulos funcionais (escopo completo)


| Módulo      | Descrição                                   |
| ----------- | ------------------------------------------- |
| Auth        | Login, logout, sessão, guards               |
| Paróquias   | Tenant, configuração da paróquia            |
| Usuários    | CRUD, papéis, ativação                      |
| Famílias    | Cadastro socioeconômico, membros, status    |
| Voluntários | Cadastro, áreas, vínculo com usuário        |
| Doadores    | PF/PJ, histórico de doações                 |
| Estoque     | Produtos, movimentações, alertas            |
| Cestas      | Templates, montagem, entrega, baixa estoque |
| Visitas     | Registro pastoral, histórico por família    |
| Dashboard   | KPIs e indicadores                          |
| Relatórios  | Filtros, export CSV/PDF                     |




## Tabelas Supabase (convenção de nomes)

```
paroquias
perfis
familias
voluntarios
doadores
produtos
movimentacoes_estoque
cestas
entregas_cestas
visitas
```

IDs operacionais usam UUID; `perfis.id` referencia o usuário do Supabase Auth.

## Convenções de código

- **TypeScript strict** habilitado
- **Nomes em português** para domínio (variáveis de negócio, rotas, labels UI); código técnico pode usar inglês (hooks, utils genéricos)
- **Server Actions** para mutações; Route Handlers apenas quando necessário (exports, webhooks)
- **Zod** para toda validação de entrada
- **Repositories e APIs** encapsulam o acesso ao Supabase
- **Componentes shadcn** em `src/components/ui/` — não editar node_modules
- Commits: imperativo, claro (`feat(familias): adiciona cadastro de membros`)



## Variáveis de ambiente (referência)

```env
# Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server only
SUPABASE_SERVICE_ROLE_KEY=
```

Ver `.env.example` quando criado na Fase 0.

## Regras de desenvolvimento

Consultar [docs/regras-projeto.md](./docs/regras-projeto.md) antes de qualquer implementação.

**Fluxo obrigatório:** Planejar → Explicar → Implementar → Revisar (nunca pular etapas).

## Documentação


| Arquivo                                            | Conteúdo                            |
| -------------------------------------------------- | ----------------------------------- |
| [docs/regras-projeto.md](./docs/regras-projeto.md) | Regras de código, fluxo e qualidade |
| [docs/visao-geral.md](./docs/visao-geral.md)       | Produto, personas, objetivos        |
| [docs/arquitetura.md](./docs/arquitetura.md)       | Decisões técnicas e estrutura       |
| [docs/requisitos.md](./docs/requisitos.md)         | RF/RNF numerados                    |
| [docs/regras-negocio.md](./docs/regras-negocio.md) | Regras por domínio                  |
| [docs/roadmap.md](./docs/roadmap.md)               | Fases de implementação              |




## Roadmap atual


| Fase                       | Status                                   |
| -------------------------- | ---------------------------------------- |
| **0 — Fundação**           | Concluída                                |
| 1 — Auth + tenant          | Concluída                                |
| 2 — Cadastros              | Concluída                                |
| 3 — Operação               | Concluída                                |
| 4 — Dashboard + relatórios | Concluída                                |
| 5 — Qualidade + deploy     | Em validação final                       |


Detalhes: [docs/roadmap.md](./docs/roadmap.md).

## LGPD — lembretes para implementação

- Consentimento no cadastro de família
- Minimização de dados pessoais
- Observações pastorais restritas por papel
- Preferir inativação/anonimização a exclusão física
- Exportações sem CPF completo por padrão



## Comandos

```bash
npm run dev          # Next.js dev
npm run build        # Build produção
```

---

*Última atualização: operação em Supabase e Vercel, multi-tenant, monólito modular.*
