# Mobile

App Expo React Native do Colmeia.

## Responsabilidades

- Login, cadastro e sessao do usuario.
- Home com resumo da casa e alertas gerais.
- Estoques por compartimento.
- Listas de compras.
- Tarefas da casa.
- Central de alertas contextual.
- Push notifications.

## Estrutura atual

```txt
mobile/src/
  components/
  constants/
  context/
  hooks/
  navigation/
  screens/
  services/
  types/
  utils/
```

## Rodar local

```bash
cd mobile
npm install
npm run start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

## API usada pelo app

Arquivo principal:

```txt
mobile/src/config.ts
```

Padrao atual:

```txt
https://colmeiaapp.duckdns.org
```

Override local:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Qualidade

```bash
cd mobile
npm run quality
```

Esse comando roda typecheck, lint e testes configurados no app.

## Padrao visual e navegacao

Ordem padrao do cabecalho, da direita para esquerda:

```txt
Menu, Ajuda, Buscar, Alertas
```

Visualmente, da esquerda para direita no grupo de acoes:

```txt
Alertas, Buscar, Ajuda, Menu
```

Paginas sem alerta nao exibem o sino.

## Direcao de refatoracao

Para telas grandes, prefira quebrar por responsabilidade:

```txt
screens/home/
  HomeScreen.tsx
  components/
  hooks/
  types.ts
```

Quando uma area crescer muito, mova para `features/` em uma refatoracao
separada:

```txt
features/
  home/
  stocks/
  shopping/
  tasks/
  alerts/
```

Evite misturar redesign, refatoracao e mudanca de regra de negocio no mesmo PR.

## Builds

Android:

- gerar build via EAS;
- enviar `.aab` para Google Play Console;
- revisar em `Publishing overview`;
- enviar para analise.

iOS:

```bash
npx eas submit --platform ios --path "CAMINHO_DO_IPA"
```

Depois aguarde processamento no App Store Connect, selecione o build e envie
para revisao.
