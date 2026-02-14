/**
 * Token Helpers
 *
 * Utilitaires pour la génération et validation des tokens JWT (access & refresh)
 */

import jwt from 'jsonwebtoken';
import { TOKEN_CONFIG } from '@/routes/auth/core/config/auth.config.js';

export interface TokenPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  role: string;
  status: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Génère un access token JWT
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  try {
    const token = jwt.sign(
      payload,
      TOKEN_CONFIG.ACCESS_TOKEN.SECRET,
      {
        expiresIn: TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN,
        algorithm: TOKEN_CONFIG.ACCESS_TOKEN.ALGORITHM,
      }
    );

    console.log(`✅ [Token] Access token généré pour user ${payload.id} (expire: ${TOKEN_CONFIG.ACCESS_TOKEN.EXPIRES_IN})`);
    return token;
  } catch (error: any) {
    console.error('❌ [Token] Erreur génération access token:', error);
    throw new Error('Échec de génération du token');
  }
}

/**
 * Génère un refresh token JWT
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  try {
    const token = jwt.sign(
      payload,
      TOKEN_CONFIG.REFRESH_TOKEN.SECRET,
      {
        expiresIn: TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN,
        algorithm: TOKEN_CONFIG.REFRESH_TOKEN.ALGORITHM,
      }
    );

    console.log(`✅ [Token] Refresh token généré pour user ${payload.id} (expire: ${TOKEN_CONFIG.REFRESH_TOKEN.EXPIRES_IN})`);
    return token;
  } catch (error: any) {
    console.error('❌ [Token] Erreur génération refresh token:', error);
    throw new Error('Échec de génération du refresh token');
  }
}

/**
 * Vérifie et décode un access token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      TOKEN_CONFIG.ACCESS_TOKEN.SECRET,
      {
        algorithms: [TOKEN_CONFIG.ACCESS_TOKEN.ALGORITHM],
      }
    ) as TokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    }
    throw new Error('Erreur de vérification du token');
  }
}

/**
 * Vérifie et décode un refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      TOKEN_CONFIG.REFRESH_TOKEN.SECRET,
      {
        algorithms: [TOKEN_CONFIG.REFRESH_TOKEN.ALGORITHM],
      }
    ) as RefreshTokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh token invalide');
    }
    throw new Error('Erreur de vérification du refresh token');
  }
}

/**
 * Décode un token sans vérifier la signature (utilisé pour debug)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    console.error('❌ [Token] Erreur décodage token:', error);
    return null;
  }
}

/**
 * Vérifie si un token est expiré (sans vérifier la signature)
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Extrait le token du header Authorization
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Génère une paire de tokens (access + refresh)
 */
export function generateTokenPair(
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status_id: number;
    role: string;
    status: string;
  },
  sessionId?: string
): { accessToken: string; refreshToken: string } {
  const accessToken = generateToken({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    status_id: user.status_id,
    role: user.role,
    status: user.status,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    sessionId,
  });

  return { accessToken, refreshToken };
}

/**
 * Renouvelle un access token à partir d'un refresh token valide
 */
export async function renewAccessToken(
  refreshToken: string,
  getUserById: (id: number) => Promise<any>
): Promise<{ accessToken: string; newRefreshToken: string } | null> {
  try {
    // Vérifier le refresh token
    const refreshPayload = verifyRefreshToken(refreshToken);

    // Récupérer les données utilisateur à jour
    const user = await getUserById(refreshPayload.id);
    if (!user) {
      console.warn('⚠️ [Token] Utilisateur non trouvé lors du renouvellement');
      return null;
    }

    // Générer une nouvelle paire de tokens
    const tokens = generateTokenPair(user, refreshPayload.sessionId);

    console.log(`🔄 [Token] Tokens renouvelés pour user ${user.id}`);
    return {
      accessToken: tokens.accessToken,
      newRefreshToken: tokens.refreshToken,
    };
  } catch (error: any) {
    console.error('❌ [Token] Erreur renouvellement token:', error.message);
    return null;
  }
}

/**
 * Calcule le temps restant avant expiration (en secondes)
 */
export function getTokenTimeToLive(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = decoded.exp - now;

  return ttl > 0 ? ttl : 0;
}

/**
 * Vérifie si un token est proche de l'expiration (moins de 5 minutes)
 */
export function isTokenNearExpiry(token: string, thresholdSeconds: number = 300): boolean {
  const ttl = getTokenTimeToLive(token);
  if (ttl === null) {
    return true;
  }

  return ttl < thresholdSeconds;
}
