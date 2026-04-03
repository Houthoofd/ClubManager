/**
 * Mutations pour le domaine Cours Récurrents
 */

import { prisma as defaultPrisma } from '../../../../infrastructure/database/prisma-client.js';
import type {
  CoursOperationResult,
  AjoutCoursRecurrent,
  ModificationCoursRecurrent
} from '@clubmanager/types';
import {
  jourVersNumero,
  calculerDateDebut,
  calculerDateFin
} from '../helpers.js';
import { associerProfesseursAuCoursRecurrent } from '../professeurs/mutations.js';

/**
 * Ajouter un cours récurrent avec génération des cours hebdomadaires
 */
export async function ajouterCoursRecurrent(
  data: AjoutCoursRecurrent,
  prisma = defaultPrisma
): Promise<CoursOperationResult> {
  try {
    const jourSemaine = jourVersNumero(data.jour_semaine);
    
    if (!jourSemaine) {
      return {
        success: false,
        message: 'Jour de la semaine invalide'
      };
    }

    const coursRecurrent = await prisma.cours_recurrent.create({
      data: {
        type_cours: data.type_cours,
        jour_semaine: jourSemaine,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin
      }
    });

    const startDate = calculerDateDebut(jourSemaine);
    const endDate = calculerDateFin(startDate);

    const coursACreer = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      coursACreer.push({
        date_cours: new Date(currentDate),
        type_cours: data.type_cours,
        heure_debut: data.heure_debut,
        heure_fin: data.heure_fin,
        cours_recurrent_id: coursRecurrent.id
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }

    await prisma.cours.createMany({
      data: coursACreer
    });

    if (data.professeurs && data.professeurs.length > 0) {
      const result = await associerProfesseursAuCoursRecurrent(
        coursRecurrent.id,
        data.professeurs,
        prisma
      );
      
      if (!result.success) {
        console.warn('Avertissement lors de l\'association des professeurs:', result.message);
      }
    }

    return {
      success: true,
      message: `Cours récurrent créé avec ${coursACreer.length} occurrences`,
      data: {
        cours_recurrent_id: coursRecurrent.id,
        occurrences_creees: coursACreer.length
      }
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout du cours récurrent:', error);
    return {
      success: false,
      message: `Erreur lors de l'ajout: ${error.message}`
    };
  }
}

/**
 * Modifier un cours récurrent (et ses occurrences futures)
 */
export async function modifierCoursRecurrent(
  data: ModificationCoursRecurrent,
  prisma = defaultPrisma
): Promise<CoursOperationResult> {
  try {
    const updateData: any = {};
    
    if (data.type_cours) {
      updateData.type_cours = data.type_cours;
    }
    
    if (data.jour_semaine) {
      const jourSemaine = jourVersNumero(data.jour_semaine);
      if (!jourSemaine) {
        return {
          success: false,
          message: 'Jour de la semaine invalide'
        };
      }
      updateData.jour_semaine = jourSemaine;
    }
    
    if (data.heure_debut) {
      updateData.heure_debut = data.heure_debut;
    }
    
    if (data.heure_fin) {
      updateData.heure_fin = data.heure_fin;
    }

    const coursRecurrent = await prisma.cours_recurrent.update({
      where: { id: data.cours_recurrent_id },
      data: updateData
    });

    const coursUpdateData: any = {};
    if (data.type_cours) coursUpdateData.type_cours = data.type_cours;
    if (data.heure_debut) coursUpdateData.heure_debut = data.heure_debut;
    if (data.heure_fin) coursUpdateData.heure_fin = data.heure_fin;

    if (Object.keys(coursUpdateData).length > 0) {
      await prisma.cours.updateMany({
        where: {
          cours_recurrent_id: data.cours_recurrent_id,
          date_cours: {
            gte: new Date()
          }
        },
        data: coursUpdateData
      });
    }

    if (data.professeurs && data.professeurs.length > 0) {
      await prisma.cours_recurrent_professeur.deleteMany({
        where: {
          cours_recurrent_id: data.cours_recurrent_id
        }
      });
      
      const result = await associerProfesseursAuCoursRecurrent(
        data.cours_recurrent_id,
        data.professeurs,
        prisma
      );
      
      if (!result.success) {
        console.warn('Avertissement lors de la mise à jour des professeurs:', result.message);
      }
    }

    return {
      success: true,
      message: 'Cours récurrent modifié avec succès',
      data: coursRecurrent
    };
  } catch (error: any) {
    console.error('Erreur lors de la modification du cours récurrent:', error);
    return {
      success: false,
      message: `Erreur lors de la modification: ${error.message}`
    };
  }
}

/**
 * Supprimer un cours récurrent et toutes ses occurrences futures
 */
export async function supprimerCoursRecurrent(
  coursRecurrentId: number,
  prisma = defaultPrisma
): Promise<CoursOperationResult> {
  try {
    await prisma.inscriptions.deleteMany({
      where: {
        cours: {
          cours_recurrent_id: coursRecurrentId,
          date_cours: {
            gte: new Date()
          }
        }
      }
    });

    await prisma.cours.deleteMany({
      where: {
        cours_recurrent_id: coursRecurrentId,
        date_cours: {
          gte: new Date()
        }
      }
    });

    await prisma.cours_recurrent_professeur.deleteMany({
      where: {
        cours_recurrent_id: coursRecurrentId
      }
    });

    await prisma.cours_recurrent.delete({
      where: { id: coursRecurrentId }
    });

    return {
      success: true,
      message: 'Cours récurrent supprimé avec succès'
    };
  } catch (error: any) {
    console.error('Erreur lors de la suppression du cours récurrent:', error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${error.message}`
    };
  }
}

/**
 * Supprimer un cours récurrent par jour de semaine
 */
export async function supprimerCoursRecurrentParJour(
  jour: string,
  prisma = defaultPrisma
): Promise<CoursOperationResult> {
  try {
    const jourNum = jourVersNumero(jour);
    
    if (!jourNum) {
      return {
        success: false,
        message: 'Jour de la semaine invalide'
      };
    }

    const coursRecurrent = await prisma.cours_recurrent.findFirst({
      where: { jour_semaine: jourNum }
    });

    if (!coursRecurrent) {
      return {
        success: false,
        message: 'Aucun cours récurrent trouvé pour ce jour'
      };
    }

    return await supprimerCoursRecurrent(coursRecurrent.id, prisma);
  } catch (error: any) {
    console.error('Erreur lors de la suppression par jour:', error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${error.message}`
    };
  }
}
