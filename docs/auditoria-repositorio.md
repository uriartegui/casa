# Auditoria do repositorio

Data: 2026-06-29

Objetivo: identificar arquivos rastreados pelo Git que podem atrapalhar
seguranca, organizacao, tamanho do repositorio ou entrada de novas pessoas no
projeto.

Nenhum arquivo foi removido nesta auditoria.

## Resumo

- Arquivos rastreados: 265.
- Tamanho rastreado aproximado: 64,5 MB.
- `store-assets/`: 31 arquivos, cerca de 51,7 MB.
- Assets/imagens (`branding/`, `mobile/assets/`, `store-assets/`): cerca de
  62,4 MB.
- `.idea/`: 8 arquivos rastreados, cerca de 95 KB.

## Achados de seguranca

### `mobile/google-services.json`

Status: rastreado pelo Git.

Esse arquivo contem configuracao Firebase/Google Services do app Android,
incluindo uma API key. Em muitos apps mobile essa chave nao e tratada como
segredo absoluto, mas deve ser restringida no Google Cloud/Firebase por pacote,
SHA e APIs permitidas.

Recomendacao:

- Confirmar se o arquivo precisa mesmo ficar no repositorio para builds EAS.
- Hoje o `mobile/app.json` aponta para `./google-services.json`, entao a
  remocao precisa ser planejada junto com o fluxo de build Android.
- Ver guia especifico: [Firebase Android](firebase-android.md).
- Restringir a chave no Google Cloud/Firebase.
- Se possivel, mover para secret/config de build e remover do Git em um PR
  separado.
- Como o arquivo ja foi exposto no historico, avaliar rotacionar/regerar a
  chave se ela tiver permissoes amplas.

Prioridade: alta.

### `docker-compose.yml` da raiz

Status: rastreado pelo Git.

Contem credenciais locais simples:

```txt
POSTGRES_USER=casa
POSTGRES_PASSWORD=casa123
POSTGRES_DB=casa
```

Isso parece ser apenas compose local antigo, nao producao. Mesmo assim, para
padrao de empresa, e melhor evitar senha fixa em arquivo principal.

Recomendacao:

- Transformar em `docker-compose.local.yml` usando variaveis com default seguro;
  ou
- remover se nao for mais usado; ou
- documentar claramente que e somente banco local descartavel.

Prioridade: media.

### Arquivos `.env`

Status: nenhum `.env` real foi encontrado como rastreado pelo Git.

Arquivos de exemplo rastreados:

```txt
backend/.env.example
deploy/.env.example
mobile/.env.example
```

Recomendacao:

- Manter exemplos.
- Nunca commitar `.env` real.

Prioridade: ok.

## Arquivos de IDE

### `.idea/`

Status: rastreado pelo Git.

Arquivos:

```txt
.idea/.gitignore
.idea/caches/deviceStreaming.xml
.idea/casa.iml
.idea/deviceManager.xml
.idea/markdown.xml
.idea/misc.xml
.idea/modules.xml
.idea/vcs.xml
```

Recomendacao:

- Remover `.idea/` do Git em um PR separado.
- Manter `.idea/` no `.gitignore`.
- Cada dev deve usar sua propria configuracao local.

Prioridade: media.

## Tamanho do repositorio

### `store-assets/`

Status: rastreado pelo Git.

Ocupa cerca de 51,7 MB. Isso e esperado porque contem screenshots e artes de
loja, mas pesa para clone, diff e revisao.

Recomendacao:

- Manter se o objetivo for versionar os assets publicados nas lojas.
- Separar `raw/`, `ai-final/` e saidas geradas no futuro:
  - fonte editavel: pode ficar no Git;
  - saida gerada: avaliar ignorar e regenerar;
  - versao final publicada: pode ficar no Git ou em release artifact.

Prioridade: baixa/media.

### Maiores arquivos rastreados

Os maiores arquivos sao screenshots de App Store/Google Play, entre cerca de
1,8 MB e 2,8 MB cada.

Recomendacao:

- Nao mexer agora.
- Decidir depois uma politica de assets: versionar tudo, versionar apenas
  finais, ou mover gerados para release/artifact.

Prioridade: baixa.

## Duplicidades encontradas

### Icones iguais

Arquivos com o mesmo hash:

```txt
branding/icon-transparent.png
mobile/assets/icon.png
mobile/assets/adaptive-icon.png
```

Recomendacao:

- Pode manter duplicado porque Expo espera assets dentro de `mobile/assets/`.
- Documentar `branding/` como fonte visual e `mobile/assets/` como copia usada
  pelo app.
- Se quiser automatizar depois, criar script para sincronizar assets.

Prioridade: baixa.

### Splash igual

Arquivos com o mesmo hash:

```txt
branding/splash-wordmark.png
mobile/assets/splash-icon.png
```

Recomendacao:

- Mesma recomendacao dos icones.

Prioridade: baixa.

### `docker-compose.yml`

Arquivos:

```txt
docker-compose.yml
deploy/docker-compose.yml
```

Recomendacao:

- Definir explicitamente:
  - raiz: banco local/dev, se ainda for usado;
  - `deploy/`: producao/VPS.
- Se o compose da raiz nao for usado, remover em PR separado.

Prioridade: media.

### `app.json`

Arquivos:

```txt
app.json
mobile/app.json
```

O `app.json` da raiz contem apenas `extra.eas.projectId`; o app real usa
`mobile/app.json`.

Recomendacao:

- Confirmar se o arquivo da raiz ainda e usado por EAS ou algum fluxo antigo.
- Se nao for usado, remover para reduzir confusao.

Prioridade: media.

## Documentacao antiga ou historica

### `docs/superpowers/`

Status: rastreado pelo Git.

Contem planos e specs historicas. Pode ser util para contexto, mas nao deve ser
tratado como documentacao atual.

Recomendacao:

- Manter por enquanto.
- Opcional: mover para `docs/historico/` em uma reorganizacao futura.

Prioridade: baixa.

### `store-assets/README.md`

Status: rastreado pelo Git.

Tem sinais de encoding quebrado em textos com acento.

Recomendacao:

- Reescrever em ASCII ou UTF-8 correto.
- Manter junto de `store-assets/`, porque e o guia certo para gerar materiais
  de loja.

Prioridade: baixa/media.

## Lista recomendada de PRs pequenos

### PR 1: seguranca e ruido de IDE

- Remover `.idea/` do Git.
- Confirmar/remover `mobile/google-services.json` do Git ou documentar por que
  fica.
- Garantir restricao da API key no Google Cloud/Firebase.

### PR 2: compose local

- Renomear ou remover `docker-compose.yml` da raiz.
- Se mantido, trocar senha fixa por variaveis com defaults locais claros.
- Documentar no README quando usar raiz vs `deploy/docker-compose.yml`.

### PR 3: assets e loja

- Corrigir encoding de `store-assets/README.md`.
- Documentar quais assets sao fonte e quais sao saida gerada.
- Avaliar se `store-assets/ai-final/` e `store-assets/play/` devem continuar
  versionados.

### PR 4: app config

- Confirmar uso de `app.json` da raiz.
- Remover se for legado.

## Recomendacao geral

Nao fazer uma limpeza gigante em um unico commit. A melhor ordem e:

1. remover ruido seguro (`.idea/`);
2. resolver credenciais/config sensivel;
3. limpar compose/app config legado;
4. organizar assets e documentacao historica.
