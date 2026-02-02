/**
 * Middleware de Rate Limiting pour l'authentification
 * Utilise la table auth_attempts pour bloquer les tentatives de force brute
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../infrastructure/database/prisma-client.js';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  resetAt?: Date;
  message?: string;
}

/**
 * Configuration par défaut du rate limiting
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,           // 5 tentatives max
  windowMinutes: 15,        // Dans une fenêtre de 15 minutes
  blockDurationMinutes: 30, // Blocage de 30 minutes
};

/**
 * Vérifie si un email est rate-limité
 */
export async function verifierRateLimit(
  email: string,
  config: Partial<RateLimitConfig> = {},
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const maintenant = new Date();
  const fenetreDebut = new Date(maintenant.getTime() - finalConfig.windowMinutes * 60 * 1000);

  console.log(`🔍 [RateLimit] Vérification pour ${email}`);

  // Compter les tentatives échouées récentes
  const tentativesEchouees = await prisma.auth_attempts.count({
    where: {
      email: email.toLowerCase().trim(),
      success: false,
      attempted_at: {
        gte: fenetreDebut,
      },
    },
  });

  console.log(`📊 [RateLimit] ${tentativesEchouees}/${finalConfig.maxAttempts} tentatives échouées`);

  // Si trop de tentatives échouées
  if (tentativesEchouees >= finalConfig.maxAttempts) {
    // Trouver la dernière tentative échouée
    const derniereTentative = await prisma.auth_attempts.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        success: false,
      },
      orderBy: {
        attempted_at: 'desc',
      },
      select: {
        attempted_at: true,
      },
    });

    if (derniereTentative) {
      const resetAt = new Date(
        derniereTentative.attempted_at.getTime() +
        finalConfig.blockDurationMinutes * 60 * 1000
      );

      // Vérifier si le blocage est encore actif
      if (maintenant < resetAt) {
        const minutesRestantes = Math.ceil((resetAt.getTime() - maintenant.getTime()) / (60 * 1000));

        console.log(`🚫 [RateLimit] Compte bloqué pour encore ${minutesRestantes} minutes`);

        return {
          allowed: false,
          resetAt,
          message: `Trop de tentatives échouées. Réessayez dans ${minutesRestantes} minute(s).`,
        };
      }
    }
  }

  const tentativesRestantes = Math.max(0, finalConfig.maxAttempts - tentativesEchouees);

  console.log(`✅ [RateLimit] Tentative autorisée (${tentativesRestantes} restantes)`);

  return {
    allowed: true,
    attemptsRemaining: tentativesRestantes,
  };
}

/**
 * Enregistre une tentative d'authentification (succès ou échec)
 */
export async function enregistrerTentative(
  email: string,
  success: boolean,
  metadata: {
    ipAddress?: string;
    userAgent?: string;
  } = {},
): Promise<void> {
  try {
    await prisma.auth_attempts.create({
      data: {
        email: email.toLowerCase().trim(),
        success,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        attempted_at: new Date(),
      },
    });

    console.log(`📝 [RateLimit] Tentative enregistrée: ${success ? 'SUCCÈS' : 'ÉCHEC'} pour ${email}`);
  } catch (error) {
    console.error('⚠️ [RateLimit] Erreur enregistrement tentative:', error);
    // Ne pas faire échouer la requête si l'audit échoue
  }
}

/**
 * Réinitialise les tentatives pour un email (après succès ou déverrouillage manuel)
 */
export async function reinitialiserTentatives(email: string): Promise<number> {
  console.log(`🔄 [RateLimit] Réinitialisation des tentatives pour ${email}`);

  const result = await prisma.auth_attempts.deleteMany({
    where: {
      email: email.toLowerCase().trim(),
      success: false,
    },
  });

  console.log(`✅ [RateLimit] ${result.count} tentative(s) supprimée(s)`);
  return result.count;
}

/**
 * Obtient les statistiques de rate limiting pour un email
 */
