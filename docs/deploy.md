# Deploy e operação do Ágape Social

## Serviços necessários

- Repositório GitHub conectado à Vercel.
- Projeto Supabase com banco, Auth e Storage.
- Domínio HTTPS da Vercel ou domínio próprio.

## Variáveis da Vercel

Configure nos ambientes Production e Preview:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_OSM_TILE_URL=
```

Nunca publique a chave `SUPABASE_SERVICE_ROLE_KEY`, arquivos `.env.local` ou backups no GitHub.

## Banco de dados

1. Abra o SQL Editor do projeto Supabase correto.
2. Execute os arquivos de `supabase/migrations` em ordem pelo nome.
3. Registre internamente a última migration aplicada.
4. Antes de migrations que alterem dados, gere e valide um backup em Administração.

## Publicação

1. Execute `npm ci`, `npm test`, `npm run lint` e `npm run build`.
2. Envie o commit para a branch `main`.
3. Aguarde o CI do GitHub e o deploy da Vercel ficarem verdes.
4. Consulte `https://SEU-DOMINIO/api/saude`; o retorno deve ter `status: "ok"` e `banco: "disponivel"`.

## Verificação após deploy

- Login e seleção da paróquia.
- Cadastro e consulta de família.
- Estoque e entrega de cesta.
- Secretaria, caixa e dízimos.
- Tesouraria, saldos e transferência entre contas.
- Geração e validação do backup.
- Perfis sem acesso às áreas não autorizadas.

## Incidente ou falha

1. Confirme `/api/saude` e o painel da Vercel.
2. Verifique logs sem copiar dados pessoais para canais públicos.
3. Se a falha começou após um deploy, use o rollback da Vercel para a última publicação estável.
4. Não restaure backup diretamente em produção sem validar o arquivo e preparar um plano de reversão.
5. Registre horário, impacto, causa e correção aplicada.

## Rotina recomendada

- Diário: observar falhas da Vercel e disponibilidade do sistema.
- Semanal: gerar e validar backup, guardando-o em local protegido.
- Mensal: revisar usuários, perfis, auditoria e cadastros inativos.
- Antes de cada entrega: testes, build, migration e backup quando aplicável.
