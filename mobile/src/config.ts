// Único ponto de configuração da URL da API.
// Em dev, pode ser sobrescrita com EXPO_PUBLIC_API_URL num .env.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://colmeiaapp.duckdns.org';
