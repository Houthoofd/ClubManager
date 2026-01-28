/**
 * Vérifications pour le service Professeurs
 * Fonctions de vérification du statut de professeur
 */

import type { PrismaClient } from '@prisma/client';
import { ProfesseursError } from '@clubmanager/types';
import { z } from 'zod';

/**
 * Schéma de validation pour un ID
 */
const IdSchema = z.number().int().positive('ID doit être un nombre positif');

/**
 * Vérifie si un utilisateur est professeur
 * @param prisma - Client Prisma
 * @param utilisateurId - ID de l'utilisateur à vérifier
 * @returns true si l'utilisateur est professeur, false sinon
 */
export async function estProfesseur(
  prisma: PrismaClient,
  utilisateurId: number
): Promise<boolean> {
  try {
    // Validation de l'ID
    const idValide = IdSchema.parse(utilisateurId);

    // Vérifier si l'utilisateur existe dans la table professeurs
    const professeur = await prisma.professeurs.findFirst({
      where: {
        utilisateur_id: idValide,
        active: true,
      },
    });

    return professeur !== null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ProfesseursError(
        error.errors[0]?.message || 'ID invalide',
        'INVALID_ID'
      );
    }
    throw new ProfesseursError(
      'Erreur lors de la vérification du statut de professeur',
      'DATABASE_ERROR'
    );
  }
}
