// Remplacez l'utilisation de import.meta.env par une valeur par défaut pour les tests
export const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000/';
