/**
 * Resolvers GraphQL pour le module Cours
 *
 * Ce fichier implémente tous les resolvers pour les queries et mutations
 * définies dans cours.typeDefs.ts
 *
 * Architecture:
 * - Utilise getCoursRepository() pour accéder aux données
 * - Gestion d'erreurs complète
 * - Validation des inputs
 * - Field resolvers pour champs calculés
 */

import { getCoursRepository } from '../../db/clients/cours/cours.repository.js';
import type {
  Cours,
  CoursRecurrent,
  JourDeCours,
  UtilisateurParticipant,
  Professeur,
  Semaine,
  InscriptionCours,
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
  DisponibiliteCours,
} from '../../db/clients/cours/types.js';

// ==========================================================================
// TYPES GRAPHQL CONTEXT
// ==========================================================================

interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Valider que l'utilisateur est authentifié
 */
function requireAuth(context: GraphQLContext): void {
  if (!context.user) {
    throw new Error('Authentication required');
  }
}

/**
 * Valider que l'utilisateur est admin
 */
function requireAdmin(context: GraphQLContext): void {
  requireAuth(context);
  if (context.user?.role !== 'admin' && context.user?.role !== 'moderator') {
    throw new Error('Admin privileges required');
  }
}

/**
 * Parser une date ISO string en Date
 */
function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date;
}

/**
 * Formater une réponse de confirmation
 */
function formatConfirmationResult(result: { isConfirm: boolean; message: string; data?: any }) {
  return {
    success: result.isConfirm,
    message: result.message,
    data: result.data ? JSON.stringify(result.data) : null,
  };
}

// ==========================================================================
// RESOLVERS
// ==========================================================================

