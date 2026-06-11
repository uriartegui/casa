// Itens conhecidos agrupados pelos rótulos das categorias padrão da casa
// (criadas no backend ao criar a household) — assim a categoria sugerida
// no bottom sheet bate com as opções que o usuário vê no picker.
const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  'Laticínios': [
    'Leite', 'Leite integral', 'Leite desnatado', 'Iogurte', 'Queijo', 'Queijo mussarela',
    'Queijo prato', 'Requeijão', 'Manteiga', 'Margarina', 'Creme de leite', 'Nata',
  ],
  'Carnes & Ovos': [
    'Frango', 'Peito de frango', 'Coxa de frango', 'Carne moída', 'Carne bovina',
    'Picanha', 'Alcatra', 'Patinho', 'Linguiça', 'Salsicha', 'Bacon', 'Presunto',
    'Peixe', 'Salmão', 'Tilápia', 'Atum', 'Camarão', 'Ovos',
  ],
  'Verduras/Legumes': [
    'Alface', 'Tomate', 'Cebola', 'Alho', 'Batata', 'Batata-doce', 'Cenoura',
    'Brócolis', 'Couve', 'Espinafre', 'Pepino', 'Abobrinha', 'Berinjela',
    'Pimentão', 'Milho', 'Ervilha', 'Beterraba', 'Chuchu', 'Mandioca',
  ],
  'Frutas': [
    'Banana', 'Maçã', 'Laranja', 'Limão', 'Mamão', 'Melão', 'Melancia',
    'Uva', 'Morango', 'Abacaxi', 'Manga', 'Abacate',
  ],
  'Grãos & Cereais': [
    'Arroz', 'Feijão', 'Feijão preto', 'Aveia', 'Granola',
  ],
  'Massas & Farinhas': [
    'Macarrão', 'Farinha de trigo', 'Fubá', 'Tapioca',
  ],
  'Molhos & Condimentos': [
    'Azeite', 'Óleo', 'Vinagre', 'Molho de tomate', 'Extrato de tomate',
  ],
  'Temperos': [
    'Sal',
  ],
  'Bebidas': [
    'Água', 'Suco de laranja', 'Suco de uva', 'Refrigerante', 'Cerveja',
  ],
  'Pratos prontos': [
    'Pizza congelada', 'Lasanha', 'Nuggets', 'Hambúrguer',
  ],
};

// Itens comuns sem categoria padrão correspondente (mercearia seca,
// padaria, limpeza e higiene) — entram nas sugestões sem pré-seleção.
const UNCATEGORIZED_ITEMS = [
  'Pão de forma', 'Pão francês', 'Açúcar', 'Mel', 'Café', 'Achocolatado',
  'Detergente', 'Sabão em pó', 'Amaciante', 'Desinfetante', 'Esponja',
  'Papel higiênico', 'Sabonete', 'Shampoo', 'Condicionador', 'Pasta de dente',
];

export const COMMON_ITEMS = [
  ...Object.values(ITEMS_BY_CATEGORY).flat(),
  ...UNCATEGORIZED_ITEMS,
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const CATEGORY_BY_ITEM = new Map<string, string>(
  Object.entries(ITEMS_BY_CATEGORY)
    .flatMap(([category, items]) => items.map((item) => [normalize(item), category] as const)),
);

/** Sugere a categoria (rótulo padrão da casa) para um item conhecido. */
export function categoryFor(name: string): string | null {
  return CATEGORY_BY_ITEM.get(normalize(name)) ?? null;
}

export function filterItems(query: string, max = 6): string[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  return COMMON_ITEMS.filter((item) => normalize(item).includes(q)).slice(0, max);
}
