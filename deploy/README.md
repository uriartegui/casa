# Deploy da API

Deploy de producao do Colmeia na VPS usando Docker Compose.

## Stack

- Postgres 16
- API NestJS
- Caddy com HTTPS automatico

## Arquivos

```txt
deploy/docker-compose.yml
deploy/Caddyfile
deploy/.env.example
deploy/backup.sh
```

## Setup inicial da VPS

```bash
curl -fsSL https://get.docker.com | sh

git clone https://github.com/uriartegui/casa.git /opt/casa
cd /opt/casa/deploy
cp .env.example .env
nano .env

docker compose --env-file .env up -d --build
```

## Variaveis principais

Preencher em `/opt/casa/deploy/.env`:

```env
API_DOMAIN=
POSTGRES_USER=casa
POSTGRES_DB=casa
POSTGRES_PASSWORD=
JWT_SECRET=
```

Opcionais:

```env
BETTER_STACK_SOURCE_TOKEN=
ENABLE_SWAGGER=false
SWAGGER_USER=
SWAGGER_PASSWORD=
ENABLE_TEST_ALERTS=false
TEST_ALERT_TOKEN=
```

## Operacao

Na VPS:

```bash
cd /opt/casa/deploy
docker compose --env-file .env ps
docker compose --env-file .env logs -f api
```

Recriar API:

```bash
docker compose --env-file .env up -d --build --force-recreate api
```

Healthcheck:

```bash
curl -I https://colmeiaapp.duckdns.org/health
```

## Swagger protegido

Para habilitar temporariamente:

```env
ENABLE_SWAGGER=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=uma_senha_forte
```

Teste:

```bash
curl -I https://colmeiaapp.duckdns.org/docs
```

Esperado:

```txt
HTTP/2 401
www-authenticate: Basic realm="Colmeia Swagger"
```

## Backup

```bash
chmod +x /opt/casa/deploy/backup.sh
echo '0 3 * * * root /opt/casa/deploy/backup.sh >> /var/log/casa-backup.log 2>&1' > /etc/cron.d/casa-backup
```

Restaurar backup:

```bash
gunzip -c /opt/casa-backups/casa-XXXX.sql.gz | \
  docker compose --env-file .env exec -T db \
  sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
```

Mais detalhes:

- [Deploy e VPS](../docs/deploy.md)
