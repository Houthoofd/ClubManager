import { TenantContext } from "./tenant.js";

export interface AuthenticatedUser {
  id: number;
  tenantId: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  status?: string;
  grade?: string;
  actif?: boolean;
}

// Étendre les types Express pour inclure notre utilisateur personnalisé
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantContext;
    }
  }
}
