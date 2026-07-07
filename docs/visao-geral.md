# Visão Geral — Ágape Social

## O que é

O **Ágape Social** é um sistema web **gratuito** para gestão da **Pastoral Social** de paróquias católicas. Ele centraliza cadastros, operação do dia a dia (estoque, cestas, visitas) e acompanhamento (dashboard e relatórios), com controle de acesso por perfil de usuário.

O nome remete ao **Ágape** — amor fraterno e serviço aos mais necessitados — e expressa a missão do software: apoiar a ação social paroquial de forma organizada, digna e segura.

## Problema que resolve

Paróquias costumam registrar famílias atendidas, doações, estoque e visitas em planilhas, cadernos ou ferramentas genéricas. Isso gera:

- Dados dispersos e difíceis de consolidar
- Risco de perda de informação sensível
- Dificuldade para gerar relatórios à pastoral, ao pároco ou à diocese
- Falta de rastreio de entregas de cestas e movimentação de estoque
- Acesso compartilhado sem controle fino de permissões

O Ágape Social oferece um **único lugar** para coordenadores, voluntários e administradores registrarem e consultarem informações com **segurança**, **organização** e **visão gerencial**.

## Público-alvo

| Persona | Necessidade principal |
|---------|------------------------|
| **Coordenador(a) da Pastoral Social** | Visão geral, relatórios, gestão de equipe e cadastros |
| **Voluntário(a)** | Registrar visitas, consultar famílias, apoiar entregas |
| **Operador(a) administrativo** | Cadastros, estoque, montagem e entrega de cestas |
| **Administrador da paróquia** | Usuários, configurações e auditoria básica |
| **Pároco / liderança** | Dashboard e relatórios para acompanhamento pastoral |

## Objetivos do produto

1. **Organizar** o atendimento social paroquial com cadastros estruturados
2. **Rastrear** doações, estoque, cestas e visitas de forma confiável
3. **Informar** decisões por meio de dashboard e relatórios
4. **Proteger** dados sensíveis de famílias em situação de vulnerabilidade (LGPD)
5. **Escalar** para múltiplas paróquias na mesma plataforma (multi-tenant)
6. **Manter custo zero** de infraestrutura para paróquias pequenas (Firebase free tier + hospedagem Firebase)

## Escopo funcional (visão de produto)

O sistema contemplará, ao longo do roadmap:

- Cadastro de famílias
- Cadastro de voluntários
- Cadastro de doadores
- Controle de estoque
- Controle de cestas básicas
- Registro de visitas
- Relatórios
- Dashboard
- Controle de usuários
- Login e autenticação

## Fora de escopo (por enquanto)

- Aplicativo mobile nativo (PWA pode ser considerado no futuro)
- Integração bancária ou emissão de recibos fiscais
- Gestão financeira contábil completa
- Multi-idioma (apenas português do Brasil na interface)
- Marketplace ou rede social entre paróquias

## Princípios orientadores

| Princípio | Descrição |
|-----------|-----------|
| **Simplicidade** | Interface clara para usuários com pouca familiaridade técnica |
| **Dignidade** | Tratamento respeitoso dos dados de famílias vulneráveis |
| **Modularidade** | Monólito modular — domínios isolados, evolução incremental |
| **Multi-paróquia** | Cada registro pertence a uma paróquia; isolamento rigoroso de dados |
| **Custo acessível** | Stack e hospedagem compatíveis com uso gratuito ou de baixo custo |
| **Conformidade** | LGPD desde o desenho — consentimento, minimização e segurança |

## Stack tecnológica (decisões adotadas)

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Banco de dados | Firebase Firestore |
| Autenticação | Firebase Authentication |
| Arquivos | Firebase Storage |
| Hospedagem | Firebase Hosting |
| Arquitetura | Monólito modular |
| Idioma da interface | Português (Brasil) |

## Modelo multi-tenant

Cada **paróquia** é um tenant lógico. Usuários, famílias, estoque, visitas e demais entidades são sempre vinculados a uma `paroquiaId`. Regras de segurança no Firestore e na aplicação garantem que um usuário **nunca** acesse dados de outra paróquia.

Um mesmo deploy atende várias paróquias; a separação é por identificador de tenant, não por instância separada de servidor.

## Métricas de sucesso (indicadores)

- Redução do tempo para gerar relatório mensual da pastoral
- Cadastro completo de famílias ativas com histórico de visitas e entregas
- Estoque com saldo confiável e alertas de itens em falta
- Zero incidentes de vazamento entre paróquias (isolamento multi-tenant)
- Adoção por coordenadores sem treinamento técnico extensivo

## Documentos relacionados

- [Arquitetura](./arquitetura.md) — decisões técnicas e estrutura do sistema
- [Requisitos](./requisitos.md) — requisitos funcionais e não funcionais
- [Regras de negócio](./regras-negocio.md) — regras por domínio
- [Roadmap](./roadmap.md) — fases de implementação
- [PROJECT.md](../PROJECT.md) — contexto permanente para desenvolvimento

# Ágape Social

Versão: 1.0

## Missão

Organizar e fortalecer o trabalho da Pastoral Social das paróquias, oferecendo uma plataforma gratuita, intuitiva e segura para cadastro de famílias, gestão de doações, controle de estoque e acompanhamento das ações sociais.

## Visão

Ser o principal sistema gratuito para gestão da ação social das paróquias católicas, promovendo transparência, organização e melhor atendimento às famílias em situação de vulnerabilidade.

## Valores

- Caridade
- Transparência
- Simplicidade
- Segurança
- Organização
- Gratuidade
- Respeito à dignidade humana

## Público-alvo

- Pastorais Sociais
- Paróquias
- Comunidades
- Obras Sociais
- Instituições filantrópicas

## Objetivos

- Centralizar todas as informações da Pastoral Social.
- Evitar controles em papel.
- Melhorar o acompanhamento das famílias.
- Controlar estoque e doações.
- Gerar relatórios automaticamente.
- Facilitar a prestação de contas.