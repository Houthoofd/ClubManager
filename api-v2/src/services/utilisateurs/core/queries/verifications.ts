/**
 * Vérifications pour le service Utilisateurs
 * Fonctions de vérification d'existence, d'unicité, etc.
 */

import type { PrismaClient } from '@prisma/client';
import type { VerificationEmailResult, VerificationUtilisateurResult } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode } from '@clubmanager/types';
import { z } from 'zod';

/**
 * Schéma de validation pour un email
 */
const EmailSchema = z.string().email('Email invalide').min(1, 'Email requis');

/**
 * Schéma de validation pour un ID
 */
const IdSchema = z.number().int().positive('ID doit être un nombre positif');

/**
 * Vérifie si un email existe dans la base de données
 * @param prisma - Client Prisma
 * @param email - Email à vérifier
 * @returns Résultat de la vérification avec détails de l'utilisateur
 */
export async function verifierEmailExiste(
  prisma: PrismaClient,
  email: string
): Promise<VerificationEmailResult> {
  try {
    // Validation de l'email
    const emailValide = EmailSchema.parse(email.trim().toLowerCase());

    // Recherche de l'utilisateur
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { email: emailValide },
      select: {
        id: true,
        active: true,
        status_id: true,
      },
    });

    if (utilisateur) {
      return {
        existe: true,
        message: 'Email déjà utilisé.',
        utilisateurId: utilisateur.id,
        actif: utilisateur.active,
      };
    }

    return {
      existe: false,
      message: 'Email disponible.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new UtilisateursError(
        error.errors[0]?.message || 'Email invalide',
        UtilisateursErrorCode.INVALID_EMAIL
      );
    }
    throw new UtilisateursError(
      'Erreur lors de la vérification de l\'email',
      UtilisateursErrorCode.DATABASE_ERROR
    );
  }
}

/**
 * Vérifie si un utilisateur existe et peut s'inscrire
 * @param prisma - Client Prisma
 * @param email - Email à vérifier
 * @returns Résultat de la vérification avec informations complètes
 */
export async function verifierUtilisateurExiste(
  prisma: PrismaClient,
  email: string
): Promise<VerificationUtilisateurResult> {
  try {
    // Validation de l'email
    const emailValide = EmailSchema.parse(email.trim().toLowerCase());

    // Recherche de l'utilisateur avec détails
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { email: emailValide },
      select: {
        id: true,
        userId: true,
        first_name: true,
        last_name: true,
        email: true,
        date_of_birth: true,
        active: true,
        status_id: true,
      },
    });

    if (utilisateur) {
      // Utilisateur existe
      const canRegister = !utilisateur.active || utilisateur.status_id === 2; // Inactif

      return {
        existe: true,
        canRegister,
        message: canRegister
          ? 'Utilisateur existant mais inactif. Peut être réactivé.'
          : 'Utilisateur déjà enregistré et actif.',
        utilisateur: {
          id: utilisateur.id,
          userId: utilisateur.userId || '',
          nom: utilisateur.last_name,
          prenom: utilisateur.first_name,
          email: utilisateur.email,
          date_naissance: utilisateur.date_of_birth,
        },
      };
    }

    // Utilisateur n'existe pas
    return {
      existe: false,
      canRegister: true,
      message: 'Email disponible. Inscription possible.',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new UtilisateursError(
        error.errors[0]?.message || 'Email invalide',
        UtilisateursErrorCode.INVALID_EMAIL
      );
    }
    throw new UtilisateursError(
      'Erreur lors de la vérification de l\'utilisateur',
      UtilisateursErrorCode.DATABASE_ERROR
    );
  }
}

/**
 * Vérifie si un utilisateur existe par son ID
 * @param prisma - Client Prisma
 * @param id - ID de l'utilisateur
 * @returns true si l'utilisateur existe, false sinon
 */
export async function utilisateurExiste(
  prisma: PrismaClient,
  id: number
): Promise<boolean> {
  try {
    // Validation de l'ID
    const idValide = IdSchema.parse(id);

    // Vérification de l'existence
    const count = await prisma.utilisateurs.count({
      where: { id: idValide },
    });

    return count > 0;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new UtilisateursError(
        error.errors[0]?.message || 'ID invalide',
        UtilisateursErrorCode.INVALID_ID
      );
    }
    throw new UtilisateursError(
      'Erreur lors de la vérification de l\'existence de l\'utilisateur',
      UtilisateursErrorCode.DATABASE_ERROR
    );
  }
}
