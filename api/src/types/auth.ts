export interface AuthenticatedUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  status?: string;
  // Ajout des propriétés manquantes
}

// Étendre les types Express pour inclure notre utilisateur personnalisé
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
