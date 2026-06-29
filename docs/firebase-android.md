# Firebase Android

Este documento explica o uso do `mobile/google-services.json` no app Android do
Colmeia.

## Situacao atual

O arquivo esta em:

```txt
mobile/google-services.json
```

E e referenciado por:

```txt
mobile/app.json
```

Campo:

```json
"googleServicesFile": "./google-services.json"
```

Isso significa que o build Android/EAS espera encontrar esse arquivo dentro de
`mobile/`.

## O que existe nesse arquivo

O `google-services.json` contem configuracoes do projeto Firebase/Google
Services, como:

- project number;
- project id;
- package Android;
- mobilesdk app id;
- API key.

No app atual:

```txt
package Android: com.guiuriarte.colmeia
```

A API key de app mobile geralmente nao e segredo absoluto como uma senha de
banco, mas precisa estar restrita. Se ficar sem restricao, pode ser usada fora
do app.

## Politica do projeto

Por enquanto, o arquivo permanece no repositorio porque o build Android depende
dele.

Antes de remover do Git, precisamos trocar o fluxo para uma das opcoes:

- gerar o arquivo no build usando secret do EAS;
- baixar/injetar o arquivo em CI;
- manter um arquivo local nao rastreado e documentar setup de dev/build.

Nao remover sem validar um build Android.

## Checklist de seguranca

No Google Cloud/Firebase:

1. Abrir o projeto Firebase usado pelo app.
2. Encontrar a API key Android usada pelo app.
3. Restringir a chave para Android apps.
4. Informar o package name:

```txt
com.guiuriarte.colmeia
```

5. Informar SHA-1/SHA-256 dos certificados usados no build.
6. Restringir APIs permitidas somente ao que o app realmente usa.
7. Salvar.
8. Gerar novo build Android de teste.
9. Testar login, notificacoes e qualquer fluxo que dependa de Google/Firebase.

## Quando rotacionar

Avaliar rotacionar/regerar a API key se:

- a chave estiver sem restricao;
- a chave permitir APIs alem do necessario;
- houver suspeita de abuso;
- o arquivo ficou publico antes das restricoes.

## Futuro ideal

Fluxo recomendado para uma equipe maior:

```txt
mobile/google-services.json.example   modelo sem chaves reais
EAS/CI secret                         conteudo real
build Android                         gera/injeta google-services.json
```

Assim o repositorio fica limpo e o build continua reproduzivel.
