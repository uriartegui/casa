# API Colmeia

Base local padrao:

```txt
http://localhost:3000
```

Base de producao atual:

```txt
https://colmeiaapp.duckdns.org
```

Autenticacao:

```http
Authorization: Bearer <accessToken>
```

A maioria dos endpoints exige JWT. As excecoes sao os endpoints de auth,
healthcheck e redirect de convite.

## Convencoes

- `GET`: consulta dados.
- `POST`: cria recursos ou executa acoes.
- `PATCH`: altera parcialmente recursos.
- `DELETE`: remove recursos ou encerra vinculos.
- `PUT`: nao ha endpoints `PUT` atualmente. O app usa `PATCH` para edicoes.

## Sistema

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/` | Nao | Resposta simples da API. |
| `GET` | `/health` | Nao | Healthcheck. |
| `GET` | `/invite/:code` | Nao | Redireciona convite para deep link do app. |

## Auth

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Nao | Cadastra usuario. |
| `POST` | `/auth/login` | Nao | Login por telefone e senha. |
| `POST` | `/auth/refresh` | Nao | Renova access token usando refresh token. |
| `POST` | `/auth/logout` | Sim | Revoga refresh token. |
| `POST` | `/auth/send-otp` | Nao | Envia codigo OTP por SMS. |
| `POST` | `/auth/verify-otp` | Nao | Valida codigo OTP. |
| `POST` | `/auth/forgot-password` | Nao | Solicita redefinicao de senha. |
| `POST` | `/auth/reset-password` | Nao | Redefine senha usando OTP. |

## Usuarios

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/users/me` | Sim | Dados do usuario logado. |
| `PATCH` | `/users/me` | Sim | Atualiza perfil. |
| `PATCH` | `/users/me/push-token` | Sim | Registra ou atualiza token Expo Push. |
| `DELETE` | `/users/me/push-token` | Sim | Remove token push do dispositivo/usuario. |
| `DELETE` | `/users/me` | Sim | Exclui conta. |

## Casas

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/households` | Sim | Lista casas do usuario. |
| `POST` | `/households` | Sim | Cria casa. |
| `DELETE` | `/households/:id` | Sim | Exclui casa, admin only. |
| `DELETE` | `/households/:id/members/me` | Sim | Sai da casa. |
| `DELETE` | `/households/:id/members/:memberId` | Sim | Remove membro, admin only. |
| `PATCH` | `/households/:id/members/:memberId/promote` | Sim | Promove membro a admin. |
| `GET` | `/households/:id/invite` | Sim | Gera codigo de convite. |
| `POST` | `/households/join/:code` | Sim | Entra em casa por convite. |
| `GET` | `/households/:id/attention` | Sim | Resumo de pontos de atencao. |
| `GET` | `/households/:id/search?q=` | Sim | Busca global da casa. |

## Estoques

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/households/:id/storages` | Sim | Lista compartimentos visiveis. |
| `GET` | `/households/:id/storages?includeHidden=true` | Sim | Lista compartimentos incluindo ocultos. |
| `POST` | `/households/:id/storages` | Sim | Cria compartimento. |
| `PATCH` | `/households/:id/storages/:storageId` | Sim | Renomeia/altera compartimento. |
| `DELETE` | `/households/:id/storages/:storageId` | Sim | Exclui ou oculta compartimento conforme regra do backend. |
| `GET` | `/households/:id/fridge` | Sim | Lista itens do estoque da casa. |
| `GET` | `/households/:id/fridge?storageId=:storageId` | Sim | Lista itens de um compartimento. |
| `GET` | `/households/:id/fridge/:itemId` | Sim | Detalhe de item do estoque. |
| `POST` | `/households/:id/fridge` | Sim | Adiciona item ao estoque. |
| `PATCH` | `/households/:id/fridge/:itemId` | Sim | Edita item do estoque. |
| `DELETE` | `/households/:id/fridge/:itemId` | Sim | Remove item do estoque. |
| `DELETE` | `/households/:id/fridge/:itemId?toList=:name` | Sim | Remove item e envia para lista. |
| `GET` | `/households/:id/fridge/categories` | Sim | Lista categorias usadas em itens. |
| `GET` | `/households/:id/fridge/categories?storageId=:storageId` | Sim | Lista categorias usadas por compartimento. |
| `GET` | `/households/:id/fridge-activity` | Sim | Historico de atividades do estoque. |

