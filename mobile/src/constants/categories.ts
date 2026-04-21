export interface Category {
  label: string;
  emoji: string;
}

const FRIDGE_CATEGORIES: Category[] = [
  { label: 'Laticínios', emoji: '🥛' },
  { label: 'Carnes & Ovos', emoji: '🍖' },
  { label: 'Frutas', emoji: '🍎' },
  { label: 'Verduras/Legumes', emoji: '🥦' },
  { label: 'Bebidas', emoji: '🥤' },
  { label: 'Molhos & Condimentos', emoji: '🧂' },
  { label: 'Prontos/Restos', emoji: '🍽️' },
];

const FREEZER_CATEGORIES: Category[] = [
  { label: 'Carnes congeladas', emoji: '🧊' },
  { label: 'Vegetais congelados', emoji: '🥦' },
  { label: 'Pratos prontos', emoji: '🍕' },
  { label: 'Sobremesas', emoji: '🍦' },
  { label: 'Pães congelados', emoji: '🍞' },
];

const PANTRY_CATEGORIES: Category[] = [
  { label: 'Grãos & Cereais', emoji: '🌾' },
  { label: 'Enlatados/Conservas', emoji: '🥫' },
  { label: 'Massas & Farinhas', emoji: '🍝' },
  { label: 'Snacks & Biscoitos', emoji: '🍪' },
  { label: 'Temperos & Condimentos', emoji: '🧂' },
  { label: 'Bebidas', emoji: '🧃' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { label: 'Laticínios', emoji: '🥛' },
  { label: 'Carnes & Ovos', emoji: '🍖' },
  { label: 'Frutas', emoji: '🍎' },
  { label: 'Verduras/Legumes', emoji: '🥦' },
  { label: 'Grãos & Cereais', emoji: '🌾' },
  { label: 'Bebidas', emoji: '🥤' },
  { label: 'Outros', emoji: '📦' },
];

export function getCategoriesForStorage(storageName?: string | null): Category[] {
  if (!storageName) return DEFAULT_CATEGORIES;
  const name = storageName.toLowerCase();
  if (name.includes('freezer')) return FREEZER_CATEGORIES;
  if (name.includes('despensa') || name.includes('pantry')) return PANTRY_CATEGORIES;
  if (name.includes('geladeira') || name.includes('fridge')) return FRIDGE_CATEGORIES;
  return DEFAULT_CATEGORIES;
}
