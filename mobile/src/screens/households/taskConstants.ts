export type StatusFilter = 'open' | 'mine' | 'late' | 'done' | 'all';

export const NONE_VALUE = '__none__';

export const CATEGORIES = ['Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutenção', 'Compras', 'Organização', 'Outros'];

export const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendentes', value: 'open' },
  { label: 'Minhas', value: 'mine' },
  { label: 'Atrasadas', value: 'late' },
  { label: 'Concluídas', value: 'done' },
  { label: 'Tudo', value: 'all' },
];
