import { TenantContext } from "@clubmanager/types";

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  actif: boolean;
  tenantId: string;
}

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
