/**
 * Mutation: modifierUtilisateur
 * Modifie les informations d'un utilisateur existant
 */

import type { PrismaClient } from '@prisma/client';
import type { ModifierUtilisateurInput, ModifierUtilisateurResult } from '@clubmanager/types';
import { UtilisateursError, UtilisateursErrorCode, ModifierUtilisateurInputSchema } from '@clubmanager/types';

/**
 * Modifie un utilisateur existant
 */
export async function modifierUtilisateur(
  prisma: PrismaClient,
  input: ModifierUtilisateurInput
): Promise<ModifierUtilisateurResult> {
  try {
    // Validation des données
    const validated = ModifierUtilisateurInputSchema.parse(input);

    // Vérifier que l'utilisateur existe
    const utilisateurExistant = await prisma.utilisateurs.findUnique({
      where: { id: validated.id },
    });

    if (!utilisateurExistant) {
      throw new UtilisateursError(
        'Utilisateur non trouvé',
        UtilisateursErrorCode.USER_NOT_FOUND
      );
    }

    // Construire l'objet de mise à jour
    const updateData: any = {};

    if (validated.first_name !== undefined) {
      updateData.first_name = validated.first_name;
    }

    if (validated.last_name !== undefined) {
      updateData.last_name = validated.last_name;
    }

    if (validated.email !== undefined) {
      const email = validated.email.toLowerCase().trim();

      // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
      const emailExists = await prisma.utilisateurs.findFirst({
        where: {
          email,
          NOT: { id: validated.id },
        },
      });

      if (emailExists) {
        throw new UtilisateursError(
          'Cet email est déjà utilisé par un autre utilisateur',
          UtilisateursErrorCode.EMAIL_ALREADY_EXISTS
        );
      }

      updateData.email = email;
    }

    if (validated.date_of_birth !== undefined) {
      const dateOfBirth = typeof validated.date_of_birth === 'string'
        ? new Date(validated.date_of_birth)
        : validated.date_of_birth;

      // Validation de l'âge (entre 5 et 120 ans)
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
        ? age - 1
        : age;

      if (adjustedAge < 5 || adjustedAge > 120) {
        throw new UtilisateursError(
          'L\'âge doit être compris entre 5 et 120 ans',
          UtilisateursErrorCode.INVALID_AGE
        );
      }

      updateData.date_of_birth = dateOfBirth;
    }

    if (validated.genre_id !== undefined) {
      updateData.genre_id = validated.genre_id;
    }

    if (validated.abonnement_id !== undefined) {
      updateData.abonnement_id = validated.abonnement_id;
    }

    if (validated.grade_id !== undefined) {
      updateData.grade_id = validated.grade_id;
    }

    if (validated.nom_utilisateur !== undefined) {
      updateData.nom_utilisateur = validated.nom_utilisateur;
    }

    if (validated.status_id !== undefined) {
      updateData.status_id = validated.status_id;
    }

    // Si aucune donnée à mettre à jour
    if (Object.keys(updateData).length === 0) {
      throw new UtilisateursError(
        'Aucune donnée à mettre à jour',
        UtilisateursErrorCode.INVALID_INPUT
      );
    }

    // Mettre à jour l'utilisateur en transaction
    const utilisateur = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.utilisateurs.update({
        where: { id: validated.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        include: {
          genres: true,
          grades: true,
          abonnements: true,
          status: true,
        },
      });

      return updatedUser;
    });

    // Calcul de l'âge
    let age: number | undefined;
    if (utilisateur.date_of_birth) {
      const today = new Date();
      const birthDate = new Date(utilisateur.date_of_birth);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    const initiales = `${utilisateur.first_name.charAt(0).toUpperCase()}${utilisateur.last_name.charAt(0).toUpperCase()}`;

    return {
      success: true,
      message: 'Utilisateur modifié avec succès',
      utilisateur: {
        id: utilisateur.id,
        userId: utilisateur.userId || undefined,
        first_name: utilisateur.first_name,
        last_name: utilisateur.last_name,
        nom_utilisateur: utilisateur.nom_utilisateur || undefined,
        email: utilisateur.email,
        genre_id: utilisateur.genre_id || undefined,
        date_of_birth: utilisateur.date_of_birth,
        grade_id: utilisateur.grade_id,
        abonnement_id: utilisateur.abonnement_id,
        status_id: utilisateur.status_id,
        active: utilisateur.active,
        date_inscription: utilisateur.date_inscription || undefined,
        created_at: utilisateur.created_at || undefined,
        updated_at: utilisateur.updated_at || undefined,
        genre: utilisateur.genres ? {
          id: utilisateur.genres.id,
          nom: utilisateur.genres.nom,
        } : undefined,
        grade: utilisateur.grades ? {
          id: utilisateur.grades.id,
          nom: utilisateur.grades.nom,
          niveau: utilisateur.grades.niveau || 0,
        } : undefined,
        abonnement: utilisateur.abonnements ? {
          id: utilisateur.abonnements.id,
          nom: utilisateur.abonnements.nom,
          type: utilisateur.abonnements.type || 'standard',
        } : undefined,
        status: utilisateur.status ? {
          id: utilisateur.status.id,
          nom: utilisateur.status.nom,
        } : undefined,
        age,
        initiales,
      },
    };
  } catch (error) {
    if (error instanceof UtilisateursError) {
      throw error;
    }
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    throw new UtilisateursError(
      'Erreur lors de la modification de l\'utilisateur',
      UtilisateursErrorCode.OPERATION_FAILED
    );
  }
}
