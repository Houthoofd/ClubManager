import { env, isProd } from "@/core/config/env";

// Détecte l'environnement
const isProduction = isProd;

// Définit l'URL de base selon l'environnement
export const API_BASE_URL = isProduction
  ? env.api.baseUrl.endsWith("/")
    ? env.api.baseUrl
    : env.api.baseUrl + "/"
  : "http://localhost:3000/"; // URL locale pour dev (sans /api)
