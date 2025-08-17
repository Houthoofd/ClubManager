// Détecte l'environnement
const isProduction = import.meta.env.MODE === 'production';

// Définit l'URL de base selon l'environnement
export const API_BASE_URL = isProduction
  ? import.meta.env.VITE_API_BASE_URL.endsWith('/')
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL + '/'
  : 'http://localhost:3000/'; // URL locale pour dev

