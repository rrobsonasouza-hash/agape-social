# Login

## Objetivo

Permitir que usuários previamente cadastrados pelo Administrador acessem o sistema Ágape Social de forma segura.

Não haverá cadastro público de usuários.

---

# Escopo

Esta funcionalidade contempla:

- Login por e-mail e senha
- Validação dos dados
- Integração com Firebase Authentication
- Validação do usuário no Firestore
- Redirecionamento para o Dashboard
- Recuperação de senha

Não contempla:

- Cadastro de usuários
- Alteração de perfil
- Alteração de senha
- Autenticação em dois fatores (2FA)

---

# Fluxo

Usuário acessa a tela de Login.

↓

Informa e-mail.

↓

Informa senha.

↓

Clica em Entrar.

↓

Firebase Authentication valida as credenciais.

↓

Se inválidas:

Exibir mensagem de erro.

↓

Se válidas:

Consultar coleção "usuarios" no Firestore.

↓

Verificar:

- Usuário existe
- Está ativo
- Possui perfil
- Está vinculado a uma paróquia

↓

Caso positivo:

Registrar último acesso.

↓

Redirecionar para o Dashboard.

---

# Campos

## E-mail

Tipo:

Texto

Obrigatório:

Sim

Validação:

Formato de e-mail válido.

---

## Senha

Tipo:

Password

Obrigatório:

Sim

Mínimo:

6 caracteres

---

# Botões

## Entrar

Realiza autenticação.

---

## Esqueci minha senha

Redireciona para recuperação de senha.

---

# Mensagens

## Campos obrigatórios

"Informe seu e-mail e senha."

---

## Login inválido

"E-mail ou senha inválidos."

---

## Usuário inativo

"Seu acesso encontra-se inativo. Entre em contato com o administrador."

---

## Usuário sem perfil

"Seu usuário não possui perfil definido."

---

## Usuário sem paróquia

"Seu usuário não está vinculado a uma paróquia."

---

# Segurança

Não armazenar senha localmente.

Utilizar Firebase Authentication.

Sessão controlada pelo Firebase.

Rotas protegidas.

Logout obrigatório.

---

# Layout

A tela conterá:

- Logo Ágape Social
- Nome do sistema
- Slogan
- Campo E-mail
- Campo Senha
- Botão Entrar
- Link Esqueci minha senha
- Número da versão
- Rodapé

---

# Critérios de Aceite

- Usuário consegue acessar utilizando e-mail e senha.
- Login inválido apresenta mensagem amigável.
- Usuário inativo não consegue acessar.
- Usuário sem perfil não consegue acessar.
- Após login, o Dashboard é exibido.
- A sessão permanece ativa enquanto válida.
- O logout encerra completamente a sessão.

---

# Status

Planejado