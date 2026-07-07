# Regras de Negócio — Ágape Social

Regras que governam o comportamento do sistema independentemente da implementação técnica. Organizadas por domínio.

---

## 1. Regras gerais e multi-tenant

| ID | Regra |
|----|-------|
| RN-G01 | Todo dado de negócio pertence a uma única paróquia identificada por `paroquiaId`. |
| RN-G02 | Nenhuma operação de leitura ou escrita pode cruzar dados entre paróquias. |
| RN-G03 | Usuário autenticado deve possuir `paroquiaId` e `role` válidos para acessar o sistema. |
| RN-G04 | Usuário com status **inativo** não pode realizar login nem operações no sistema. |
| RN-G05 | Exclusão física de registros com histórico relevante deve ser evitada; preferir **inativação** ou **soft delete**. |
| RN-G06 | Datas e horários são armazenados em UTC e exibidos no fuso **`America/Sao_Paulo`** com locale **`pt-BR`**. |
| RN-G07 | Valores monetários são registrados em **BRL** com duas casas decimais. |

---

## 2. Autenticação e usuários

| ID | Regra |
|----|-------|
| RN-A01 | E-mail de login deve ser único na plataforma (Firebase Auth). |
| RN-A02 | Apenas **admin_paroquia** pode criar, editar papéis e desativar usuários da mesma paróquia. |
| RN-A03 | Um usuário pertence a no máximo **uma paróquia** por vez (MVP). |
| RN-A04 | **Voluntário** com papel `voluntario` pode registrar visitas e consultar famílias, mas não excluir cadastros de família. |
| RN-A05 | Papel **leitor** não pode criar, editar ou excluir nenhum registro. |
| RN-A06 | **Coordenador** possui acesso operacional amplo na paróquia, exceto gestão de admin de plataforma. |
| RN-A07 | Ao desativar usuário, sessões ativas devem ser invalidadas na próxima verificação de auth. |

### Matriz de permissões (resumo)

| Ação | leitor | voluntario | operador | coordenador | admin_paroquia |
|------|--------|------------|----------|-------------|----------------|
| Ver dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| CRUD famílias | — | R | ✓ | ✓ | ✓ |
| CRUD voluntários | — | R | ✓ | ✓ | ✓ |
| CRUD doadores | — | — | ✓ | ✓ | ✓ |
| Movimentar estoque | — | — | ✓ | ✓ | ✓ |
| Entregar cestas | — | ✓* | ✓ | ✓ | ✓ |
| Registrar visitas | — | ✓ | ✓ | ✓ | ✓ |
| Relatórios | R | R | ✓ | ✓ | ✓ |
| Gerenciar usuários | — | — | — | — | ✓ |

\* Voluntário pode registrar entrega se explicitamente autorizado pelo coordenador (configuração futura); no MVP, operador+.

---

## 3. Paróquias

| ID | Regra |
|----|-------|
| RN-P01 | Paróquia deve ter nome oficial e status **ativa** ou **inativa**. |
| RN-P02 | Paróquia **inativa** impede login de novos usuários; usuários existentes recebem aviso e acesso somente leitura (fase posterior) ou bloqueio total (MVP: bloqueio). |
| RN-P03 | Dados de contato da paróquia (telefone, e-mail pastoral) são editáveis por **admin_paroquia**. |

---

## 4. Famílias

| ID | Regra |
|----|-------|
| RN-F01 | Família deve ter ao menos um **responsável** identificado (nome + contato). |
| RN-F02 | Status permitidos: **ativa**, **inativa**, **em_acompanhamento**. |
| RN-F03 | Família **inativa** não recebe novas entregas de cesta até reativação. |
| RN-F04 | Endereço deve conter CEP, logradouro, número, bairro, cidade e UF quando disponíveis. |
| RN-F05 | CPF de membros é opcional, mas se informado deve ser válido (dígitos verificadores). |
| RN-F06 | Observações pastorais são confidenciais — visíveis apenas a papéis operador ou superior. |
| RN-F07 | Cadastro de família deve registrar **consentimento** para tratamento de dados (LGPD). |
| RN-F08 | Não é permitido duplicar família com mesmo responsável + mesmo endereço na mesma paróquia (alerta de possível duplicidade). |

---

## 5. Voluntários

| ID | Regra |
|----|-------|
| RN-V01 | Voluntário **inativo** não pode ser atribuído a novas visitas. |
| RN-V02 | Voluntário pode existir sem usuário de sistema vinculado (cadastro operacional). |
| RN-V03 | Se vinculado a usuário, o papel do usuário deve ser compatível (`voluntario`, `operador` ou superior). |
| RN-V04 | E-mail e telefone são recomendados para contato; pelo menos um contato é obrigatório. |

---

## 6. Doadores

| ID | Regra |
|----|-------|
| RN-D01 | Doador pode ser **pessoa_fisica** ou **pessoa_juridica**. |
| RN-D02 | CPF ou CNPJ, quando informados, devem ser válidos. |
| RN-D03 | Toda doação registrada deve ter **data**, **tipo** (dinheiro, alimento, material, serviço) e **descrição**. |
| RN-D04 | Doação em dinheiro registra **valor**; doação em espécie pode registrar **valor estimado** opcional. |
| RN-D05 | Doação de alimentos/material pode gerar **entrada automática no estoque** se o operador confirmar (fluxo integrado — fase estoque). |

