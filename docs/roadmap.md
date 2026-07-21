# Roadmap — Ágape Social

Plano de implementação incremental. Cada fase entrega valor utilizável e prepara a seguinte. **Nenhuma fase implementa telas ou funcionalidades antes da conclusão da documentação e fundação técnica.**

---

## Visão das fases

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5
Fundação   Auth +      Cadastros   Operação    Inteligência  Qualidade
           Tenant      base                    + Relatórios  + Deploy
```

| Fase | Nome | Objetivo | Entrega principal |
|------|------|----------|-------------------|
| **0** | Fundação | Projeto configurado, Firebase, estrutura modular | Repo + emulators + layout base |
| **1** | Auth e tenant | Login, paróquia, usuários, RBAC | Acesso seguro multi-paróquia |
| **2** | Cadastros base | Famílias, voluntários, doadores | CRUD completo dos cadastros |
| **3** | Operação | Estoque, cestas, visitas | Fluxo operacional diário |
| **4** | Inteligência | Dashboard e relatórios | Visão gerencial |
| **5** | Qualidade | Testes, LGPD, documentação deploy | Produção confiável |

---

## Fase 0 — Fundação

**Status:** documentação em andamento (este repositório).

### Objetivos

- Estruturar repositório e documentação
- Inicializar Next.js + TypeScript + Tailwind + shadcn/ui
- Configurar Firebase (projeto, emulators, rules esqueleto)
- Estabelecer monólito modular (`src/modules/`, `src/lib/firebase/`)

### Entregas

- [x] Documentação: `docs/` + `PROJECT.md`
- [ ] Projeto Next.js inicializado
- [ ] Firebase configurado (Auth, Firestore, Storage, Hosting)
- [ ] Emulators locais funcionando
- [ ] `firestore.rules` e `storage.rules` com regras base multi-tenant
- [ ] Layout shell (sidebar, header) — sem módulos de negócio
- [ ] CI básico: lint + build
- [ ] `.env.example` documentado

### Critérios de conclusão

- `npm run dev` sobe a aplicação
- Emulators Firebase rodam localmente
- Deploy de hello-world no Firebase Hosting (opcional nesta fase)

---

## Fase 1 — Autenticação e multi-tenant

### Objetivos

- Login/logout com Firebase Auth
- Modelo de paróquia e perfil de usuário no Firestore
- RBAC aplicado em rotas e rules
- Gestão básica de usuários (admin paróquia)

### Entregas

- [ ] Módulo `auth`: login, logout, guard de rotas
- [ ] Módulo `paroquias`: CRUD paróquia (admin)
- [ ] Módulo `usuarios`: criar usuário, atribuir papel, desativar
- [ ] Documento `usuarios/{uid}` com `paroquiaId` + `role`
- [ ] Firestore Rules validando tenant em coleções protegidas
- [ ] Página de login em português
- [ ] Middleware Next.js para rotas protegidas

### Critérios de conclusão

- Usuário A da paróquia 1 não acessa dados da paróquia 2 (teste manual + rules)
- Admin cria operador e operador acessa dashboard vazio

---

## Fase 2 — Cadastros base

### Objetivos

- CRUD de famílias, voluntários e doadores
- Busca, filtros e paginação
- Validações brasileiras (CPF, CEP, telefone)

### Entregas

- [ ] Módulo `familias`: CRUD, membros, status, consentimento LGPD
- [ ] Módulo `voluntarios`: CRUD, áreas, vínculo opcional com usuário
- [ ] Módulo `doadores`: CRUD, registro de doações
- [ ] Componentes shared: DataTable, formulário de endereço, PageHeader
- [ ] Índices Firestore para buscas frequentes

### Critérios de conclusão

- Coordenador cadastra família completa e encontra por nome/bairro
- Histórico de doações visível no perfil do doador

---

## Fase 3 — Operação

### Objetivos

- Controle de estoque com movimentações
- Montagem e entrega de cestas com baixa automática
- Registro de visitas pastorais

### Entregas

- [ ] Módulo `estoque`: produtos, entradas, saídas, alertas
- [ ] Módulo `cestas`: templates, montagem, entrega, histórico por família
- [ ] Módulo `visitas`: registro, listagem, filtros
- [ ] Regras de negócio RN-E*, RN-C*, RN-VS* implementadas nos services
- [ ] Transações/atomic writes onde necessário (entrega + baixa estoque)

### Critérios de conclusão

- Entrega de cesta bloqueada sem estoque; sucesso com baixa correta
- Visita registrada aparece no histórico da família

---

## Fase 4 — Inteligência

### Objetivos

- Dashboard com KPIs
- Relatórios filtráveis e exportação

### Entregas

- [ ] Módulo `dashboard`: cards e gráficos principais
- [ ] Módulo `relatorios`: famílias, cestas, estoque, visitas
- [ ] Export CSV (MVP); PDF (should)
- [ ] Agregações Firestore ou pré-cálculo server-side

### Critérios de conclusão

- Coordenador gera relatório mensal de entregas em CSV
- Dashboard reflete famílias ativas e estoque crítico em tempo aceitável

---

## Fase 5 — Qualidade e produção

### Objetivos

- Testes automatizados dos fluxos críticos
- Revisão LGPD e auditoria básica
- Documentação de deploy para paróquias
- Seed de demonstração

### Entregas

- [x] Testes unitários: validators, permissions, services
- [ ] Testes E2E: login, cadastro família, entrega cesta (Playwright)
- [x] `docs/deploy.md` — passo a passo para nova paróquia
- [x] `docs/lgpd.md` — política e procedimentos
- [ ] Seed script para ambiente demo
- [x] Monitoramento básico de disponibilidade

### Critérios de conclusão

- Pipeline CI verde
- Deploy production documentado e reproduzível
- Checklist LGPD revisado

---

## Backlog futuro (pós-MVP)

| Item | Descrição |
|------|-----------|
| PWA / offline | Visitas em campo sem conexão |
| Notificações | E-mail/push para estoque baixo e visitas agendadas |
| Admin plataforma | Onboarding self-service de novas paróquias |
| ViaCEP | Preenchimento automático de endereço |
| Auditoria avançada | `audit_logs` com diff de alterações |
| Login Google | Provedor adicional Firebase Auth |
| App mobile | Avaliar React Native ou Flutter |

---

## Cronograma estimado (referência)

| Fase | Duração estimada |
|------|------------------|
| Fase 0 | 1–2 semanas |
| Fase 1 | 1–2 semanas |
| Fase 2 | 2–3 semanas |
| Fase 3 | 2–3 semanas |
| Fase 4 | 1–2 semanas |
| Fase 5 | 1–2 semanas |
| **Total MVP** | **~10–14 semanas** (equipe pequena, meio período) |

Estimativas flexíveis conforme disponibilidade da equipe pastoral + desenvolvimento.

---

## Documentos relacionados

- [Visão geral](./visao-geral.md)
- [Arquitetura](./arquitetura.md)
- [Requisitos](./requisitos.md)
- [Regras de negócio](./regras-negocio.md)
- [PROJECT.md](../PROJECT.md)
