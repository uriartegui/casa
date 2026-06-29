# Testes de notificacoes e alertas

Este documento descreve como gerar alertas reais para testar o app publicado em producao.

## Objetivo

Validar no app de producao:

- badge do sino;
- central de alertas da Home;
- alertas contextuais de estoques, listas e tarefas;
- atividades novas vindas da API;
- push notification, quando solicitado.

O teste nao usa mock no app. Ele cria eventos reais no backend para a casa informada.

## Endpoint

```http
POST /households/:id/test-alerts
```

Requisitos:

- usuario autenticado com JWT;
- usuario precisa ser membro da casa;
- backend precisa estar com testes habilitados por variavel de ambiente;
- chamada precisa enviar o token secreto no header.

## Variaveis de ambiente

No backend:

```env
ENABLE_TEST_ALERTS=true
TEST_ALERT_TOKEN=coloque-um-token-secreto-aqui
```

Por seguranca, deixar desligado quando terminar:

```env
ENABLE_TEST_ALERTS=false
TEST_ALERT_TOKEN=
```

## Exemplo de chamada

```bash
curl -X POST "https://colmeiaapp.duckdns.org/households/ID_DA_CASA/test-alerts" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "x-test-alert-token: TOKEN_SECRETO" \
  -H "Content-Type: application/json" \
  -d '{"kinds":["stock","shopping","task"],"sendPush":true}'
```

## Opcoes do body

```json
{
  "kinds": ["stock", "shopping", "task", "push"],
  "sendPush": true
}
```

`kinds` e opcional. Se nao enviar, o backend gera:

- `stock`
- `shopping`
- `task`

Tipos disponiveis:

- `stock`: cria atividade real de estoque.
- `shopping`: cria atividade real de lista de compras.
- `task`: cria atividade real de tarefa.
- `push`: dispara push de teste.

`sendPush: true` tambem dispara push, mesmo sem incluir `push` em `kinds`.

## O que verificar no app

Depois de chamar o endpoint:

1. Abrir o app de producao.
2. Conferir se o sino mostra badge.
3. Abrir o sino na Home e verificar os alertas gerais.
4. Abrir uma tela de estoque e verificar alertas contextuais.
5. Abrir Listas de compras e verificar alertas de listas.
6. Abrir Tarefas da casa/categoria e verificar alertas de tarefas.
7. Se `sendPush` estiver ativo, verificar recebimento da notificacao push no dispositivo.

## Cuidados

- Usar apenas temporariamente em producao.
- Desativar `ENABLE_TEST_ALERTS` logo apos o teste.
- Nao commitar valores reais de `TEST_ALERT_TOKEN`.
- O endpoint cria eventos reais de atividade, entao eles podem aparecer no historico do app.

## Validacao tecnica

Ao implementar/alterar este fluxo, rodar:

```bash
cd backend
npm run build
npm test -- --runInBand
```

```bash
cd mobile
npm run quality
```
