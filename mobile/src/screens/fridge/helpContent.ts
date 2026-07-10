export const STOCK_HELP_HIGHLIGHTS = [
  { icon: 'box' as const, title: 'Itens', body: 'Quantidades, unidades e quem cadastrou.' },
  { icon: 'alert-triangle' as const, title: 'Validade', body: 'Destaques para vencidos e próximos.' },
  { icon: 'tag' as const, title: 'Categorias', body: 'Filtros para achar tudo mais rápido.' },
];

export const STOCK_HELP_SECTIONS = [
  {
    title: 'Adicionar item',
    body: 'Use o botão de adicionar para registrar produto, quantidade, unidade, validade e categoria.',
  },
  {
    title: 'Filtrar categorias',
    body: 'Toque em uma categoria no topo para ver só aquele grupo de itens. Use "Todos" para voltar.',
  },
  {
    title: 'Itens vencidos',
    body: 'Quando houver validade vencida ou próxima, o app mostra alertas no card do item para você agir antes de perder.',
  },
  {
    title: 'Categorizar itens',
    body: 'Quando itens entram sem categoria, o aviso "Categorizar itens" ajuda a organizar tudo em lote.',
  },
  {
    title: 'Item acabou',
    body: 'Toque em Acabou para remover do estoque ou mandar direto para uma lista de compras.',
  },
  {
    title: 'Atualizar dados',
    body: 'Puxe a lista para baixo quando quiser buscar as informações mais recentes da casa.',
  },
];
