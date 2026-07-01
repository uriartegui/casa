# Colmeia - Casa Compartilhada

App para organizar uma casa compartilhada: estoques, listas de compras,
tarefas, membros, alertas e notificacoes.

Este repositorio e um monorepo com app mobile, API, deploy, documentacao e
assets de publicacao.

## Stack

- Front: React Native com Expo e TypeScript.
- Back: NestJS com TypeScript, PostgreSQL e TypeORM.
- Infra: Docker Compose, Caddy, VPS Ubuntu e GitHub Actions.
- Qualidade: ESLint, TypeScript e Vitest.

## Comece por aqui

Para uma pessoa nova no projeto, a ordem recomendada de leitura e:

1. [Documentacao geral](docs/README.md)
2. [Arquitetura](docs/arquitetura.md)
3. [Guia de contribuicao](CONTRIBUTING.md)
4. [Backend](docs/backend.md)
5. [Mobile](docs/mobile.md)
6. [Deploy e VPS](docs/deploy.md)
7. [API e Swagger](docs/api.md)
8. [Seguranca](docs/seguranca.md)

## Estrutura

```txt
casa/
  backend/       API NestJS, PostgreSQL, TypeORM, JWT, push e WebSocket
  mobile/        App Expo React Native publicado nas lojas
  deploy/        Docker Compose, Caddy, backup e variaveis da VPS
  docs/          Documentacao tecnica, produto, operacao e historico
  branding/      Logo, marca e identidade visual
  store-assets/  Capturas, textos e materiais das lojas
```

## Comandos principais

Instalar dependencias de cada app:

```bash
cd backend && npm install
cd ../mobile && npm install
```

Rodar backend:

```bash
npm run backend:start
```

Rodar mobile:

```bash
npm run mobile:start
```

Validar tudo antes de PR/deploy:

```bash
npm run quality
```

## Ambientes

- Mobile producao: usa `https://colmeiaapp.duckdns.org`.
- Backend producao: roda na VPS via Docker Compose em `deploy/`.
- Swagger protegido: disponivel em `/docs` quando `ENABLE_SWAGGER=true`.

Arquivos `.env` reais nunca devem ser commitados. Use os exemplos:

- [backend/.env.example](backend/.env.example)
- [mobile/.env.example](mobile/.env.example)
- [deploy/.env.example](deploy/.env.example)

## Versao atual

Mobile publicado como `1.0.1`.
