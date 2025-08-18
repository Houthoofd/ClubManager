// Fonction utilitaire à importer dans tous les fichiers front-end/src/pages
import { API_BASE_URL } from '../../config';

export function apiUrl(path: string) {
  const isProd = import.meta.env.MODE === 'production';
  const base = isProd
    ? API_BASE_URL.endsWith('/api/')
      ? API_BASE_URL
      : API_BASE_URL.replace(/\/?$/, '/api/')
    : API_BASE_URL;
  return `${base}${path.replace(/^\/+/, '')}`;
}
