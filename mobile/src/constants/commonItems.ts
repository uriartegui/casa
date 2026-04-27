export const COMMON_ITEMS = [
  // Laticínios
  'Leite', 'Leite integral', 'Leite desnatado', 'Iogurte', 'Queijo', 'Queijo mussarela',
  'Queijo prato', 'Requeijão', 'Manteiga', 'Margarina', 'Creme de leite', 'Nata',
  // Carnes
  'Frango', 'Peito de frango', 'Coxa de frango', 'Carne moída', 'Carne bovina',
  'Picanha', 'Alcatra', 'Patinho', 'Linguiça', 'Salsicha', 'Bacon', 'Presunto',
  'Peixe', 'Salmão', 'Tilápia', 'Atum', 'Camarão',
  // Hortifruti
  'Alface', 'Tomate', 'Cebola', 'Alho', 'Batata', 'Batata-doce', 'Cenoura',
  'Brócolis', 'Couve', 'Espinafre', 'Pepino', 'Abobrinha', 'Berinjela',
  'Pimentão', 'Milho', 'Ervilha', 'Beterraba', 'Chuchu', 'Mandioca',
  'Banana', 'Maçã', 'Laranja', 'Limão', 'Mamão', 'Melão', 'Melancia',
  'Uva', 'Morango', 'Abacaxi', 'Manga', 'Abacate',
  // Padaria / grãos
  'Arroz', 'Feijão', 'Feijão preto', 'Macarrão', 'Farinha de trigo', 'Fubá',
  'Aveia', 'Granola', 'Pão de forma', 'Pão francês', 'Tapioca',
  // Ovos / mercearia
  'Ovos', 'Azeite', 'Óleo', 'Vinagre', 'Molho de tomate', 'Extrato de tomate',
  'Sal', 'Açúcar', 'Mel', 'Café', 'Achocolatado',
  // Bebidas
  'Água', 'Suco de laranja', 'Suco de uva', 'Refrigerante', 'Cerveja',
  // Congelados / industrializados
  'Pizza congelada', 'Lasanha', 'Nuggets', 'Hambúrguer',
  // Limpeza / higiene
  'Detergente', 'Sabão em pó', 'Amaciante', 'Desinfetante', 'Papel higiênico',
  'Sabonete', 'Shampoo', 'Condicionador', 'Pasta de dente', 'Esponja',
];

export function filterItems(query: string, max = 6): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return COMMON_ITEMS.filter((item) => {
    const normalized = item.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return normalized.includes(q);
  }).slice(0, max);
}
