# Requisitos — Ágape Social

Documento de requisitos funcionais (RF) e não funcionais (RNF) do sistema. Prioridades: **Must** (obrigatório no MVP da fase), **Should** (importante), **Could** (desejável), **Won't** (fora do escopo atual).

---

## 1. Requisitos funcionais

### 1.1 Autenticação e sessão

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | O sistema deve permitir login com e-mail e senha via Firebase Authentication | Must |
| RF-002 | O sistema deve permitir logout encerrando a sessão de forma segura | Must |
| RF-003 | Rotas da área logada devem redirecionar usuários não autenticados para login | Must |
| RF-004 | O sistema deve associar cada usuário autenticado a uma paróquia (`paroquiaId`) | Must |
| RF-005 | O sistema deve recuperação de senha por e-mail (Firebase) | Should |
| RF-006 | Login com provedor Google | Could |

### 1.2 Multi-tenant (paróquias)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-010 | Cada registro de negócio deve pertencer a exatamente uma paróquia | Must |
| RF-011 | Usuário comum só pode visualizar e alterar dados da própria paróquia | Must |
| RF-012 | Deve existir cadastro de paróquia (nome, diocese, contato, status) | Must |
| RF-013 | Admin de paróquia pode configurar dados básicos da paróquia | Should |
| RF-014 | Admin de plataforma gerencia múltiplas paróquias | Could |

### 1.3 Usuários e permissões

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-020 | Admin de paróquia pode convidar/criar usuários da paróquia | Must |
| RF-021 | Admin pode atribuir papéis: admin_paroquia, coordenador, operador, voluntario, leitor | Must |
| RF-022 | Admin pode desativar usuário sem excluir histórico | Must |
| RF-023 | Usuário desativado não pode autenticar | Must |
| RF-024 | Listagem de usuários com filtro por papel e status | Should |

### 1.4 Famílias

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-030 | Cadastrar família com dados de identificação, endereço e contato | Must |
| RF-031 | Registrar composição familiar (membros, parentesco, idade) | Must |
| RF-032 | Registrar situação socioeconômica e observações pastorais | Must |
| RF-033 | Marcar família como ativa, inativa ou em acompanhamento | Must |
| RF-034 | Buscar famílias por nome, bairro, status | Must |
| RF-035 | Editar e consultar histórico básico de alterações | Should |
| RF-036 | Anexar documentos/fotos via Firebase Storage (com consentimento) | Should |

### 1.5 Voluntários

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-040 | Cadastrar voluntário com dados pessoais e contato | Must |
| RF-041 | Registrar áreas de atuação e disponibilidade | Should |
| RF-042 | Vincular voluntário a usuário do sistema (opcional) | Should |
| RF-043 | Marcar voluntário como ativo/inativo | Must |
| RF-044 | Listar voluntários com filtros | Must |

### 1.6 Doadores

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-050 | Cadastrar doador pessoa física ou jurídica | Must |
| RF-051 | Registrar histórico de doações (tipo, data, descrição, valor estimado) | Must |
| RF-052 | Buscar doadores por nome ou documento | Must |
| RF-053 | Exportar lista de doadores por período | Should |

### 1.7 Estoque

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-060 | Cadastrar produtos/itens de estoque (nome, unidade, estoque mínimo) | Must |
| RF-061 | Registrar entrada de estoque (quantidade, origem, data) | Must |
| RF-062 | Registrar saída de estoque (quantidade, motivo, data) | Must |
| RF-063 | Exibir saldo atual por produto | Must |
| RF-064 | Alertar produtos abaixo do estoque mínimo | Must |
| RF-065 | Registrar validade de produtos perecíveis | Should |
| RF-066 | Histórico de movimentações por produto | Must |

### 1.8 Cestas básicas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-070 | Definir composição padrão de cesta (lista de produtos e quantidades) | Must |
| RF-071 | Montar cesta avulsa com itens e quantidades | Must |
| RF-072 | Registrar entrega de cesta a família (data, responsável, itens) | Must |
| RF-073 | Baixa automática de estoque ao confirmar entrega | Must |
| RF-074 | Consultar histórico de cestas recebidas por família | Must |
| RF-075 | Impedir entrega se estoque insuficiente | Must |

