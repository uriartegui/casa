// Categorias na ordem típica dos corredores de mercado — usada também
// para ordenar as seções da lista de compras.
export const SHOPPING_CATEGORIES = [
  'Hortifrúti',
  'Carnes',
  'Laticínios',
  'Padaria',
  'Mercearia',
  'Bebidas',
  'Congelados',
  'Limpeza',
  'Higiene',
  'Outros',
] as const;

export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

const ITEMS_BY_CATEGORY: Record<ShoppingCategory, string[]> = {
  'Laticínios': [
    'Leite', 'Leite integral', 'Leite desnatado', 'Iogurte', 'Queijo', 'Queijo mussarela',
    'Queijo prato', 'Requeijão', 'Manteiga', 'Margarina', 'Creme de leite', 'Nata',
  ],
  'Carnes': [
    'Frango', 'Peito de frango', 'Coxa de frango', 'Carne moída', 'Carne bovina',
    'Picanha', 'Alcatra', 'Patinho', 'Linguiça', 'Salsicha', 'Bacon', 'Presunto',
    'Peixe', 'Salmão', 'Tilápia', 'Atum', 'Camarão',
  ],
  'Hortifrúti': [
    'Alface', 'Tomate', 'Cebola', 'Alho', 'Batata', 'Batata-doce', 'Cenoura',
    'Brócolis', 'Couve', 'Espinafre', 'Pepino', 'Abobrinha', 'Berinjela',
    'Pimentão', 'Milho', 'Ervilha', 'Beterraba', 'Chuchu', 'Mandioca',
    'Banana', 'Maçã', 'Laranja', 'Limão', 'Mamão', 'Melão', 'Melancia',
    'Uva', 'Morango', 'Abacaxi', 'Manga', 'Abacate',
  ],
  'Padaria': [
    'Pão de forma', 'Pão francês', 'Bolo', 'Torrada',
  ],
  'Mercearia': [
    'Arroz', 'Feijão', 'Feijão preto', 'Macarrão', 'Farinha de trigo', 'Fubá',
    'Aveia', 'Granola', 'Tapioca',
    'Ovos', 'Azeite', 'Óleo', 'Vinagre', 'Molho de tomate', 'Extrato de tomate',
    'Sal', 'Açúcar', 'Mel', 'Café', 'Achocolatado',
  ],
  'Bebidas': [
    'Água', 'Suco de laranja', 'Suco de uva', 'Refrigerante', 'Cerveja',
  ],
  'Congelados': [
    'Pizza congelada', 'Lasanha', 'Nuggets', 'Hambúrguer',
  ],
  'Limpeza': [
    'Detergente', 'Sabão em pó', 'Amaciante', 'Desinfetante', 'Esponja',
  ],
  'Higiene': [
    'Papel higiênico', 'Sabonete', 'Shampoo', 'Condicionador', 'Pasta de dente',
  ],
  'Outros': [],
};

export const COMMON_ITEMS = Object.values(ITEMS_BY_CATEGORY).flat();

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const CATEGORY_BY_ITEM = new Map<string, ShoppingCategory>(
  (Object.entries(ITEMS_BY_CATEGORY) as [ShoppingCategory, string[]][])
    .flatMap(([category, items]) => items.map((item) => [normalize(item), category] as const)),
);

/** Sugere a categoria de mercado para um nome de item, se for um item conhecido. */
export function categoryFor(name: string): ShoppingCategory | null {
  return CATEGORY_BY_ITEM.get(normalize(name)) ?? null;
}

export function filterItems(query: string, max = 6): string[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  return COMMON_ITEMS.filter((item) => normalize(item).includes(q)).slice(0, max);
}
