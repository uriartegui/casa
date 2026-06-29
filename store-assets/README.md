# Assets das lojas - Colmeia

Esta pasta guarda materiais usados no Google Play e na App Store: screenshots,
feature graphics, icones e textos de listagem.

## Gerar assets

Execute na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File store-assets\generate.ps1
```

Textos, legendas e cores ficam em:

```txt
store-assets/config.json
```

## Fontes e saidas

```txt
ai-final/              Artes finais feitas manualmente ou por IA
play/                  Saidas para Google Play
appstore/              Saidas para App Store
config.json            Configuracao do gerador
store-listing.md       Textos de loja
generate.ps1           Gerador dos assets
```

Regra atual:

- `ai-final/` tem prioridade quando existir.
- `play/` e `appstore/` sao saidas finais usadas nas lojas.
- Se a politica mudar no futuro, podemos ignorar saidas geradas e manter apenas
  fontes editaveis.

## Telas esperadas

```txt
01-home
02-fridge
03-expiry
04-shopping
05-send-to-fridge
06-household
```

## Google Play

Checklist:

- icone 512 x 512: `play/icon-512.png`;
- feature graphic 1024 x 500: `play/feature-graphic-1024x500.png`;
- screenshots: `play/screenshots/`;
- textos: `store-listing.md`;
- URL de privacidade publica;
- formulario Data Safety;
- classificacao de conteudo;
- categoria;
- e-mail de contato;
- conta demo para revisao.

## App Store

Checklist:

- icone no build: `mobile/assets/icon.png`;
- screenshots iPhone: `appstore/iphone-6.9/`;
- nome, subtitulo, descricao e keywords em `store-listing.md`;
- URL de privacidade publica;
- URL de suporte;
- App Privacy;
- classificacao etaria;
- conta demo para revisao;
- preco e disponibilidade.

## Observacoes

- O app esta com `supportsTablet: false`, entao screenshots de iPad nao sao
  obrigatorios.
- As capturas podem vir de Android ou iPhone; o gerador ajusta os tamanhos.
- Ao gerar artes com IA, conferir se a interface, os textos e a ortografia
  continuam fieis ao app real.
- Para mudar legenda ou titulo de screenshot, edite `captions` em
  `config.json` e rode o gerador de novo.
