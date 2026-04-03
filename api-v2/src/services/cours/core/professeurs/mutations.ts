/**
 * Mutations pour le domaine Professeurs
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type {
  CoursOperationResult,
  SuppressionProfesseurs,
  CoursContext
} from '@clubmanager/types';
import { jourVersNumero } from '../helpers.js';

/**
 * Associer des professeurs à un cours récurrent
 */
export async function associerProfesseursAuCoursRecurrent(
  coursRecurrentId: number,
  professeursNoms: string[]
): Promise<CoursOperationResult> {
  try {
    if (professeursNoms.length === 0) {
      return {
        success: true,
        message: 'Aucun professeur à associer'
      };
    }

    const professeurs = await prisma.professeurs.findMany({
      where: {
        OR: professeursNoms.map((nom: string) => {
          const parts = nom.trim().split(' ');
          if (parts.length === 2) {
            return {
              AND: [
                { prenom: parts[0] },
                { nom: parts[1] }
              ]
            };
          }
          return { nom: nom };
        }),
        status_id: 5
      },
      select: {
        id: true,
        prenom: true,
        nom: true
      }
    });

    if (professeurs.length === 0) {
      return {
        success: false,
        message: 'Aucun professeur trouvé avec ces noms'
      };
    }

    const associations = professeurs.map((prof: any) => ({
      cours_recurrent_id: coursRecurrentId,
      professeur_id: prof.id
    }));

    await prisma.cours_recurrent_professeur.createMany({
      data: associations,
      skipDuplicates: true
    });

    return {
      success: true,
      message: `${professeurs.length} professeur(s) associé(s) avec succès`,
      data: professeurs
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'association des professeurs:', error);
    return {
      success: false,
      message: `Erreur lors de l'association: ${error.message}`
    };
  }
}

/**
 * Supprimer des professeurs d'un cours récurrent
 */
export async function supprimerProfesseursParNomEtJour(
  data: SuppressionProfesseurs
): Promise<CoursOperationResult> {
  try {
    const jourNum = jourVersNumero(data.jour);
    
    if (!jourNum) {
      return {
        success: false,
        message: 'Jour de la semaine invalide'
      };
    }

    const whereClause: any = {
      jour_semaine: jourNum
    };

    if (data.cours_context?.type_cours) {
      whereClause.type_cours = data.cours_context.type_cours;
    }
    if (data.cours_context?.heure_debut) {
      whereClause.heure_debut = data.cours_context.heure_debut;
    }
    if (data.cours_context?.heure_fin) {
      whereClause.heure_fin = data.cours_context.heure_fin;
    }

    const coursRecurrents = await prisma.cours_recurrent.findMany({
      where: whereClause,
      include: {
        cours_recurrent_professeur: {
          include: {
            professeurs: true
          }
        }
      }
    });

    if (coursRecurrents.length === 0) {
      return {
        success: false,
        message: 'Aucun cours récurrent trouvé avec ces critères'
      };
    }

    if (coursRecurrents.length > 1) {
      return {
        success: false,
        message: `${coursRecurrents.length} cours trouvés. Veuillez être plus spécifique (type_cours, horaires).`
      };
    }

    const coursRecurrent = coursRecurrents[0];

    const professeurs = await prisma.professeurs.findMany({
      where: {
        OR: data.professeurs_noms.map((nom: string) => {
          const parts = nom.trim().split(' ');
          if (parts.length === 2) {
            return {
              AND: [
                { prenom: parts[0] },
                { nom: parts[1] }
              ]
            };
          }
          return { nom: nom };
        })
      },
      select: {
        id: true,
        prenom: true,
        nom: true
      }
    });

    if (professeurs.length === 0) {
      return {
        success: false,
        message: 'Aucun professeur trouvé avec ces noms'
      };
    }

    const professeurIds = professeurs.map((p: any) => p.id);

    const result = await prisma.cours_recurrent_professeur.deleteMany({
      where: {
        cours_recurrent_id: coursRecurrent.id,
        professeur_id: {
          in: professeurIds
        }
      }
    });

    return {
      success: true,
      message: `${result.count} professeur(s) retiré(s) du cours ${coursRecurrent.type_cours}`,
      data: {
        cours_recurrent_id: coursRecurrent.id,
        professeurs_retires: result.count
      }
    };
  } catch (error: any) {
    console.error('Erreur lors de la suppression des professeurs:', error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${error.message}`
    };
  }
}

/**
 * Trouver automatiquement le cours contenant un professeur
 */
export async function trouverCoursAvecProfesseur(
  professeurNom: string,
  jour: string
): Promise<CoursContext | null> {
  try {
    const jourNum = jourVersNumero(jour);
    
    if (!jourNum) {
      return null;
    }

    const parts = professeurNom.trim().split(' ');
    const whereClause: any = parts.length === 2
      ? {
          AND: [
            { prenom: parts[0] },
            { nom: parts[1] }
          ]
        }
      : { nom: professeurNom };

    const professeur = await prisma.professeurs.findFirst({
      where: whereClause,
      include: {
        cours_recurrent_professeur: {
          include: {
            cours_recurrent: true
          },
          where: {
            cours_recurrent: {
              jour_semaine: jourNum
            }
          }
        }
      }
    });

    if (!professeur || professeur.cours_recurrent_professeur.length === 0) {
      return null;
    }

    const cr = professeur.cours_recurrent_professeur[0].cours_recurrent;
    return {
      type_cours: cr.type_cours,
      heure_debut: cr.heure_debut.substring(0, 5),
      heure_fin: cr.heure_fin.substring(0, 5)
    };
  } catch (error) {
    console.error('Erreur lors de la recherche du cours:', error);
    return null;
  }
}

/**
 * Supprimer des professeurs avec résolution automatique du cours
 */
export async function supprimerProfesseursAvecResolution(
  professeursNoms: string[],
  jour: string,
  coursContext?: CoursContext
): Promise<CoursOperationResult> {
  if (!coursContext?.type_cours && !coursContext?.heure_debut && !coursContext?.heure_fin) {
    const contexteTrouve = await trouverCoursAvecProfesseur(professeursNoms[0], jour);
    
    if (contexteTrouve) {
      return supprimerProfesseursParNomEtJour({
        professeurs_noms: professeursNoms,
        jour,
        cours_context: contexteTrouve
      });
    } else {
      return {
        success: false,
        message: `Le professeur ${professeursNoms[0]} n'est associé à aucun cours du ${jour}`
      };
    }
  }

  return supprimerProfesseursParNomEtJour({
    professeurs_noms: professeursNoms,
    jour,
    cours_context: coursContext
  });
}
