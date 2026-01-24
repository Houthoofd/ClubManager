/**
 * Mutations pour le domaine Inscriptions
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type {
  CoursOperationResult,
  InscriptionUtilisateur,
  ValidationPresence,
  VerificationInscriptionResult
} from '@clubmanager/types';

/**
 * Vérifier si un utilisateur est déjà inscrit à un cours
 */
export async function verifierInscriptionUtilisateur(
  coursId: number,
  utilisateurId: number
): Promise<VerificationInscriptionResult> {
  const inscription = await prisma.inscriptions.findFirst({
    where: {
      cours_id: coursId,
      utilisateur_id: utilisateurId
    },
    include: {
      cours: true
    }
  });

  if (inscription) {
    return {
      isBooked: true,
      message: 'Utilisateur déjà inscrit à ce cours',
      cours: {
        id: inscription.cours.id,
        date_cours: inscription.cours.date_cours,
        type_cours: inscription.cours.type_cours,
        heure_debut: inscription.cours.heure_debut,
        heure_fin: inscription.cours.heure_fin,
        cours_recurrent_id: inscription.cours.cours_recurrent_id
      }
    };
  }

  return {
    isBooked: false,
    message: 'Utilisateur non inscrit à ce cours'
  };
}

/**
 * Inscrire un utilisateur à un cours
 */
export async function inscrireUtilisateurAuCours(
  data: InscriptionUtilisateur
): Promise<CoursOperationResult> {
  try {
    const verification = await verifierInscriptionUtilisateur(data.cours_id, data.utilisateur_id);
    
    if (verification.isBooked) {
      return {
        success: false,
        message: 'Utilisateur déjà inscrit à ce cours'
      };
    }

    const inscription = await prisma.inscriptions.create({
      data: {
        cours_id: data.cours_id,
        utilisateur_id: data.utilisateur_id,
        is_present: null,
        is_validate: null
      },
      include: {
        cours: true,
        utilisateurs: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

    return {
      success: true,
      message: 'Inscription réussie',
      data: inscription
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    return {
      success: false,
      message: `Erreur lors de l'inscription: ${error.message}`
    };
  }
}

/**
 * Désinscrire un utilisateur d'un cours
 */
export async function desinscrireUtilisateurDuCours(
  data: InscriptionUtilisateur
): Promise<CoursOperationResult> {
  try {
    const verification = await verifierInscriptionUtilisateur(data.cours_id, data.utilisateur_id);
    
    if (!verification.isBooked) {
      return {
        success: false,
        message: 'Utilisateur non inscrit à ce cours'
      };
    }

    await prisma.inscriptions.deleteMany({
      where: {
        cours_id: data.cours_id,
        utilisateur_id: data.utilisateur_id
      }
    });

    return {
      success: true,
      message: 'Désinscription réussie'
    };
  } catch (error: any) {
    console.error('Erreur lors de la désinscription:', error);
    return {
      success: false,
      message: `Erreur lors de la désinscription: ${error.message}`
    };
  }
}

/**
 * Valider la présence d'un utilisateur à un cours
 */
export async function validerPresenceUtilisateur(
  data: ValidationPresence
): Promise<CoursOperationResult> {
  try {
    const updated = await prisma.inscriptions.updateMany({
      where: {
        cours_id: data.cours_id,
        utilisateur_id: data.utilisateur_id
      },
      data: {
        is_present: true,
        is_validate: true
      }
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: 'Inscription non trouvée'
      };
    }

    return {
      success: true,
      message: 'Présence validée avec succès'
    };
  } catch (error: any) {
    console.error('Erreur lors de la validation de présence:', error);
    return {
      success: false,
      message: `Erreur lors de la validation: ${error.message}`
    };
  }
}

/**
 * Annuler/Marquer absent un utilisateur pour un cours
 */
export async function annulerPresenceUtilisateur(
  data: ValidationPresence
): Promise<CoursOperationResult> {
  try {
    const updated = await prisma.inscriptions.updateMany({
      where: {
        cours_id: data.cours_id,
        utilisateur_id: data.utilisateur_id
      },
      data: {
        is_present: false,
        is_validate: false
      }
    });

    if (updated.count === 0) {
      return {
        success: false,
        message: 'Inscription non trouvée'
      };
    }

    return {
      success: true,
      message: 'Absence enregistrée avec succès'
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'annulation de présence:', error);
    return {
      success: false,
      message: `Erreur lors de l'annulation: ${error.message}`
    };
  }
}
