# Guia de contribuicao

Este documento define o jeito padrao de trabalhar no Colmeia. A ideia e deixar
o projeto previsivel para quem entra agora e para quem vai manter depois.

## Fluxo de trabalho

1. Atualize sua branch a partir da `main`.
2. Crie uma branch curta e descritiva.
3. Faca mudancas pequenas e revisaveis.
4. Rode qualidade local antes de abrir PR.
5. Explique no PR o que mudou, como testou e riscos conhecidos.

## Branches

Padrao sugerido:

```txt
feature/nome-curto
fix/nome-curto
docs/nome-curto
refactor/nome-curto
chore/nome-curto
```

## Commits

Use mensagens simples no estilo Conventional Commits:

```txt
feat: add protected swagger setup
fix: remove sensitive push token log
docs: document deploy workflow
refactor: split app header from tabs
chore: update env examples
```

## Antes de abrir PR

Na raiz:

```bash
npm run quality
```

Esse comando roda:

- qualidade do mobile;
- build do backend;
- testes do backend.

Se alterar apenas documentacao, ainda revise links, exemplos de comando e nomes
de arquivos.

## Seguranca

Nunca commite:

- `.env` real;
- senhas;
- JWT secrets;
- tokens de push;
- arquivos de credenciais de loja;
- builds `.aab`, `.apk` ou `.ipa`.

Use sempre os arquivos `.env.example` como contrato publico das variaveis.

## Padroes de codigo

- Prefira mudancas pequenas e focadas.
- Nao mova arquivos grandes junto com mudanca de comportamento.
- Nao misture refatoracao estrutural com bug fix urgente.
- Preserve os nomes de dominios do produto: estoques, listas, tarefas, casas,
  membros, alertas e notificacoes.
- Quando uma tela crescer demais, extraia componentes, hooks e tipos por
  responsabilidade.

## Documentacao obrigatoria

Atualize a documentacao quando mudar:

- endpoint ou payload da API;
- variavel de ambiente;
- fluxo de deploy;
- processo de release;
- regra de negocio visivel para usuario.

## PR ideal

Um PR bom responde:

- O que mudou?
- Por que mudou?
- Como foi testado?
- Existe algum risco ou passo manual?
