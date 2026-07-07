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
| Banco de dados | Firebase Firestore                |
| Autenticação   | Firebase Authentication           |
| Arquivos       | Firebase Storage                  |
| Hospedagem     | Firebase Hosting                  |
| Arquitetura    | Monólito modular                  |
| Multi-tenant   | Sim — isolamento por `paroquiaId` |


**Não usar** neste projeto: PostgreSQL, Prisma, NextAuth/Auth.js como provider principal, ou backend separado (NestJS), salvo decisão explícita futura documentada em ADR.

## Arquitetura em uma frase

Monólito Next.js com módulos de domínio em `src/modules/`, Firebase como BaaS, e isolamento rigoroso de dados por paróquia em Firestore Rules + validação server-side.

## Estrutura de pastas (alvo)

```
src/
├── app/              # Rotas e layouts (App Router)
├── components/       # UI reutilizável (ui, forms, layout, shared)
├── modules/          # Domínios: auth, paroquias, usuarios, familias, ...
├── lib/              # firebase, auth, permissions, utils
├── hooks/
├── types/
└── config/           # navigation, roles, site
```

Cada módulo segue: `actions/`, `services/`, `repositories/`, `schemas/`, `types/`.

## Multi-tenancy — regras invioláveis

1. Toda entidade de negócio tem campo `paroquiaId`
2. Toda query Firestore filtra por `paroquiaId` do usuário logado
3. Toda Server Action chama `assertTenant(paroquiaId)` antes de ler/escrever
4. Firestore Rules e Storage Rules enforce tenant no servidor Firebase
5. Path de arquivos: `paroquias/{paroquiaId}/...`



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




## Coleções Firestore (convenção de nomes)

```
paroquias
usuarios
familias
voluntarios
doadores
produtos
movimentacoes_estoque
cestas
entregas_cestas
visitas
```

IDs: preferir auto-ID Firestore; `usuarios` keyed by Firebase Auth `uid`.

## Convenções de código

- **TypeScript strict** habilitado
- **Nomes em português** para domínio (variáveis de negócio, rotas, labels UI); código técnico pode usar inglês (hooks, utils genéricos)
- **Server Actions** para mutações; Route Handlers apenas quando necessário (exports, webhooks)
- **Zod** para toda validação de entrada
- **Repositories** encapsulam Firestore — services não importam `firebase/firestore` diretamente
- **Componentes shadcn** em `src/components/ui/` — não editar node_modules
- Commits: imperativo, claro (`feat(familias): adiciona cadastro de membros`)



## Variáveis de ambiente (referência)

```env
# Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Server only
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
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
| [docs/arquitetura.md](./docs/arquitetura.md)       | Decisões técnicas, pastas, Firebase |
| [docs/requisitos.md](./docs/requisitos.md)         | RF/RNF numerados                    |
| [docs/regras-negocio.md](./docs/regras-negocio.md) | Regras por domínio                  |
| [docs/roadmap.md](./docs/roadmap.md)               | Fases de implementação              |




## Roadmap atual


| Fase                       | Status                                   |
| -------------------------- | ---------------------------------------- |
| **0 — Fundação**           | Estrutura base ✓ · Firebase SDK pendente |
| 1 — Auth + tenant          | Pendente                                 |
| 2 — Cadastros              | Pendente                                 |
| 3 — Operação               | Pendente                                 |
| 4 — Dashboard + relatórios | Pendente                                 |
| 5 — Qualidade + deploy     | Pendente                                 |


Detalhes: [docs/roadmap.md](./docs/roadmap.md).

## LGPD — lembretes para implementação

- Consentimento no cadastro de família
- Minimização de dados pessoais
- Observações pastorais restritas por papel
- Preferir inativação/anonimização a exclusão física
- Exportações sem CPF completo por padrão



## Comandos (serão definidos na Fase 0)

```bash
npm run dev          # Next.js dev
npm run emulators    # Firebase emulators
npm run build        # Build produção
npm run deploy       # Firebase deploy
```

---

*Última atualização: fundação documental — stack Firebase, multi-tenant, monólito modular.*