### 1.9 Visitas

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-080 | Registrar visita pastoral a família (data, voluntário, tipo, relato) | Must |
| RF-081 | Classificar visita (domiciliar, paroquial, telefone, etc.) | Should |
| RF-082 | Agendar próxima visita / follow-up | Should |
| RF-083 | Listar visitas por família, período ou voluntário | Must |
| RF-084 | Anexar fotos ou arquivos à visita (Storage) | Could |

### 1.10 Dashboard

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-090 | Exibir total de famílias ativas | Must |
| RF-091 | Exibir visitas realizadas no mês | Must |
| RF-092 | Exibir entregas de cestas no mês | Must |
| RF-093 | Exibir produtos com estoque crítico | Must |
| RF-094 | Gráficos de evolução (famílias, visitas, doações) | Should |

### 1.11 Relatórios

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-100 | Relatório de famílias atendidas por período | Must |
| RF-101 | Relatório de entregas de cestas | Must |
| RF-102 | Relatório de movimentação de estoque | Must |
| RF-103 | Relatório de visitas por voluntário | Should |
| RF-104 | Exportação em PDF ou CSV | Should |
| RF-105 | Filtros por data, status, bairro, voluntário | Must |

---

## 2. Requisitos não funcionais

### 2.1 Performance e disponibilidade

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-001 | Páginas principais devem carregar em até 3s em conexão 4G média | Should |
| RNF-002 | Listagens paginadas (mín. 20 itens por página) | Must |
| RNF-003 | Operações de escrita devem feedback visual (loading/sucesso/erro) | Must |

### 2.2 Segurança

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-010 | Toda comunicação via HTTPS | Must |
| RNF-011 | Firestore Security Rules validando tenant e papel | Must |
| RNF-012 | Storage Rules com path por paróquia | Must |
| RNF-013 | Validação server-side de toda entrada (Zod) | Must |
| RNF-014 | Senhas gerenciadas exclusivamente pelo Firebase Auth | Must |

### 2.3 Usabilidade

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-020 | Interface inteira em português (Brasil) | Must |
| RNF-021 | Layout responsivo (desktop prioritário; tablet/mobile usável) | Must |
| RNF-022 | Formulários com mensagens de erro claras em português | Must |
| RNF-023 | Confirmação antes de ações destrutivas (exclusão, baixa de estoque) | Must |

### 2.4 Conformidade e dados

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-030 | Tratamento de dados pessoais conforme LGPD | Must |
| RNF-031 | Registro de consentimento no cadastro de família | Should |
| RNF-032 | Possibilidade de anonimizar/inativar família mantendo histórico agregado | Should |
| RNF-033 | Retenção mínima necessária; política documentada | Should |

### 2.5 Manutenibilidade

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-040 | Código TypeScript strict | Must |
| RNF-041 | Módulos de domínio isolados em `src/modules/` | Must |
| RNF-042 | Documentação atualizada em `docs/` e `PROJECT.md` | Must |
| RNF-043 | Emulators Firebase para desenvolvimento local | Must |

### 2.6 Operacional

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RNF-050 | Deploy via Firebase Hosting | Must |
| RNF-051 | Variáveis de ambiente documentadas em `.env.example` | Must |
| RNF-052 | Rules e indexes versionados no repositório | Must |
| RNF-053 | Monitoramento básico de erros (fase posterior) | Could |

---

## 3. Restrições técnicas

- Framework: **Next.js (App Router)** + **TypeScript**
- UI: **Tailwind CSS** + **shadcn/ui**
- Backend-as-a-Service: **Firebase** (Auth, Firestore, Storage, Hosting)
- Arquitetura: **monólito modular**
- Multi-tenant: **`paroquiaId`** em todas as entidades de negócio

---

## 4. Glossário

| Termo | Definição |
|-------|-----------|
| **Paróquia** | Tenant — unidade organizacional católica atendida pelo sistema |
| **Família atendida** | Núcleo familiar cadastrado pela pastoral para acompanhamento |
| **Cesta básica** | Conjunto de itens de alimentos/insumos entregues à família |
| **Visita pastoral** | Registro de contato/acompanhamento com a família |
| **Tenant** | Isolamento lógico de dados por paróquia |

---

## 5. Documentos relacionados

- [Visão geral](./visao-geral.md)
- [Arquitetura](./arquitetura.md)
- [Regras de negócio](./regras-negocio.md)
- [Roadmap](./roadmap.md)
