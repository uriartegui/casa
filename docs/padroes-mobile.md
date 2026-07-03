# Padrões Mobile

Este documento registra decisões recentes de UI, navegação e performance do app.
Use como referência antes de criar ou alterar telas.

## Cabeçalho

Ordem visual padrão no lado direito:

```txt
Alertas, Buscar, Ajuda, Menu
```

Na leitura da direita para a esquerda:

```txt
Menu, Ajuda, Buscar, Alertas
```

Telas sem alertas não exibem o sino. O botão de ajuda deve abrir o mesmo modelo
de sheet da Home, trocando apenas o conteúdo.

## Alertas e Busca

Ao tocar em um alerta ou resultado de busca, o app deve:

1. fechar o painel/modal imediatamente;
2. navegar para a tela correta;
3. aplicar filtro ou estoque/lista/categoria quando necessário;
4. rolar até o card;
5. destacar o card temporariamente.

A busca global deve ser simples, no estilo command palette: campo, filtros e
resultados reais. Não incluir ações rápidas dentro da busca.

## Formulários e Sheets

Formulários devem seguir o visual leve atual:

- labels sem caixa alta pesada;
- inputs com `borderRadius` por volta de `16`;
- botões principais com `borderRadius` por volta de `16`;
- bottom sheets com fundo menos escuro e cantos superiores grandes;
- controles segmentados para opções curtas, como unidade.

Evite redesign visual junto com mudança de regra de negócio no mesmo PR.

## Listas e Performance

Telas com muitos itens devem usar `FlatList` ou `SectionList`, não `ScrollView`.
Use virtualização nas listas principais:

- `initialNumToRender`;
- `maxToRenderPerBatch`;
- `windowSize`;
- `removeClippedSubviews` no Android.

Cards repetidos podem usar `React.memo` quando recebem props simples e callbacks
estáveis. Evite criar funções inline pesadas dentro de `renderItem`.

## Cache e Refetch

Para dados ao vivo, prefira:

- `staleTime` curto;
- invalidação após mutations;
- `refetchOnMount: true`, não `always`;
- `useRefreshOnFocus` quando a tela precisa atualizar ao voltar depois de um
intervalo.

Isso reduz chamadas duplicadas e evita piscadas de loading.
