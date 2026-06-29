# Backend

API NestJS do Colmeia.

## Responsabilidades

- Autenticacao e refresh token.
- Casas, membros e convites.
- Estoques, categorias e validade de itens.
- Listas de compras e envio de comprados para estoque.
- Tarefas da casa.
- Atividades, alertas, WebSocket e push notifications.
- Swagger protegido para operacao e testes administrativos.

## Estrutura atual

```txt
backend/
  src/
    auth/
    events/
    households/
    migrations/
    notifications/
    users/
  test/
  Dockerfile
  package.json
```

## Rodar local

```bash
cd backend
npm install
npm run start:dev
```

Variaveis:

```txt
backend/.env.example
```

## Build e testes

```bash
cd backend
npm run build
npm test -- --runInBand
```

Pela raiz:

```bash
npm run backend:build
npm run backend:test
```

## Migracoes

Rodar migracoes:

```bash
cd backend
npm run migration:run
```

Gerar migracao:

```bash
cd backend
npm run migration:generate -- src/migrations/NomeDaMigracao
```

## Swagger

Localmente, Swagger fica disponivel por padrao em:

```txt
http://localhost:3000/docs
```

Em producao, habilite somente com senha:

```env
ENABLE_SWAGGER=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=uma_senha_forte
```

Depois use `Authorize` no Swagger com:

```txt
Bearer <accessToken>
```

## Cuidados

- Nao registre tokens sensiveis em logs.
- Nao deixe endpoints administrativos ligados sem variavel de controle.
- Nao commite `.env` real.
- Documente qualquer endpoint novo em [api.md](api.md).
