# Arquitetura — Ágape Social

## Visão arquitetural

O Ágape Social adota um **monólito modular**: uma única aplicação Next.js com módulos de domínio bem delimitados. A persistência, autenticação e arquivos ficam no **Firebase**, eliminando servidor backend dedicado no MVP e simplificando deploy e operação para paróquias.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                         │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│                    Firebase Hosting (CDN + SSR)                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 — App Router (Monólito)             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │
│  │  │   app/      │  │ components/ │  │ modules/ (domínio)  │ │  │
│  │  │   rotas/UI  │  │   UI/shared │  │ services + actions  │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Firebase Auth │     │ Cloud Firestore │     │ Firebase Storage │
│  (identidade) │     │   (dados)       │     │   (arquivos)     │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

## Decisões arquiteturais (ADR resumido)

| ID | Decisão | Justificativa |
|----|---------|---------------|
| ADR-001 | Next.js App Router + TypeScript | SSR/SSG, rotas modernas, ecossistema maduro, deploy no Firebase Hosting |
| ADR-002 | Monólito modular | Equipe pequena, deploy único, domínios separados em `src/modules/` |
| ADR-003 | Firestore (NoSQL) | Integração nativa Firebase, tempo real opcional, free tier generoso |
| ADR-004 | Firebase Auth | Login gerenciado, extensível (e-mail/senha; Google no futuro) |
| ADR-005 | Firebase Storage | Fotos de famílias, comprovantes, anexos de visitas |
| ADR-006 | Multi-tenant por `paroquiaId` | Uma instância, várias paróquias; regras Firestore + app |
| ADR-007 | shadcn/ui + Tailwind | Componentes acessíveis, customizáveis, sem lock-in de biblioteca |
| ADR-008 | Server Actions + Route Handlers | Mutações no servidor; Firebase Admin SDK onde necessário |

## Estrutura de pastas (planejada)

```
agape-social/
├── docs/                          # Documentação do projeto
├── public/                        # Assets estáticos
├── src/
│   ├── app/                       # Rotas Next.js (App Router)
│   │   ├── (auth)/                # Login, recuperação de senha
│   │   ├── (dashboard)/           # Área autenticada por módulo
│   │   └── api/                   # Route Handlers (webhooks, exports)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui
│   │   ├── forms/
│   │   ├── layout/
│   │   └── shared/
│   ├── modules/                   # Domínios de negócio
│   │   ├── auth/
│   │   ├── paroquias/
│   │   ├── usuarios/
│   │   ├── familias/
│   │   ├── voluntarios/
│   │   ├── doadores/
│   │   ├── estoque/
│   │   ├── cestas/
│   │   ├── visitas/
│   │   ├── relatorios/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── firebase/              # Client + Admin SDK, config
│   │   ├── auth/                  # Sessão, guards, tenant context
│   │   ├── permissions/           # RBAC
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── config/
├── firebase.json                  # Hosting, emulators, rules paths
├── firestore.rules                # Regras de segurança multi-tenant
├── firestore.indexes.json         # Índices compostos
├── storage.rules                  # Regras do Storage
├── .env.example
└── PROJECT.md
```

### Convenção interna de cada módulo

```
modules/<dominio>/
├── actions/          # Server Actions (entrada da UI)
├── services/         # Regras de negócio e orquestração
├── repositories/     # Acesso ao Firestore (queries/mutations)
├── schemas/          # Validação Zod
└── types/            # Tipos TypeScript do domínio
```

**Fluxo de dados:**

```
Página (app/) → Action → Service → Repository → Firestore
                      ↘ Firebase Auth / Storage quando aplicável
```

## Multi-tenancy

### Identificação do tenant

- Toda entidade de negócio possui campo **`paroquiaId`** (string, ID do documento em `paroquias/{id}`).
- O usuário autenticado possui **`paroquiaId`** e **`role`** em documento de perfil (`usuarios/{uid}`).
- Super-admin da plataforma (futuro) pode gerenciar paróquias; usuários comuns ficam restritos ao próprio tenant.

### Isolamento em camadas

