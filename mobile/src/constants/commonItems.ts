// Itens conhecidos agrupados pelos rotulos das categorias padrao da casa.
// Assim a categoria sugerida bate com as opcoes cadastradas no backend.
const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  Laticinios: [
    'Leite', 'Leite integral', 'Leite desnatado', 'Iogurte', 'Queijo', 'Queijo mussarela',
    'Queijo prato', 'Requeijao', 'Manteiga', 'Margarina', 'Creme de leite', 'Nata',
  ],
  'Carnes & Ovos': [
    'Frango', 'Peito de frango', 'Coxa de frango', 'Carne moida', 'Carne bovina',
    'Picanha', 'Alcatra', 'Patinho', 'Linguica', 'Salsicha', 'Bacon', 'Presunto',
    'Peixe', 'Salmao', 'Tilapia', 'Atum', 'Camarao', 'Ovos',
  ],
  'Verduras/Legumes': [
    'Alface', 'Tomate', 'Cebola', 'Alho', 'Batata', 'Batata-doce', 'Cenoura',
    'Brocolis', 'Couve', 'Espinafre', 'Pepino', 'Abobrinha', 'Berinjela',
    'Pimentao', 'Milho', 'Ervilha', 'Beterraba', 'Chuchu', 'Mandioca',
  ],
  Frutas: [
    'Banana', 'Maca', 'Laranja', 'Limao', 'Mamao', 'Melao', 'Melancia',
    'Uva', 'Morango', 'Abacaxi', 'Manga', 'Abacate',
  ],
  'Graos & Cereais': [
    'Arroz', 'Feijao', 'Feijao preto', 'Aveia', 'Granola',
  ],
  'Massas & Farinhas': [
    'Macarrao', 'Farinha de trigo', 'Fuba', 'Tapioca',
  ],
  'Molhos & Condimentos': [
    'Azeite', 'Oleo', 'Vinagre', 'Molho de tomate', 'Extrato de tomate',
  ],
  Temperos: [
    'Sal',
  ],
  Bebidas: [
    'Agua', 'Suco de laranja', 'Suco de uva', 'Refrigerante', 'Cerveja',
  ],
  'Pratos prontos': [
    'Pizza congelada', 'Lasanha', 'Nuggets', 'Hamburguer',
  ],
  'Limpeza geral': [
    'Detergente', 'Desinfetante', 'Alcool', 'Agua sanitaria', 'Multiuso',
    'Limpador de vidro', 'Esponja', 'Pano de limpeza', 'Rodo', 'Vassoura',
  ],
  Cozinha: [
    'Sabao de louca', 'Lava-loucas', 'Palha de aco', 'Papel toalha',
  ],
  'Lixo & Sacos': [
    'Saco de lixo', 'Saco de lixo banheiro', 'Saco de lixo cozinha',
  ],
  'Higiene pessoal': [
    'Sabonete', 'Pasta de dente', 'Escova de dente', 'Enxaguante bucal',
    'Desodorante', 'Absorvente', 'Fio dental',
  ],
  'Papel & Algodao': [
    'Papel higienico', 'Algodao', 'Cotonete', 'Lenco umedecido',
  ],
  Cabelo: [
    'Shampoo', 'Condicionador', 'Creme de pentear', 'Mascara capilar',
  ],
  Roupas: [
    'Sabao em po', 'Sabao liquido', 'Amaciante', 'Tira manchas',
    'Alvejante', 'Prendedor de roupa',
  ],
  Passadoria: [
    'Passa facil', 'Agua de passar',
  ],
};

const UNCATEGORIZED_ITEMS = [
  'Pao de forma', 'Pao frances', 'Acucar', 'Mel', 'Cafe', 'Achocolatado',
];

export const COMMON_ITEMS = [
  ...Object.values(ITEMS_BY_CATEGORY).flat(),
  ...UNCATEGORIZED_ITEMS,
];

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const CATEGORY_BY_ITEM = new Map<string, string>(
  Object.entries(ITEMS_BY_CATEGORY)
    .flatMap(([category, items]) => items.map((item) => [normalize(item), category] as const)),
);

/** Sugere a categoria padrao da casa para um item conhecido. */
export function categoryFor(name: string): string | null {
  return CATEGORY_BY_ITEM.get(normalize(name)) ?? null;
}

export function filterItems(query: string, max = 6): string[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  return COMMON_ITEMS.filter((item) => normalize(item).includes(q)).slice(0, max);
}