---

## 7. Estoque

| ID | Regra |
|----|-------|
| RN-E01 | Saldo de produto = soma(entradas) − soma(saídas); nunca negativo. |
| RN-E02 | Saída que resultaria em saldo negativo deve ser **bloqueada**. |
| RN-E03 | Toda movimentação registra: produto, quantidade, tipo (entrada/saída), data, responsável (`userId`) e motivo. |
| RN-E04 | Produto com saldo ≤ estoque mínimo gera **alerta** no dashboard. |
| RN-E05 | Produto **inativo** não aparece para novas movimentações, mas mantém histórico. |
| RN-E06 | Unidade de medida é obrigatória (un, kg, L, cx, etc.). |
| RN-E07 | Entrada por doação deve referenciar doador quando conhecido (campo opcional `doadorId`). |

---

## 8. Cestas básicas

| ID | Regra |
|----|-------|
| RN-C01 | Cesta padrão é um **template** reutilizável; entrega usa instância concreta com itens e quantidades. |
| RN-C02 | Ao **confirmar entrega**, o sistema baixa estoque de cada item da cesta atomicamente (todas as baixas ou nenhuma). |
| RN-C03 | Entrega só é permitida para família com status **ativa** ou **em_acompanhamento**. |
| RN-C04 | Entrega registra: família, data, responsável pela entrega, itens entregues e observações. |
| RN-C05 | Se qualquer item não tiver estoque suficiente, a entrega é **bloqueada** com lista de itens em falta. |
| RN-C06 | Cancelamento de entrega confirmada deve **estornar estoque** e registrar motivo (operação excepcional — coordenador+). |
| RN-C07 | Família pode receber mais de uma cesta no mesmo mês; sistema registra histórico sem bloqueio automático (coordenação pastoral decide). |

---

## 9. Visitas

| ID | Regra |
|----|-------|
| RN-VS01 | Visita deve estar vinculada a uma **família** e a um **voluntário** (ou usuário registrador). |
| RN-VS02 | Data da visita não pode ser futura além de **7 dias** (permite agendamento registrado como visita planejada — fase posterior). |
| RN-VS03 | Relato da visita é obrigatório (texto mínimo configurável, ex.: 20 caracteres). |
| RN-VS04 | Visita a família **inativa** é permitida apenas para encerramento ou reavaliação (tipo de visita específico). |
| RN-VS05 | Próxima visita sugerida, se informada, deve ser data ≥ data da visita atual. |

---

## 10. Dashboard e relatórios

| ID | Regra |
|----|-------|
| RN-R01 | Indicadores do dashboard consideram apenas dados da **paróquia do usuário logado**. |
| RN-R02 | Período padrão de relatórios: **mês corrente**; usuário pode alterar intervalo. |
| RN-R03 | Relatórios exportados incluem cabeçalho com nome da paróquia e data de geração. |
| RN-R04 | Dados sensíveis (CPF completo, observações confidenciais) não entram em exportações padrão; exportação detalhada exige papel **coordenador+**. |

---

## 11. Arquivos (Firebase Storage)

| ID | Regra |
|----|-------|
| RN-ST01 | Arquivos são armazenados em path `paroquias/{paroquiaId}/...`. |
| RN-ST02 | Tamanho máximo por arquivo: **5 MB** (MVP); tipos permitidos: PDF, JPEG, PNG. |
| RN-ST03 | Upload exige autenticação e permissão compatível com o recurso vinculado. |
| RN-ST04 | Exclusão de arquivo segue permissão de edição do recurso pai. |

---

## 12. LGPD e privacidade

| ID | Regra |
|----|-------|
| RN-L01 | Coletar apenas dados necessários ao atendimento pastoral. |
| RN-L02 | Consentimento registrado com data e versão da política de privacidade. |
| RN-L03 | Titular pode solicitar correção de dados; coordenador+ executa no sistema. |
| RN-L04 | Direito de eliminação: família pode ser anonimizada (substituir PII por placeholders) mantendo estatísticas agregadas. |
| RN-L05 | Logs de auditoria não devem conter conteúdo sensível completo de relatos de visita. |

---

## 13. Validações comuns (Brasil)

| Campo | Validação |
|-------|-----------|
| CPF | 11 dígitos, dígitos verificadores válidos |
| CNPJ | 14 dígitos, dígitos verificadores válidos |
| CEP | 8 dígitos; consulta opcional de endereço (ViaCEP — fase posterior) |
| Telefone | DDD + número; celular 9 dígitos |
| UF | Sigla válida (27 estados) |
| E-mail | Formato RFC básico |

---

## Documentos relacionados

- [Visão geral](./visao-geral.md)
- [Arquitetura](./arquitetura.md)
- [Requisitos](./requisitos.md)
- [Roadmap](./roadmap.md)
