# Backend Colmeia

API NestJS do app Colmeia.

## Stack

- NestJS
- TypeORM
- PostgreSQL
- JWT + refresh token
- Expo Push API
- WebSocket
- Sentry/observabilidade

## Rodar local

```bash
npm install
npm run start:dev
```

## Build

```bash
npm run build
```

## Testes

```bash
npm test -- --runInBand
```

## Migracoes

Rodar migracoes:

```bash
npm run migration:run
```

Gerar migracao:

```bash
npm run migration:generate -- src/migrations/NomeDaMigracao
```

## Variaveis

Use `.env.example` como base.

Principais:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT`
- `SENTRY_DSN`

Swagger protegido:

- `ENABLE_SWAGGER`
- `SWAGGER_USER`
- `SWAGGER_PASSWORD`

Alertas de teste em producao controlada:

- `ENABLE_TEST_ALERTS`
- `TEST_ALERT_TOKEN`

## API

Ver documentacao completa:

- [API e endpoints](../docs/api.md)
- [Desenvolvimento, testes e deploy](../docs/desenvolvimento.md)
- [Testes de notificacoes e alertas](../docs/testes-notificacoes.md)

## Swagger protegido

Disponivel em:

```txt
/docs
```

Em producao, fica desligado por padrao. Para usar na VPS:

```env
ENABLE_SWAGGER=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=uma_senha_forte
```

Sem `SWAGGER_USER` e `SWAGGER_PASSWORD`, o backend nao habilita Swagger em
producao.
