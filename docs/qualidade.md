# Qualidade

Este documento lista o minimo para manter o projeto confiavel antes de releases
e pull requests.

## Comando principal

Na raiz:

```bash
npm run quality
```

Esse comando roda:

- `mobile:quality`
- `backend:build`
- `backend:test`

## Mobile

```bash
cd mobile
npm run quality
```

Use principalmente antes de mexer em:

- navegacao;
- telas grandes;
- hooks compartilhados;
- contexto de autenticacao;
- servicos de API;
- alertas e push.

## Backend

```bash
cd backend
npm run build
npm test -- --runInBand
```

Use principalmente antes de mexer em:

- auth;
- DTOs;
- controllers;
- services;
- migrations;
- notificacoes;
- endpoints administrativos.

## Checklist manual

Para mudancas no app:

- abrir Home;
- abrir estoque;
- abrir listas;
- abrir tarefas;
- testar busca quando aplicavel;
- testar ajuda e alertas nas telas afetadas.

Para mudancas no backend:

- testar `/health`;
- testar endpoint alterado pelo Swagger ou app;
- conferir logs do container;
- garantir que variaveis novas estao em `.env.example`.

## O que evitar

- Commitar build gerado.
- Commitar credenciais.
- Enviar PR com refatoracao grande e mudanca visual misturadas.
- Deixar logs sensiveis.
- Ativar ferramenta administrativa em producao sem senha.
