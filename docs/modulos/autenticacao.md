\# Módulo de Autenticação



\## Projeto



Ágape Social



\---



\# Objetivo



O módulo de autenticação é responsável por controlar o acesso ao sistema, garantindo que apenas usuários autorizados possam acessar as funcionalidades da plataforma.



A autenticação será realizada utilizando o Firebase Authentication.



As informações complementares do usuário (nome, perfil, paróquia, status etc.) serão armazenadas no Firestore.



\---



\# Objetivos do módulo



\- Autenticar usuários com e-mail e senha.

\- Controlar permissões de acesso.

\- Permitir recuperação de senha.

\- Manter a sessão do usuário.

\- Bloquear usuários inativos.

\- Preparar o sistema para múltiplas paróquias.



\---



\# Tecnologias



\- Firebase Authentication

\- Firebase Firestore

\- Next.js 15

\- TypeScript

\- React

\- Tailwind CSS

\- shadcn/ui



\---



\# Fluxo de autenticação



```text

Usuário



↓



Tela de Login



↓



Firebase Authentication



↓



Credenciais válidas?



↓



Não

Mensagem de erro



↓



Sim



↓



Consultar Firestore



↓



Usuário ativo?



↓



Não

Acesso negado



↓



Sim



↓



Carregar permissões



↓



Dashboard

```



\---



\# Cadastro de usuários



O sistema NÃO permitirá cadastro público.



Somente usuários com perfil Administrador poderão criar novos usuários.



Fluxo:



Administrador



↓



Criar usuário



↓



Firebase Authentication



↓



Registro no Firestore



↓



Usuário recebe acesso



\---



\# Perfis



\## Administrador



Permissões:



\- Gerenciar usuários

\- Gerenciar paróquias

\- Configurações

\- Acesso total



\---



\## Coordenador



Permissões:



\- Gerenciar famílias

\- Gerenciar atendimentos

\- Gerenciar voluntários

\- Consultar relatórios



\---



\## Operador



Permissões:



\- Cadastrar famílias

\- Atualizar famílias

\- Registrar atendimentos

\- Registrar visitas



\---



\## Estoquista



Permissões:



\- Entrada de produtos

\- Saída de produtos

\- Controle de estoque

\- Entrega de cestas



\---



\## Consulta



Permissões:



\- Apenas leitura



\---



\# Estrutura da coleção Firestore



Coleção:



usuarios



Documento:



uid do Firebase



Campos:



```json

{

&#x20; "nome": "",

&#x20; "email": "",

&#x20; "perfil": "ADMIN",

&#x20; "paroquiaId": "",

&#x20; "ativo": true,

&#x20; "telefone": "",

&#x20; "ultimoAcesso": null,

&#x20; "createdAt": "",

&#x20; "updatedAt": ""

}

```



\---



\# Telas



\## Login



Campos:



\- E-mail

\- Senha



Botões:



\- Entrar

\- Esqueci minha senha



\---



\## Recuperação de senha



Campo:



\- E-mail



Botão:



\- Enviar link de recuperação



\---



\# Regras



Não permitir usuários inativos.



Não permitir login sem perfil.



Não permitir login sem vínculo com uma paróquia.



Registrar último acesso.



Registrar data de atualização.



\---



\# Mensagens



\## Login inválido



"E-mail ou senha inválidos."



\---



\## Usuário inativo



"Seu usuário encontra-se inativo. Procure o administrador da paróquia."



\---



\## Sem permissão



"Você não possui permissão para acessar esta funcionalidade."



\---



\# Critérios de aceite



✔ Login realizado com sucesso.



✔ Logout funcionando.



✔ Recuperação de senha funcionando.



✔ Sessão persistida.



✔ Usuário inativo bloqueado.



✔ Carregamento do perfil.



✔ Carregamento da paróquia.



✔ Redirecionamento para Dashboard.



\---



\# Melhorias futuras



\- Login com Google.

\- Login com Microsoft.

\- Autenticação em dois fatores (2FA).

\- Auditoria completa de acessos.

\- Registro de dispositivos.

\- Controle de múltiplas sessões.



\---



\# Status



Planejado