## Categorias de estoque

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/households/:id/storages/:storageId/categories` | Sim | Lista categorias configuradas do compartimento. |
| `POST` | `/households/:id/storages/:storageId/categories` | Sim | Cria categoria no compartimento. |
| `DELETE` | `/households/:id/categories/:categoryId` | Sim | Remove categoria. |

## Listas de compras

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/households/:id/shopping-lists` | Sim | Lista listas de compras. |
| `POST` | `/households/:id/shopping-lists` | Sim | Cria lista de compras. |
| `PATCH` | `/households/:id/shopping-lists/:listId` | Sim | Edita lista. |
| `DELETE` | `/households/:id/shopping-lists/:listId` | Sim | Exclui lista. |
| `GET` | `/households/:id/shopping-lists/:listId/items` | Sim | Lista itens de uma lista. |
| `POST` | `/households/:id/shopping-lists/:listId/items` | Sim | Adiciona item na lista. |
| `PATCH` | `/households/:id/shopping-lists/:listId/items/:itemId` | Sim | Edita ou marca item. |
| `DELETE` | `/households/:id/shopping-lists/:listId/items/checked` | Sim | Remove itens comprados. |
| `DELETE` | `/households/:id/shopping-lists/:listId/items/:itemId` | Sim | Remove item da lista. |
| `GET` | `/households/:id/shopping-activity` | Sim | Historico de compras. |
| `GET` | `/households/:id/replenishment-suggestions` | Sim | Sugestoes de reposicao. |

## Tarefas da casa

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `GET` | `/households/:id/tasks` | Sim | Lista tarefas. |
| `POST` | `/households/:id/tasks` | Sim | Cria tarefa. |
| `PATCH` | `/households/:id/tasks/:taskId` | Sim | Edita, conclui, reabre ou pula tarefa. |
| `DELETE` | `/households/:id/tasks/:taskId` | Sim | Exclui tarefa. |
| `GET` | `/households/:id/task-activity` | Sim | Historico de tarefas. |
| `GET` | `/households/:id/task-categories` | Sim | Lista categorias de tarefas. |
| `POST` | `/households/:id/task-categories` | Sim | Cria categoria de tarefa. |
| `DELETE` | `/households/:id/task-categories/:categoryId` | Sim | Remove categoria de tarefa. |

## Alertas de teste em producao controlada

| Metodo | Endpoint | Auth | Descricao |
| --- | --- | --- | --- |
| `POST` | `/households/:id/test-alerts` | Sim + token secreto | Gera atividades reais para testar alertas e push. |

Esse endpoint fica desativado por padrao. Ver:

- [Testes de notificacoes e alertas](testes-notificacoes.md)

## WebSocket

O mobile conecta em:

```txt
ws(s)://<API>/ws
```

Uso atual: avisar clientes sobre atualizacoes da casa para refetch/atualizacao de telas.

## Swagger protegido

O backend expoe Swagger em:

```txt
/docs
```

Em producao, ele fica desligado por padrao. Para habilitar na VPS:

```env
ENABLE_SWAGGER=true
SWAGGER_USER=admin
SWAGGER_PASSWORD=uma_senha_forte
```

Com isso, qualquer acesso ao `/docs` e ao `/docs-json` exige usuario e senha
via Basic Auth. Depois de abrir o Swagger, use o botão `Authorize` com:

```txt
Bearer <accessToken>
```

Assim a senha protege a documentacao, e o JWT continua protegendo os endpoints
do app.
