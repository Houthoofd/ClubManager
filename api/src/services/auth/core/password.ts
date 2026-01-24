/**
 * Module de gestion des mots de passe
 */

import { prisma } from '../../../infrastructure/database/prisma-client.js';
import bcrypt from 'bcrypt';
import type { AuthResult, PasswordValidation } from '@clubmanager/types';

/**
 * Modifie le mot de passe d'un utilisateur
 */
export async function modifierMotDePasse(
  userId: number,
  newPassword: string
): Promise<AuthResult> {
  console.log(`🔑 [AuthPassword] Modification mot de passe pour utilisateur ${userId}`);

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.utilisateurs.updateMany({
    where: {
      id: userId,
      status_id: 1, // Actif uniquement
    },
    data: {
      password: passwordHash,
    },
  });

  if (updated.count === 0) {
    console.log(`❌ [AuthPassword] Utilisateur ${userId} non trouvé ou inactif`);
    return {
      success: false,
      message: 'Utilisateur non trouvé',
    };
  }

  console.log(`✅ [AuthPassword] Mot de passe modifié pour utilisateur ${userId}`);

  return {
    success: true,
    message: 'Mot de passe modifié avec succès',
  };
}

/**
 * Valide un mot de passe selon les règles de sécurité
 */
export function validerMotDePasse(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Vérifie si un mot de passe correspond à son hash
 */
export async function verifierMotDePasse(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Hashe un mot de passe
 */
export async function hasherMotDePasse(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Valide un email
 */
export function validerEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
