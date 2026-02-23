import { API_BASE_URL } from "@/app/config";
import { isProd } from "@/core/config/env";

// Fonction utilitaire pour construire les URLs API
export function apiUrl(path: string) {
  // En production -> forcer /api/
  const base = isProd
    ? API_BASE_URL.endsWith("/api/")
      ? API_BASE_URL
      : API_BASE_URL.replace(/\/$/, "") + "/api/"
    : API_BASE_URL; // en dev pas de /api/

  // Nettoie les / en trop
  return `${base}${path.replace(/^\/+/, "")}`;
}
