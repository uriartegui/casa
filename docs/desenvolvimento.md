# Desenvolvimento

Guia rapido para rodar e manter o Colmeia localmente. Para detalhes por area,
use:

- [Backend](backend.md)
- [Mobile](mobile.md)
- [Deploy e VPS](deploy.md)
- [Qualidade](qualidade.md)

## Estrutura

```txt
.
|-- backend/       API NestJS, TypeORM, PostgreSQL, push e WebSocket
|-- mobile/        App Expo React Native
|-- docs/          Documentacao do projeto
|-- deploy/        Docker, Caddy, backup e configuracao da VPS
|-- branding/      Assets de marca
`-- store-assets/  Assets de loja
```

## Primeira instalacao

Backend:

```bash
cd backend
npm install
```

Mobile:

```bash
cd mobile
npm install
```

Banco local com Docker:

```bash
docker compose up -d
```

O Compose da raiz expoe o Postgres em `localhost:5433`; use esse valor em
`backend/.env` ao partir de `backend/.env.example`.

## Rodar

Backend:

```bash
npm run backend:start
```

Mobile:

```bash
npm run mobile:start
```

## Variaveis

Use os exemplos como contrato:

```txt
backend/.env.example
mobile/.env.example
deploy/.env.example
```

Nunca commite arquivos `.env` reais.

## API usada pelo mobile

Padrao:

```txt
https://colmeiaapp.duckdns.org
```

Override local:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Qualidade

Na raiz:

```bash
npm run quality
```

## Cabecalho padrao do app

Da direita para esquerda:

```txt
Menu, Ajuda, Buscar, Alertas
```

Visualmente, da esquerda para direita no bloco de acoes:

```txt
Alertas, Buscar, Ajuda, Menu
```

Paginas sem alerta nao exibem o sino.

## Antes de publicar

Conferir:

- versao mobile;
- notas de release;
- `npm run quality`;
- variaveis de producao;
- `ENABLE_TEST_ALERTS=false`;
- Swagger protegido, se estiver habilitado;
- nenhum token real commitado.
