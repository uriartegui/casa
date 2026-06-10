# Deploy da API (VPS HostGator)

Stack: Docker Compose com Postgres 16 + API NestJS + Caddy (HTTPS automático).

## Setup inicial da VPS (uma vez)

```bash
# 1. Docker
curl -fsSL https://get.docker.com | sh

# 2. Código
git clone https://github.com/uriartegui/casa.git /opt/casa
cd /opt/casa/deploy
cp .env.example .env
nano .env   # preencher API_DOMAIN, POSTGRES_PASSWORD, JWT_SECRET

# 3. Subir
docker compose -f docker-compose.yml --env-file .env up -d --build

# 4. Backup diário (3h da manhã) + log
chmod +x /opt/casa/deploy/backup.sh
echo '0 3 * * * root /opt/casa/deploy/backup.sh >> /var/log/casa-backup.log 2>&1' > /etc/cron.d/casa-backup

# 5. Firewall básico
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## Deploy automático

Todo push na `main` que toque `backend/` ou `deploy/` dispara o workflow
[.github/workflows/deploy.yml](../.github/workflows/deploy.yml), que conecta na
VPS via SSH e roda `docker compose up -d --build`.

O painel de deploy fica no GitHub:

- **Actions**: histórico de cada deploy, commit, duração, logs e resumo do run.
- **Environments → production**: status do ambiente de produção e URL da API.
- **Run summary**: card com commit, autor, ambiente e resultado do health check.

Também é possível disparar um deploy manual pela aba **Actions → Deploy API → Run workflow**.

Secrets necessários no GitHub (Settings → Secrets and variables → Actions):

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP da VPS |
| `VPS_SSH_KEY` | chave privada SSH com acesso root à VPS |

## Operação

```bash
cd /opt/casa
# logs da API
docker compose -f deploy/docker-compose.yml --env-file deploy/.env logs -f api
# status
docker compose -f deploy/docker-compose.yml --env-file deploy/.env ps
# restaurar um backup
gunzip -c /opt/casa-backups/casa-XXXX.sql.gz | \
  docker compose -f deploy/docker-compose.yml --env-file deploy/.env exec -T db \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

O schema do banco é criado/atualizado automaticamente no boot da API
(migrations do TypeORM com `migrationsRun: true`).
