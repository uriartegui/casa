# Assets das lojas — Colmeia

Gerador: `powershell -ExecutionPolicy Bypass -File store-assets\generate.ps1`
Textos, legendas e cores ficam em [config.json](config.json) — edite e rode de novo.

## Como gerar os screenshots de marketing

Dois caminhos (podem ser combinados; `ai-final\` tem prioridade):

**A) Arte pronta do ChatGPT** — gere a imagem de marketing completa no ChatGPT (fundo + moldura de celular + título) e salve em `store-assets\ai-final\` como `01-home.png` … `06-household.png` (+ `feature-graphic.png`). As mesmas artes servem para App Store e Google Play.

**B) Captura crua + moldura automática** — salve a captura de tela pura do app em `store-assets\raw\` com os mesmos nomes; o gerador monta fundo, moldura e legenda (textos em `config.json`).

Telas: `01-home` (inicial), `02-fridge` (geladeira com itens), `03-expiry` (item com validade), `04-shopping` (lista de compras), `05-send-to-fridge` (mandar pra geladeira), `06-household` (casa/membros).

Rode o gerador. Saída:
   - `play\screenshots\` — 1080×1920 (Google Play)
   - `appstore\iphone-6.9\` — 1320×2868 (App Store)

## Checklist Google Play (Play Console)

| Item | Status |
|---|---|
| Ícone 512×512 | ✅ `play\icon-512.png` |
| Feature graphic 1024×500 | ✅ `play\feature-graphic-1024x500.png` |
| Screenshots celular (mín. 2, máx. 8) | ✅ `play\screenshots\` |
| Título / descrições | ✅ ver [store-listing.md](store-listing.md) |
| URL da política de privacidade | ✅ https://uriartegui.github.io/casa/privacy-policy.html |
| Formulário Data Safety (dados coletados) | declarar: e-mail, nome, conteúdo do usuário, identificadores (push token) |
| Classificação de conteúdo (questionário) | preencher |
| Categoria | Casa e decoração ou Produtividade |
| E-mail de contato | preencher |
| Conta de teste para revisão | criar usuário demo (app exige login) |

## Checklist App Store (App Store Connect)

| Item | Status |
|---|---|
| Ícone 1024×1024 | ✅ vai no build (`mobile/assets/icon.png`) |
| Screenshots iPhone 6.9" (1320×2868, mín. 1, máx. 10) | ✅ `appstore\iphone-6.9\` |
| Screenshots iPad | ✅ não exigidos (`supportsTablet: false`) |
| Nome / subtítulo / descrição / keywords | ✅ ver [store-listing.md](store-listing.md) |
| URL da política de privacidade | ✅ https://uriartegui.github.io/casa/privacy-policy.html |
| URL de suporte | obrigatória |
| App Privacy (nutrition labels) | declarar mesmos dados do Data Safety |
| Classificação etária | questionário (provavelmente 4+) |
| Conta demo para revisão da Apple | obrigatória (app exige login) |
| Preço/disponibilidade | definir |

## Observações

- **Política de privacidade**: as duas lojas exigem URL pública. Uma página estática (GitHub Pages, Vercel) com o mesmo texto que já está no app resolve.
- As capturas cruas podem vir de qualquer iPhone/Android — o gerador redimensiona para os tamanhos exatos exigidos.
- **iPad desligado** (`supportsTablet: false` no app.json) — não precisa de screenshots de iPad, mas exige novo build iOS antes de submeter.
- Nas artes do ChatGPT, confira sempre: a UI da captura não foi redesenhada e a ortografia dos títulos está exata.
- Para mudar legenda/título de qualquer screenshot, edite `captions` em `config.json` e rode de novo.
