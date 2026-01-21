import { JWTPayload } from '../middleware/auth/auth.js';

interface AuthenticatedUser {
  id: number;
  email: string;
  status_id: string | number; // rendre status_id obligatoire pour correspondre au token
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser; // Utilisation de l'interface AuthenticatedUser
    }
  }
}

export {};
