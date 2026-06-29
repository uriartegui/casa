# Seguranca

Cuidados basicos para manter o Colmeia seguro.

## Nunca commitar

- `.env` real;
- JWT secrets;
- senhas do banco;
- token de teste de alertas;
- token Better Stack;
- credenciais de loja;
- certificados e chaves privadas;
- builds `.aab`, `.apk` e `.ipa`.

## Arquivos sensiveis conhecidos

Estes arquivos podem existir localmente, mas nao devem entrar em novos commits:

```txt
mobile/credentials.json
mobile/google-services.json
deploy/.env
backend/.env
mobile/.env
```

Se algum deles ja estiver rastreado no Git por historico antigo, trate a
remocao em um PR separado para evitar quebrar builds ou deploys.

No caso especifico de `mobile/google-services.json`, o `mobile/app.json` ainda
aponta para esse arquivo no build Android. Antes de remover do Git, confirme o
fluxo EAS/Firebase e restrinja a API key no Google Cloud/Firebase por pacote,
SHA e APIs permitidas.

Guia do projeto:

- [Firebase Android](firebase-android.md)

## Swagger

Em producao, Swagger deve ficar:

- desligado por padrao; ou
- habilitado apenas com `SWAGGER_USER` e `SWAGGER_PASSWORD`.

Nunca deixe `/docs` aberto sem senha.

## Alertas de teste

O endpoint de teste de alertas cria atividades reais e pode enviar push. Use
somente durante janela de teste:

```env
ENABLE_TEST_ALERTS=true
TEST_ALERT_TOKEN=um_token_forte
```

Depois:

```env
ENABLE_TEST_ALERTS=false
```

## Logs

Nao registrar:

- access token;
- refresh token;
- push token;
- senhas;
- payloads sensiveis de usuario.
