# Arquitetura

O Colmeia e organizado como monorepo. O repositorio guarda o app mobile, a API,
os arquivos de deploy, a documentacao e os materiais de publicacao.

## Visao macro

```txt
Mobile Expo React Native
  |
  | HTTPS + JWT
  v
API NestJS na VPS
  |
  | TypeORM
  v
PostgreSQL

API NestJS
  |
  | WebSocket
  v
Atualizacoes em tempo real no app

API NestJS
  |
  | Expo Push API
  v
Push notifications
```

## Pastas principais

```txt
backend/       API, banco, autenticacao, eventos, notificacoes e regras
mobile/        App Expo React Native
deploy/        Docker Compose, Caddy, backup e configuracao da VPS
docs/          Documentacao tecnica, produto e operacao
branding/      Identidade visual
store-assets/  Materiais usados em Google Play e App Store
```

## Backend

O backend esta em `backend/src` e hoje e dividido nos dominios:

```txt
auth/
events/
households/
migrations/
notifications/
users/
```

Direcao recomendada conforme o projeto crescer:

```txt
backend/src/
  auth/
  users/
  households/
  fridge/
  shopping/
  tasks/
  notifications/
  events/
  common/
  database/
```

Essa divisao deve ser feita aos poucos, quando houver mudanca real no dominio.
Evite mover arquivos grandes sem necessidade, porque isso dificulta revisao.

## Mobile

O mobile esta em `mobile/src` e hoje usa:

```txt
components/
constants/
context/
hooks/
navigation/
screens/
services/
types/
utils/
```

Direcao recomendada para telas grandes:

```txt
mobile/src/
  components/
  navigation/
  services/
  hooks/
  utils/
  theme/
  types/
  features/
    home/
    stocks/
    shopping/
    tasks/
    alerts/
    households/
```

Na pratica, primeiro extraia componentes pequenos dentro das telas atuais.
Depois, quando o dominio estiver estavel, mova para `features/`.

## Regras de integracao

- O mobile chama a API por HTTPS usando JWT.
- Refresh token fica no fluxo de autenticacao.
- WebSocket e usado para avisar mudancas da casa.
- Push notifications sao eventos importantes, nao substituem a central de
  alertas dentro do app.
- Swagger e ferramenta administrativa e deve ficar protegido.

## Decisoes importantes

- Monorepo para manter mobile, backend e deploy juntos.
- Docker Compose na VPS para API, Postgres e Caddy.
- Swagger em producao somente com senha.
- Alertas divididos em geral da Home e contextuais por categoria/tela.
