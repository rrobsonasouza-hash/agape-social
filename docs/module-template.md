\# Template Oficial de Módulo — Ágape



Versão: 1.0



\---



\# Objetivo



Todo novo módulo do Ágape deverá seguir esta estrutura.



Ela garante:



\- organização;

\- padronização;

\- facilidade de manutenção;

\- baixo acoplamento;

\- alta reutilização.



\---



\# Estrutura



```

modules/



nome-do-modulo/



├── hooks/

├── repositories/

├── schemas/

├── services/

└── types/

```



\---



\# Responsabilidade de cada pasta



\## schemas



Responsável pela validação dos dados utilizando Zod.



Não contém regras de negócio.



Exemplo:



\- voluntario.schema.ts

\- familia.schema.ts



\---



\## types



Tipos utilizados pelo domínio.



Exemplo:



\- voluntario-documento.ts



\---



\## repositories



Única camada autorizada a acessar diretamente o Firestore.



Responsabilidades:



\- criar

\- editar

\- excluir

\- listar

\- buscarPorId



Não deve possuir regra de negócio.



\---



\## services



Responsável pelas regras de negócio.



Exemplos:



\- impedir cadastro duplicado

\- validar situação

\- aplicar regras futuras



Nunca acessa Firebase diretamente.



Sempre utiliza Repository.



\---



\## hooks



Camada utilizada pela interface.



Responsável por conectar as páginas aos Services.



Nunca acessa Firebase.



Nunca possui regra de negócio.



\---



\# Fluxo Oficial



Página



↓



Hook



↓



Service



↓



Repository



↓



Firebase



\---



\# Regras



\## Repository



Somente persistência.



\---



\## Service



Somente regra de negócio.



\---



\## Hook



Somente comunicação com a interface.



\---



\## Página



Somente apresentação.



\---



\# Nunca fazer



Página acessando Firebase.



Service acessando Firestore diretamente.



Repository contendo regra de negócio.



Hook contendo validações complexas.



\---



\# Benefícios



\- Código organizado



\- Fácil manutenção



\- Testável



\- Escalável



\- Baixo acoplamento



\- Alto reaproveitamento



\---



Este documento é obrigatório para todos os módulos do Ágape.