| Camada | Mecanismo |
|--------|-----------|
| **Firestore Rules** | Leitura/escrita condicionada a `request.auth` + `paroquiaId` do token/custom claims ou documento de usuário |
| **Server Actions / API** | Validação explícita: `assertTenant(paroquiaId)` antes de toda operação |
| **Storage Rules** | Path prefixado: `paroquias/{paroquiaId}/...` |
| **Queries** | Sempre filtrar por `paroquiaId`; índices compostos incluem tenant |

### Coleções Firestore (modelo conceitual)

```
paroquias/{paroquiaId}
usuarios/{uid}                    # perfil + paroquiaId + role
familias/{familiaId}              # paroquiaId
voluntarios/{voluntarioId}
doadores/{doadorId}
produtos/{produtoId}              # estoque
movimentacoes_estoque/{movId}
cestas/{cestaId}
entregas_cestas/{entregaId}
visitas/{visitaId}
audit_logs/{logId}                # fase posterior
```

Subcoleções podem ser usadas onde fizer sentido (ex.: `familias/{id}/membros`), desde que `paroquiaId` permaneça verificável nas rules.

## Autenticação e autorização

### Firebase Authentication

- Provedor inicial: **e-mail e senha**
- Extensões futuras: Google, link mágico
- Custom claims ou documento `usuarios/{uid}` para `paroquiaId` e `role`

### Papéis (RBAC)

| Papel | Descrição resumida |
|-------|-------------------|
| `admin_plataforma` | Gestão global de paróquias (futuro) |
| `admin_paroquia` | Usuários e configurações da paróquia |
| `coordenador` | Acesso amplo operacional + relatórios |
| `operador` | Cadastros e operação (estoque, cestas) |
| `voluntario` | Visitas e consulta limitada |
| `leitor` | Somente leitura |

Permissões granulares em `src/lib/permissions/` (ex.: `familias:criar`, `estoque:movimentar`).

## Firebase — configuração e ambientes

| Ambiente | Uso |
|----------|-----|
| **Emulators** | Desenvolvimento local (Auth, Firestore, Storage) |
| **Staging** | Projeto Firebase separado para homologação |
| **Production** | Projeto Firebase de produção |

Variáveis em `.env.local` (client) e secrets no CI para Admin SDK.

### SDKs

- **Client SDK** (`firebase/app`, `auth`, `firestore`, `storage`): operações no browser quando rules permitem
- **Admin SDK** (`firebase-admin`): Server Actions sensíveis, criação de usuários, operações privilegiadas

## Segurança

- **Firestore Rules** como última linha de defesa (never trust the client)
- **Validação Zod** em toda entrada (Server Actions)
- **HTTPS** obrigatório (Firebase Hosting)
- **Storage**: tipos MIME e tamanho máximo por upload
- **LGPD**: minimização de dados, logs de acesso em fase posterior
- **Rate limiting** em Route Handlers críticos (fase posterior)

## UI e experiência

- **Tailwind CSS** para estilos utilitários
- **shadcn/ui** para componentes base (Button, Dialog, Table, Form)
- **React Hook Form + Zod** para formulários
- Layout dashboard: sidebar, header com paróquia ativa, breadcrumbs
- Interface 100% em **português (Brasil)** — textos, datas (`pt-BR`), moeda (BRL)

## Deploy e CI/CD

```
Git push → GitHub Actions (lint, test, build)
         → firebase deploy (Hosting + rules + indexes)
```

- **Firebase Hosting** serve o output do Next.js (SSR via Cloud Functions ou framework-aware deploy conforme configuração escolhida na implementação)
- Rules e indexes versionados no repositório

## Observabilidade (fases futuras)

- Firebase Analytics / Performance (opcional)
- Cloud Logging para erros server-side
- Tabela `audit_logs` para alterações sensíveis

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Vazamento entre tenants | Rules + assertTenant + testes de integração |
| Queries Firestore custosas | Índices compostos, paginação cursor-based |
| NoSQL sem joins | Denormalização controlada; agregados no dashboard |
| Dependência do free tier | Monitorar quotas; arquitetura permite migração parcial futura |

## Documentos relacionados

- [Visão geral](./visao-geral.md)
- [Requisitos](./requisitos.md)
- [Regras de negócio](./regras-negocio.md)
- [Roadmap](./roadmap.md)