export async function obtenirStatistiquesRateLimit(
  email: string,
  minutesFenetre: number = 60,
): Promise<{
  tentativesTotales: number;
  tentativesReussies: number;
  tentativesEchouees: number;
  derniereTentative: Date | null;
  dernierSucces: Date | null;
}> {
  const maintenant = new Date();
  const fenetreDebut = new Date(maintenant.getTime() - minutesFenetre * 60 * 1000);
  const emailNormalise = email.toLowerCase().trim();

  const [tentativesTotales, tentativesReussies, tentativesEchouees, derniereTentative, dernierSucces] = await Promise.all([
    // Total
    prisma.auth_attempts.count({
      where: {
        email: emailNormalise,
        attempted_at: { gte: fenetreDebut },
      },
    }),
    // Réussies
    prisma.auth_attempts.count({
      where: {
        email: emailNormalise,
        success: true,
        attempted_at: { gte: fenetreDebut },
      },
    }),
    // Échouées
    prisma.auth_attempts.count({
      where: {
        email: emailNormalise,
        success: false,
        attempted_at: { gte: fenetreDebut },
      },
    }),
    // Dernière tentative
    prisma.auth_attempts.findFirst({
      where: { email: emailNormalise },
      orderBy: { attempted_at: 'desc' },
      select: { attempted_at: true },
    }),
    // Dernier succès
    prisma.auth_attempts.findFirst({
      where: { email: emailNormalise, success: true },
      orderBy: { attempted_at: 'desc' },
      select: { attempted_at: true },
    }),
  ]);

  return {
    tentativesTotales,
    tentativesReussies,
    tentativesEchouees,
    derniereTentative: derniereTentative?.attempted_at || null,
    dernierSucces: dernierSucces?.attempted_at || null,
  };
}

/**
 * Nettoie les anciennes tentatives (maintenance)
 */
export async function nettoyerAnciennesTentatives(
  joursRetention: number = 30,
): Promise<number> {
  console.log(`🧹 [RateLimit] Nettoyage des tentatives de plus de ${joursRetention} jours`);

  const dateSeuilAncien = new Date(Date.now() - joursRetention * 24 * 60 * 60 * 1000);

  const result = await prisma.auth_attempts.deleteMany({
    where: {
      attempted_at: {
        lt: dateSeuilAncien,
      },
    },
  });

  console.log(`✅ [RateLimit] ${result.count} tentative(s) supprimée(s)`);
  return result.count;
}

/**
 * Middleware Express pour le rate limiting des routes d'authentification
 */
export function rateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extraire l'email du body
      const email = req.body?.email;

      if (!email) {
        // Pas d'email, on laisse passer (la validation se fera ailleurs)
        next();
        return;
      }

      // Vérifier le rate limit
      const rateLimit = await verifierRateLimit(email, config);

      if (!rateLimit.allowed) {
        res.status(429).json({
          success: false,
          message: rateLimit.message,
          resetAt: rateLimit.resetAt,
        });
        return;
      }

      // Ajouter les infos de rate limit à la requête
      req.rateLimit = {
        attemptsRemaining: rateLimit.attemptsRemaining || 0,
      };

      next();
    } catch (error) {
      console.error('⚠️ [RateLimit] Erreur middleware:', error);
      // En cas d'erreur, on laisse passer pour ne pas bloquer l'authentification
      next();
    }
  };
}

/**
 * Middleware pour enregistrer automatiquement les tentatives
 * À placer APRÈS la logique d'authentification
 */
export function enregistrerTentativeMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Hook dans res.json pour capturer le résultat
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Enregistrer la tentative de manière asynchrone
      const email = req.body?.email;
      if (email && typeof body === 'object') {
        const success = body.success === true;

        enregistrerTentative(email, success, {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }).catch((error) => {
          console.error('⚠️ [RateLimit] Erreur enregistrement tentative:', error);
        });

        // Réinitialiser les tentatives en cas de succès
        if (success) {
          reinitialiserTentatives(email).catch((error) => {
            console.error('⚠️ [RateLimit] Erreur réinitialisation tentatives:', error);
          });
        }
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Obtient les emails les plus bloqués (pour monitoring)
 */
export async function obtenirEmailsBloques(
  limite: number = 10,
  minutesFenetre: number = 60,
): Promise<Array<{
  email: string;
  tentativesEchouees: number;
  derniereTentative: Date;
}>> {
  const maintenant = new Date();
  const fenetreDebut = new Date(maintenant.getTime() - minutesFenetre * 60 * 1000);

  const tentatives = await prisma.auth_attempts.groupBy({
    by: ['email'],
    where: {
      success: false,
      attempted_at: { gte: fenetreDebut },
    },
    _count: {
      email: true,
    },
    orderBy: {
      _count: {
        email: 'desc',
      },
    },
    take: limite,
  });

  // Obtenir la dernière tentative pour chaque email
  const resultat = await Promise.all(
    tentatives.map(async (t) => {
      const derniere = await prisma.auth_attempts.findFirst({
        where: {
          email: t.email,
          success: false,
        },
        orderBy: { attempted_at: 'desc' },
        select: { attempted_at: true },
      });

      return {
        email: t.email,
        tentativesEchouees: t._count.email,
        derniereTentative: derniere?.attempted_at || new Date(),
      };
    })
  );

  return resultat;
}

// Étendre les types Express pour inclure les infos de rate limit
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        attemptsRemaining: number;
      };
    }
  }
}