export const coursResolvers = {
  // ========================================================================
  // QUERIES
  // ========================================================================
  Query: {
    /**
     * Récupérer tous les cours
     */
    cours: async (_parent: any, _args: any, context: GraphQLContext): Promise<Cours[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.findAll();
      } catch (error) {
        console.error('[coursResolvers] Error in cours:', error);
        throw new Error('Failed to fetch courses');
      }
    },

    /**
     * Récupérer un cours par son ID
     */
    coursById: async (_parent: any, args: { id: number }, context: GraphQLContext): Promise<Cours | null> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.findById(args.id);
      } catch (error) {
        console.error('[coursResolvers] Error in coursById:', error);
        throw new Error(`Failed to fetch course with id ${args.id}`);
      }
    },

    /**
     * Récupérer les cours d'une semaine spécifique
     */
    coursParSemaine: async (
      _parent: any,
      args: { semaine: number; annee: number },
      context: GraphQLContext
    ): Promise<Cours[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.findByWeek(args.semaine, args.annee);
      } catch (error) {
        console.error('[coursResolvers] Error in coursParSemaine:', error);
        throw new Error(`Failed to fetch courses for week ${args.semaine}/${args.annee}`);
      }
    },

    /**
     * Récupérer le planning hebdomadaire
     */
    planningHebdomadaire: async (
      _parent: any,
      args: { semaine?: number; annee?: number },
      context: GraphQLContext
    ): Promise<JourDeCours[]> => {
      try {
        const coursRepo = getCoursRepository();

        if (args.semaine && args.annee) {
          return await coursRepo.getJoursDeCoursParSemaine(args.semaine, args.annee);
        }

        return await coursRepo.getJoursDeCours();
      } catch (error) {
        console.error('[coursResolvers] Error in planningHebdomadaire:', error);
        throw new Error('Failed to fetch weekly planning');
      }
    },

    /**
     * Récupérer tous les cours récurrents
     */
    coursRecurrents: async (_parent: any, _args: any, context: GraphQLContext): Promise<CoursRecurrent[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.findAllCoursRecurrents();
      } catch (error) {
        console.error('[coursResolvers] Error in coursRecurrents:', error);
        throw new Error('Failed to fetch recurrent courses');
      }
    },

    /**
     * Récupérer les inscriptions d'un utilisateur
     */
    mesInscriptions: async (
      _parent: any,
      args: { utilisateurId: number },
      context: GraphQLContext
    ): Promise<Cours[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getCoursByUser(args.utilisateurId);
      } catch (error) {
        console.error('[coursResolvers] Error in mesInscriptions:', error);
        throw new Error(`Failed to fetch inscriptions for user ${args.utilisateurId}`);
      }
    },

    /**
     * Récupérer les cours disponibles
     */
    coursDisponibles: async (
      _parent: any,
      args: { utilisateurId: number },
      context: GraphQLContext
    ): Promise<Cours[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getCoursDisponibles();
      } catch (error) {
        console.error('[coursResolvers] Error in coursDisponibles:', error);
        throw new Error('Failed to fetch available courses');
      }
    },

    /**
     * Récupérer les participants d'un cours
     */
    participantsCours: async (
      _parent: any,
      args: { coursId: number },
      context: GraphQLContext
    ): Promise<UtilisateurParticipant[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getParticipantsByCours(args.coursId);
      } catch (error) {
        console.error('[coursResolvers] Error in participantsCours:', error);
        throw new Error(`Failed to fetch participants for course ${args.coursId}`);
      }
    },

    /**
     * Rechercher des cours avec filtres
     */
    searchCours: async (
      _parent: any,
      args: { filters: any },
      context: GraphQLContext
    ): Promise<{ cours: Cours[]; total: number; page: number; totalPages: number }> => {
      try {
        const coursRepo = getCoursRepository();
        const { limit = 20, offset = 0, date_debut, date_fin, avec_places_disponibles } = args.filters;

        let cours: Cours[];

        if (avec_places_disponibles) {
          cours = await coursRepo.getCoursDisponibles();
        } else if (date_debut && date_fin) {
          cours = await coursRepo.findByDateRange(parseDate(date_debut), parseDate(date_fin));
        } else {
          cours = await coursRepo.findAll();
        }

        // Apply filters
        if (args.filters.type_cours) {
          cours = cours.filter((c) => c.type_cours === args.filters.type_cours);
        }
        if (args.filters.actif !== undefined) {
          cours = cours.filter((c) => c.actif === args.filters.actif);
        }

        const total = cours.length;
        const page = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit);
        const paginatedCours = cours.slice(offset, offset + limit);

        return {
          cours: paginatedCours,
          total,
          page,
          totalPages,
        };
      } catch (error) {
        console.error('[coursResolvers] Error in searchCours:', error);
        throw new Error('Failed to search courses');
      }
    },

    /**
     * Vérifier l'inscription d'un utilisateur à un cours
     */
    verifierInscription: async (
      _parent: any,
      args: { utilisateurId: number; coursId: number },
      context: GraphQLContext
    ): Promise<{
      isBooked: boolean;
      isFind: boolean;
      message: string;
      inscriptionId?: number;
      userId?: number;
    }> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.verifierInscription(args.utilisateurId, args.coursId);
      } catch (error) {
        console.error('[coursResolvers] Error in verifierInscription:', error);
        throw new Error('Failed to verify inscription');
      }
    },

    /**
     * Récupérer la disponibilité d'un cours
     */
    disponibiliteCours: async (
      _parent: any,
      args: { coursId: number },
      context: GraphQLContext
    ): Promise<DisponibiliteCours> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.checkCoursDisponibilite(args.coursId);
      } catch (error) {
        console.error('[coursResolvers] Error in disponibiliteCours:', error);
        throw new Error(`Failed to check availability for course ${args.coursId}`);
      }
    },

    /**
     * Récupérer toutes les semaines avec cours
     */
    semainesAvecCours: async (_parent: any, _args: any, context: GraphQLContext): Promise<Semaine[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getSemainesAvecCours();
      } catch (error) {
        console.error('[coursResolvers] Error in semainesAvecCours:', error);
        throw new Error('Failed to fetch weeks with courses');
      }
    },

    /**
     * Récupérer le résumé hebdomadaire
     */
    resumeHebdomadaire: async (
      _parent: any,
      args: { semaine: number; annee: number },
      context: GraphQLContext
    ): Promise<{
      semaine: Semaine | null;
      cours: Cours[];
      total_cours: number;
      total_participants: number;
    }> => {
      try {
        const coursRepo = getCoursRepository();
        const semaine = await coursRepo.getSemaineInfo(args.semaine, args.annee);
        const cours = await coursRepo.findByWeek(args.semaine, args.annee);
        const total_cours = cours.length;
        const total_participants = await coursRepo.countTotalParticipants();

        return {
          semaine,
          cours,
          total_cours,
          total_participants,
        };
      } catch (error) {
        console.error('[coursResolvers] Error in resumeHebdomadaire:', error);
        throw new Error(`Failed to fetch weekly summary for week ${args.semaine}/${args.annee}`);
      }
    },

    /**
     * Statistiques de présence pour un cours
     */
    statistiquesCours: async (
      _parent: any,
      args: { coursId: number },
      context: GraphQLContext
    ): Promise<StatistiquesPresenceCours | null> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getStatistiquesPresenceCours(args.coursId);
      } catch (error) {
        console.error('[coursResolvers] Error in statistiquesCours:', error);
        throw new Error(`Failed to fetch statistics for course ${args.coursId}`);
      }
    },

    /**
     * Statistiques de présence pour un utilisateur
     */
    statistiquesUtilisateur: async (
      _parent: any,
      args: { utilisateurId: number },
      context: GraphQLContext
    ): Promise<StatistiquesPresenceUtilisateur | null> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getStatistiquesPresenceUtilisateur(args.utilisateurId);
      } catch (error) {
        console.error('[coursResolvers] Error in statistiquesUtilisateur:', error);
        throw new Error(`Failed to fetch statistics for user ${args.utilisateurId}`);
      }
    },

    /**
     * Statistiques globales de présence
     */
    statistiquesGlobales: async (
      _parent: any,
      _args: any,
      context: GraphQLContext
    ): Promise<StatistiquesPresenceCours[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getStatistiquesGlobales();
      } catch (error) {
        console.error('[coursResolvers] Error in statistiquesGlobales:', error);
        throw new Error('Failed to fetch global statistics');
      }
    },
  },

  // ========================================================================
  // MUTATIONS
  // ========================================================================
  Mutation: {
    /**
     * Créer un cours récurrent
     */
    ajouterCoursRecurrent: async (
      _parent: any,
      args: { data: any },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const { jour_semaine, type_cours, heure_debut, heure_fin, date_debut, date_fin, professeurs } = args.data;

        // Validation
        const validation = await coursRepo.validateCoursRecurrent(
          jour_semaine.toString(),
          heure_debut,
          heure_fin,
          type_cours,
          20 // Default capacity
        );

        if (!validation.valid) {
          return {
            success: false,
            message: validation.errors.join(', '),
          };
        }

        // Créer le cours récurrent
        const result = await coursRepo.createCoursRecurrent({
          jour_semaine,
          type_cours,
          heure_debut,
          heure_fin,
          date_debut: date_debut ? parseDate(date_debut) : undefined,
          date_fin: date_fin ? parseDate(date_fin) : undefined,
        });

        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in ajouterCoursRecurrent:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create recurrent course',
        };
      }
    },

    /**
     * Modifier un cours récurrent
     */
    modifierCoursRecurrent: async (
      _parent: any,
      args: { id: number; data: any },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.updateCoursRecurrent(args.id, args.data);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in modifierCoursRecurrent:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update recurrent course',
        };
      }
    },

    /**
     * Supprimer un cours récurrent
     */
    supprimerCoursRecurrent: async (
      _parent: any,
      args: { id: number },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.softDeleteCoursRecurrent(args.id);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in supprimerCoursRecurrent:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete recurrent course',
        };
      }
    },

    /**
     * Créer un cours ponctuel
     */
    ajouterCours: async (
      _parent: any,
      args: { data: any },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const { date_cours, type_cours, heure_debut, heure_fin, capacite_max, description, professeurs } = args.data;

        // Créer le cours
        const result = await coursRepo.createCours({
          date_cours: parseDate(date_cours),
          type_cours,
          heure_debut,
          heure_fin,
          capacite_max: capacite_max || 20,
          description,
        });

        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in ajouterCours:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create course',
        };
      }
    },

    /**
     * Modifier un cours
     */
    modifierCours: async (
      _parent: any,
      args: { id: number; data: any },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();

        const updateData: any = { ...args.data };
        if (updateData.date_cours) {
          updateData.date_cours = parseDate(updateData.date_cours);
        }

        const result = await coursRepo.updateCours(args.id, updateData);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in modifierCours:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update course',
        };
      }
    },

    /**
     * Supprimer un cours
     */
    supprimerCours: async (
      _parent: any,
      args: { id: number },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.softDeleteCours(args.id);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in supprimerCours:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete course',
        };
      }
    },

    /**
     * Inscrire un utilisateur à un cours
     */
    inscrireUtilisateur: async (
      _parent: any,
      args: { utilisateurId: number; coursId: number; notes?: string },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAuth(context);

      try {
        const coursRepo = getCoursRepository();

        // Validation
        const validation = await coursRepo.validateInscription(args.utilisateurId, args.coursId);

        if (!validation.valid) {
          return {
            success: false,
            message: validation.errors.join(', '),
          };
        }

        // Inscrire
        const result = await coursRepo.inscrireUtilisateur(args.utilisateurId, args.coursId);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in inscrireUtilisateur:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to register user',
        };
      }
    },

    /**
     * Désinscrire un utilisateur d'un cours
     */
    desinscrireUtilisateur: async (
      _parent: any,
      args: { inscriptionId: number },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAuth(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.desinscrireUtilisateur(args.inscriptionId);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in desinscrireUtilisateur:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to unregister user',
        };
      }
    },

    /**
     * Marquer la présence d'un utilisateur
     */
    marquerPresence: async (
      _parent: any,
      args: { inscriptionId: number; present: boolean },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();

        // Get inscription to get user and course IDs
        const inscription = await coursRepo.getInscriptionById(args.inscriptionId);
        if (!inscription) {
          return {
            success: false,
            message: 'Inscription not found',
          };
        }

        const result = await coursRepo.marquerPresence(
          inscription.utilisateur_id,
          inscription.cours_id,
          args.present
        );
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in marquerPresence:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to mark presence',
        };
      }
    },

    /**
     * Valider la présence d'un utilisateur (marquer présent)
     */
    validerPresence: async (
      _parent: any,
      args: { inscriptionId: number },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.validerPresence(args.inscriptionId);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in validerPresence:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to validate presence',
        };
      }
    },

    /**
     * Annuler la présence d'un utilisateur (marquer absent)
     */
    annulerPresence: async (
      _parent: any,
      args: { inscriptionId: number },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();
        const result = await coursRepo.annulerPresence(args.inscriptionId);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in annulerPresence:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to cancel presence',
        };
      }
    },

    /**
     * Associer des professeurs à un cours récurrent
     */
    associerProfesseurs: async (
      _parent: any,
      args: { coursRecurrentId: number; professeurs: string[] },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();

        // Convert professor names to IDs
        const professeurIds: number[] = [];
        for (const profName of args.professeurs) {
          const [prenom, ...nomParts] = profName.split(' ');
          const nom = nomParts.join(' ');

          let professeur = await coursRepo.findProfesseurByName(nom, prenom);

          if (!professeur) {
            // Create professor if doesn't exist
            const createResult = await coursRepo.createProfesseur(nom, prenom);
            if (createResult.isConfirm && createResult.data) {
              professeurIds.push(createResult.data.id);
            }
          } else {
            professeurIds.push(professeur.id);
          }
        }

        const result = await coursRepo.associerProfesseurs(args.coursRecurrentId, professeurIds);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in associerProfesseurs:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to associate professors',
        };
      }
    },

    /**
     * Supprimer un professeur d'un cours récurrent
     */
    supprimerProfesseur: async (
      _parent: any,
      args: { coursRecurrentId: number; professeurNom: string },
      context: GraphQLContext
    ): Promise<{ success: boolean; message: string; data?: string }> => {
      requireAdmin(context);

      try {
        const coursRepo = getCoursRepository();

        // Find professor by name
        const [prenom, ...nomParts] = args.professeurNom.split(' ');
        const nom = nomParts.join(' ');

        const professeur = await coursRepo.findProfesseurByName(nom, prenom);

        if (!professeur) {
          return {
            success: false,
            message: 'Professor not found',
          };
        }

        const result = await coursRepo.deleteProfesseurFromCoursRecurrent(args.coursRecurrentId, professeur.id);
        return formatConfirmationResult(result);
      } catch (error) {
        console.error('[coursResolvers] Error in supprimerProfesseur:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to remove professor',
        };
      }
    },
  },

  // ========================================================================
  // FIELD RESOLVERS
  // ========================================================================

  /**
   * Field resolvers pour le type Cours
   */
  Cours: {
    /**
     * Résoudre le champ professeurs
     */
    professeurs: async (parent: Cours, _args: any, context: GraphQLContext): Promise<Professeur[]> => {
      try {
        if (parent.professeurs && parent.professeurs.length > 0) {
          return parent.professeurs;
        }
        return [];
      } catch (error) {
        console.error('[coursResolvers] Error resolving professeurs:', error);
        return [];
      }
    },

    /**
     * Résoudre le champ participants
     */
    participants: async (parent: Cours, _args: any, context: GraphQLContext): Promise<UtilisateurParticipant[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getParticipantsByCours(parent.id);
      } catch (error) {
        console.error('[coursResolvers] Error resolving participants:', error);
        return [];
      }
    },

    /**
     * Résoudre le champ places_disponibles
     */
    places_disponibles: async (parent: Cours, _args: any, context: GraphQLContext): Promise<number | null> => {
      try {
        if (!parent.capacite_max) return null;

        const coursRepo = getCoursRepository();
        const count = await coursRepo.countInscriptionsByCours(parent.id);
        return parent.capacite_max - count;
      } catch (error) {
        console.error('[coursResolvers] Error resolving places_disponibles:', error);
        return null;
      }
    },

    /**
     * Résoudre le champ complet
     */
    complet: async (parent: Cours, _args: any, context: GraphQLContext): Promise<boolean> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.checkCoursIsFull(parent.id);
      } catch (error) {
        console.error('[coursResolvers] Error resolving complet:', error);
        return false;
      }
    },
  },

  /**
   * Field resolvers pour le type CoursRecurrent
   */
  CoursRecurrent: {
    /**
     * Résoudre le champ professeurs
     */
    professeurs: async (parent: CoursRecurrent, _args: any, context: GraphQLContext): Promise<Professeur[]> => {
      try {
        const coursRepo = getCoursRepository();
        return await coursRepo.getProfesseursByCoursRecurrent(parent.id);
      } catch (error) {
        console.error('[coursResolvers] Error resolving professeurs for CoursRecurrent:', error);
        return [];
      }
    },
  },
};

export default coursResolvers;
