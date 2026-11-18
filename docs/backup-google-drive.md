# Backup externo do Ágape no Google Drive

O backup diário existente no Supabase continua ativo. O workflow `backup-supabase-to-google-drive.yml` cria uma segunda cópia externa semanal, criptografada, em `Agape - Backups/database`.

O arquivo inclui o banco PostgreSQL e todos os objetos do Supabase Storage. As cópias usam AES-256-CBC/PBKDF2, recebem hash SHA-256 e são retidas por 90 dias.

## Segredos do GitHub

Configure em **GitHub → Agape-Social → Settings → Secrets and variables → Actions**:

- `SUPABASE_DB_URL`: conexão direta ou Session pooler do banco com SSL;
- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `BACKUP_ENCRYPTION_PASSWORD`;
- `GOOGLE_DRIVE_RCLONE_CONFIG`: configuração completa do remoto `gdrive`.

Use a mesma conta Google do Ordo. O workflow cria automaticamente `Agape - Backups/database` quando necessário.

## Teste

Execute manualmente **Backup externo para Google Drive** e confirme a presença de um arquivo `.tar.gz.enc`. Guarde a senha de criptografia fora do GitHub e realize testes periódicos de restauração com `pg_restore` em ambiente isolado.

O backup do Google Drive é complementar: não remova o cron diário nem o bucket privado `backups-paroquiais` do Supabase.
