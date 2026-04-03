/**
 * Mutations: desactiverUtilisateur et reactiverUtilisateur
 * Gère l'activation et la désactivation des utilisateurs
 */

import type { PrismaClient } from '@prisma/client';
import type { DesactiverUtilisateurInput, ReactiverUtilisateurInput, ActivationResult } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode, DesactiverUtilisateurInputSchema, ReactiverUtilisateurInputSchema } from '@clubmanager/types';

/**
 * Désactive un utilisateur (le marque comme inactif)
 */
export async function desactiverUtilisateur(
  prisma: PrismaClient,
  input: DesactiverUtilisateurInput
): Promise<ActivationResult> {
  try {
    // Validation des données
    const validated = DesactiverUtilisateurInputSchema.parse(input);

    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: validated.id },
      select: {
        id: true,
        active: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!utilisateur) {
      throw new UtilisateursError(
        'Utilisateur non trouvé',
        UtilisateursErrorCode.USER_NOT_FOUND
      );
    }

    // Vérifier si l'utilisateur est déjà désactivé
    if (!utilisateur.active) {
      return {
        success: false,
        message: 'L\'utilisateur est déjà désactivé',
      };
    }

    // Désactiver l'utilisateur en transaction
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut
      await tx.utilisateurs.update({
        where: { id: validated.id },
        data: {
          active: false,
          status_id: 2, // Statut inactif
          updated_at: new Date(),
        },
      });

      // Optionnel : Enregistrer dans l'historique si vous avez une table d'audit
      // await tx.utilisateurs_historique.create({
      //   data: {
      //     utilisateur_id: validated.id,
      //     action: 'DESACTIVATION',
      //     motif: validated.motif || 'Non spécifié',
      //     date: new Date(),
      //   },
      // });
    });

    return {
      success: true,
      message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} a été désactivé avec succès`,
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
    throw new UtilisateursError(
      'Erreur lors de la désactivation de l\'utilisateur',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}

/**
 * Réactive un utilisateur (le marque comme actif)
 */
export async function reactiverUtilisateur(
  prisma: PrismaClient,
  input: ReactiverUtilisateurInput
): Promise<ActivationResult> {
  try {
    // Validation des données
    const validated = ReactiverUtilisateurInputSchema.parse(input);

    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: validated.id },
      select: {
        id: true,
        active: true,
        first_name: true,
        last_name: true,
        status_id: true,
      },
    });

    if (!utilisateur) {
      throw new UtilisateursError(
        'Utilisateur non trouvé',
        UtilisateursErrorCode.USER_NOT_FOUND
      );
    }

    // Vérifier si l'utilisateur est déjà actif
    if (utilisateur.active) {
      return {
        success: false,
        message: 'L\'utilisateur est déjà actif',
      };
    }

    // Vérifier si l'utilisateur n'est pas suspendu définitivement
    if (utilisateur.status_id === 3) {
      throw new UtilisateursError(
        'Impossible de réactiver un utilisateur suspendu. Veuillez d\'abord lever la suspension.',
        UtilisateursErrorCode.USER_SUSPENDED
      );
    }

    // Réactiver l'utilisateur en transaction
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut
      await tx.utilisateurs.update({
        where: { id: validated.id },
        data: {
          active: true,
          status_id: 1, // Statut actif
          updated_at: new Date(),
        },
      });

      // Optionnel : Enregistrer dans l'historique si vous avez une table d'audit
      // await tx.utilisateurs_historique.create({
      //   data: {
      //     utilisateur_id: validated.id,
      //     action: 'REACTIVATION',
      //     date: new Date(),
      //   },
      // });
    });

    return {
      success: true,
      message: `L'utilisateur ${utilisateur.first_name} ${utilisateur.last_name} a été réactivé avec succès`,
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error('Erreur lors de la réactivation de l\'utilisateur:', error);
    throw new UtilisateursError(
      'Erreur lors de la réactivation de l\'utilisateur',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
