# Deploy e VPS

O ambiente de producao roda na VPS com Docker Compose.

## Stack

```txt
Caddy      HTTPS e proxy reverso
API        NestJS
Postgres   Banco de dados
```

Arquivos principais:

```txt
deploy/docker-compose.yml
deploy/Caddyfile
deploy/.env.example
deploy/backup.sh
```

Na VPS, o `.env` real fica em:

```txt
/opt/casa/deploy/.env
```

Esse arquivo nunca deve ser commitado.

## Subir/recriar API

Na VPS:

```bash
cd /opt/casa/deploy
docker compose --env-file .env up -d --build --force-recreate api
```

Status:

```bash
docker ps
```

Logs:

```bash
docker logs --tail=100 deploy-api-1
```

## Swagger protegido

Variaveis no `/opt/casa/deploy/.env`:

```env
ENABLE_SWAGGER=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=uma_senha_forte
```

Teste:

```bash
curl -I https://colmeiaapp.duckdns.org/docs
```

Resultado esperado:

```txt
HTTP/2 401
www-authenticate: Basic realm="Colmeia Swagger"
```

O `401` e correto: significa que o Swagger esta no ar e protegido por senha.

## Alertas de teste

Use somente temporariamente:

```env
ENABLE_TEST_ALERTS=true
TEST_ALERT_TOKEN=um_token_forte
```

Depois dos testes:

```env
ENABLE_TEST_ALERTS=false
```

Mais detalhes:

- [Testes de notificacoes e alertas](testes-notificacoes.md)

## Banco

O Postgres fica exposto apenas em `127.0.0.1:5432` na VPS. Acesso externo deve
ser feito por tunel SSH ou dentro dos containers.

## Backups

Script:

```txt
deploy/backup.sh
```

Recomendacao: manter cron na VPS apontando para esse script e revisar logs de
backup periodicamente.

## Checklist antes de deploy

Na maquina local:

```bash
npm run quality
```

Na VPS, depois do deploy:

```bash
docker ps
curl -I https://colmeiaapp.duckdns.org/health
```

Conferir:

- API subiu;
- banco esta healthy;
- Caddy esta rodando;
- Swagger protegido, se estiver habilitado;
- `ENABLE_TEST_ALERTS=false` fora de janelas de teste.
