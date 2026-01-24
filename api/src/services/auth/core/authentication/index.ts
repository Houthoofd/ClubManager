/**
 * Module d'authentification - Connexion et validation
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import bcrypt from 'bcrypt';
import type { AuthResult } from '@clubmanager/types';

/**
 * Authentifie un utilisateur avec email et mot de passe
 */
export async function authentifierUtilisateur(
  email: string,
  password: string,
  prisma = defaultPrisma
): Promise<AuthResult> {
  console.log(`🔐 [AuthAuthentication] Tentative d'authentification pour ${email}`);

  // Rechercher l'utilisateur actif
  const user = await prisma.utilisateurs.findFirst({
    where: {
      email,
      status_id: 1, // Actif uniquement
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      password: true,
      status_id: true,
    },
  });

  if (!user) {
    console.log(`❌ [AuthAuthentication] Utilisateur non trouvé : ${email}`);
    return {
      success: false,
      message: 'Utilisateur non trouvé',
    };
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    console.log(`❌ [AuthAuthentication] Mot de passe incorrect pour ${email}`);
    return {
      success: false,
      message: 'Mot de passe incorrect',
    };
  }

  console.log(`✅ [AuthAuthentication] Authentification réussie pour ${email}`);

  return {
    success: true,
    message: 'Authentification réussie',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      statusId: user.status_id,
    },
  };
}

/**
 * Crée un nouveau compte utilisateur
 */
export async function creerCompteUtilisateur(
  input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  },
  prisma = defaultPrisma
): Promise<AuthResult> {
  console.log(`➕ [AuthAuthentication] Création compte pour ${input.email}`);

  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.utilisateurs.create({
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        password: passwordHash,
        status_id: 1,
        date_inscription: new Date(),
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        status_id: true,
      },
    });

    console.log(`✅ [AuthAuthentication] Compte créé avec succès: ${user.id}`);

    return {
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        statusId: user.status_id,
      },
    };
  } catch (error: any) {
    console.error('❌ [AuthAuthentication] Erreur création compte:', error);
    
    // Gérer l'erreur de doublon d'email
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Cet email est déjà utilisé',
      };
    }

    throw error;
  }
}

/**
 * Vérifie si un email existe déjà
 */
export async function emailExiste(email: string, prisma = defaultPrisma): Promise<boolean> {
  const count = await prisma.utilisateurs.count({
    where: { email },
  });

  return count > 0;
}

/**
 * Enregistre une tentative de connexion pour audit
 */
export async function enregistrerTentativeConnexion(
  email: string,
  success: boolean,
  prisma = defaultPrisma
): Promise<void> {
  try {
    await prisma.auth_attempts.create({
      data: {
        email,
        success,
        attempted_at: new Date(),
      },
    });
  } catch (error) {
    console.error('⚠️ [AuthAuthentication] Erreur enregistrement tentative:', error);
    // Ne pas faire échouer l'authentification
  }
}

/**
 * Obtient le nombre de tentatives de connexion récentes
 */
export async function obtenirTentativesConnexionRecentes(
  email: string,
  minutes: number = 15,
  prisma = defaultPrisma
): Promise<number> {
  const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

  const count = await prisma.auth_attempts.count({
    where: {
      email,
      attempted_at: {
        gte: timeAgo,
      },
    },
  });

  return count;
}
