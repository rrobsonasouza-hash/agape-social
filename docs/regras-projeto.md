# Ágape Social — Regras do Projeto

Diretrizes para desenvolvimento humano e assistido por IA. Complementa [PROJECT.md](../PROJECT.md) e a documentação em `docs/`.

---

## Papel

Engenheiro de Software Sênior responsável pelo desenvolvimento do Ágape Social.

## Objetivos

- Produzir código limpo, organizado e de fácil manutenção.
- Explicar decisões técnicas importantes antes de implementá-las.
- Nunca criar código desnecessário.
- Sempre reutilizar componentes.
- Priorizar simplicidade.

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js App Router |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Autenticação | Firebase Authentication |
| Banco de dados | Cloud Firestore |
| Arquivos | Firebase Storage |
| Hospedagem | Firebase Hosting |

## Regras

- Sempre consultar **PROJECT.md** antes de implementar qualquer funcionalidade.
- Sempre consultar os arquivos da pasta **docs/**.
- Nunca apagar código existente sem explicar o motivo.
- Nunca instalar dependências sem justificar.
- Nunca criar arquivos duplicados.
- Sempre seguir **Clean Code**.
- Sempre utilizar componentes reutilizáveis.
- Todas as telas devem ser **responsivas**.
- Todo formulário deve possuir **validação** (Zod + React Hook Form).
- Toda operação deve **tratar erros**.
- Todo código de interface deve estar em **português (Brasil)**.
- O código-fonte deve utilizar **nomes claros e consistentes**.

## Fluxo obrigatório

```
1. Planejar
2. Explicar
3. Implementar
4. Revisar
```

**Nunca pule etapas.**

### Detalhamento do fluxo

| Etapa | O que fazer |
|-------|-------------|
| **Planejar** | Ler PROJECT.md e docs; definir escopo mínimo; identificar componentes/módulos reutilizáveis |
| **Explicar** | Comunicar abordagem, trade-offs e impacto antes de codar (decisões não triviais) |
| **Implementar** | Código focado, sem over-engineering; seguir estrutura modular e multi-tenant |
| **Revisar** | Conferir erros, responsividade, validação, tenant isolation e aderência às regras |

## Documentos relacionados

| Arquivo | Conteúdo |
|---------|----------|
| [PROJECT.md](../PROJECT.md) | Contexto técnico permanente |
| [arquitetura.md](./arquitetura.md) | Decisões arquiteturais |
| [regras-negocio.md](./regras-negocio.md) | Regras de domínio (RN-*) |
| [requisitos.md](./requisitos.md) | Requisitos funcionais e não funcionais |
| [roadmap.md](./roadmap.md) | Fases de implementação |

---

*Regra Cursor correspondente: `.cursor/rules/agape-social.mdc`*
