/**
 * GraphQL Schema et Resolvers pour le module Inscription
 * Gère les cours, inscriptions, présences et professeurs
 */

import { gql } from 'graphql-tag';
import { getInscriptionRepository } from './inscription.repository.js';
import type {
  Cours,
  CoursRecurrent,
  Inscription,
  UtilisateurInscrit,
  Professeur,
  JourDeCours,
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
} from './types/index.js';

// ============================================================================
// SCHEMA GRAPHQL
// ============================================================================

export const typeDefs = gql`
  # ============================================================================
  # TYPES
  # ============================================================================

  """
  Un cours (instance spécifique à une date)
  """
  type Cours {
    id: ID!
    date_cours: String!
    jour_cours: String
    jour_semaine: Int
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    cours_recurrent_id: ID
    professeurs: [Professeur!]
    utilisateurs: [UtilisateurInscrit!]
    nombre_inscrits: Int
    created_at: String
    updated_at: String
  }

  """
  Un cours récurrent (modèle hebdomadaire)
  """
  type CoursRecurrent {
    id: ID!
    jour_semaine: Int!
    jour_nom: String!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    date_debut: String!
    date_fin: String
    professeurs: [Professeur!]
    nombre_cours_generes: Int
    created_at: String
    updated_at: String
  }

  """
  Jour de cours avec informations complètes
  """
  type JourDeCours {
    id: ID
    jour: String!
    jour_semaine: Int
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    professeurs: [String!]!
    date_debut: String
    date_fin: String
  }

  """
  Une inscription d'un utilisateur à un cours
  """
  type Inscription {
    id: ID!
    cours_id: ID!
    utilisateur_id: ID!
    cours: Cours
    date_inscription: String!
    presence: PresenceStatus
    est_valide: Boolean!
    created_at: String
    updated_at: String
  }

  """
  Un utilisateur inscrit avec son statut de présence
  """
  type UtilisateurInscrit {
    id: ID!
    nom: String!
    prenom: String!
    email: String
    presence: PresenceStatus
    date_inscription: String
    est_valide: Boolean
  }

  """
  Un professeur
  """
  type Professeur {
    id: ID!
    nom: String!
    prenom: String!
    email: String
  }

  """
  Semaine avec cours
  """
  type SemaineAvecCours {
    numero_semaine: Int!
    annee: Int!
    date_debut: String!
    date_fin: String!
    nombre_cours: Int!
  }

  """
  Statistiques de présence pour un cours
  """
  type StatistiquesPresenceCours {
    cours_id: ID!
    date_cours: String!
    type_cours: String!
    total_inscrits: Int!
    presents: Int!
    absents: Int!
    en_attente: Int!
    taux_presence: Float!
  }

  """
  Statistiques de présence pour un utilisateur
  """
  type StatistiquesPresenceUtilisateur {
    utilisateur_id: ID!
    nom: String!
    prenom: String!
    total_cours: Int!
    presents: Int!
    absents: Int!
    en_attente: Int!
    taux_presence: Float!
  }

  """
  Résultat de vérification d'inscription
  """
  type VerificationInscription {
    isBooked: Boolean!
    isFind: Boolean!
    message: String!
    data: InscriptionData
  }

  """
  Données d'inscription
  """
  type InscriptionData {
    inscriptionId: ID
    userId: ID
    coursId: ID
    presence: String
    est_valide: Boolean
  }

  """
  Résultat de mutation
  """
  type MutationResult {
    success: Boolean!
    message: String!
    id: ID
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  """
  Status de présence d'un utilisateur
  """
  enum PresenceStatus {
    present
    absent
    en_attente
  }

  """
  Jour de la semaine
  """
  enum JourSemaine {
    dimanche
    lundi
    mardi
    mercredi
    jeudi
    vendredi
    samedi
  }

  # ============================================================================
  # INPUTS
  # ============================================================================

  """
  Input pour créer un cours
  """
  input CreateCoursInput {
    date_cours: String!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    professeurs: [String!]
  }

  """
  Input pour créer un cours récurrent
  """
  input CreateCoursRecurrentInput {
    jour: JourSemaine!
    type_cours: String!
    heure_debut: String!
    heure_fin: String!
    date_debut: String
    date_fin: String
    professeurs: [String!]
  }

  """
  Input pour modifier un cours récurrent
  """
  input UpdateCoursRecurrentInput {
    id: ID!
    jour: JourSemaine
    type_cours: String
    heure_debut: String
    heure_fin: String
    date_fin: String
    professeurs: [String!]
  }

  """
  Input pour créer une inscription
  """
  input CreateInscriptionInput {
    cours_id: ID!
    utilisateur_id: ID!
    presence: PresenceStatus
    est_valide: Boolean
  }

  """
  Input pour mettre à jour la présence
  """
  input UpdatePresenceInput {
    inscription_id: ID!
    presence: PresenceStatus!
  }

  """
  Filtres pour rechercher des cours
  """
  input CoursFilterInput {
    date_debut: String
    date_fin: String
    type_cours: String
    jour_semaine: Int
    utilisateur_id: ID
  }

  """
  Options pour les statistiques
  """
  input StatistiquesInput {
    date_debut: String!
    date_fin: String!
    type_cours: String
    utilisateur_id: ID
    cours_id: ID
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    """
    Récupérer tous les cours
    """
    cours(id: ID!): Cours

    """
    Récupérer tous les cours
    """
    allCours: [Cours!]!

    """
    Rechercher des cours avec filtres
    """
    searchCours(filters: CoursFilterInput!): [Cours!]!

    """
    Récupérer les cours d'un participant
    """
    coursByParticipant(utilisateur_id: ID!): [Cours!]!

    """
    Récupérer les cours d'une semaine
    """
    coursBySemaine(annee: Int!, numero_semaine: Int!): [Cours!]!

    """
    Récupérer les cours par date
    """
    coursByDate(date: String!): [Cours!]!

    """
    Récupérer les cours par plage de dates
    """
    coursByDateRange(date_debut: String!, date_fin: String!): [Cours!]!

    """
    Récupérer tous les cours récurrents
    """
    allCoursRecurrents: [CoursRecurrent!]!

    """
    Récupérer un cours récurrent par ID
    """
    coursRecurrent(id: ID!): CoursRecurrent

    """
    Récupérer les jours de cours
    """
    joursDeCours: [JourDeCours!]!

    """
    Récupérer les semaines avec cours
    """
    semainesAvecCours: [SemaineAvecCours!]!

    """
    Récupérer les inscriptions d'un cours
    """
    inscriptionsByCours(cours_id: ID!): [Inscription!]!

    """
    Récupérer une inscription par ID
    """
    inscription(id: ID!): Inscription

    """
    Vérifier si un utilisateur est inscrit à un cours
    """
    verifyInscription(cours_id: ID!, utilisateur_id: ID!): VerificationInscription!

    """
    Récupérer les utilisateurs d'un cours
    """
    utilisateursByCours(cours_id: ID!): [UtilisateurInscrit!]!

    """
    Récupérer les cours inscrits d'un utilisateur
    """
    coursInscritsByUtilisateur(utilisateur_id: ID!): [Cours!]!

    """
    Récupérer les professeurs d'un cours
    """
    professeursByCours(cours_id: ID!): [Professeur!]!

    """
    Statistiques de présence par cours
    """
    statsPresenceByCours(input: StatistiquesInput!): [StatistiquesPresenceCours!]!

    """
    Statistiques de présence par utilisateur
    """
    statsPresenceByUtilisateur(input: StatistiquesInput!): [StatistiquesPresenceUtilisateur!]!

    """
    Compter les inscriptions d'un cours
    """
    countInscriptionsByCours(cours_id: ID!): Int!

    """
    Compter les cours d'un utilisateur
    """
    countCoursByUtilisateur(utilisateur_id: ID!): Int!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    """
    Créer un nouveau cours
    """
    createCours(input: CreateCoursInput!): MutationResult!

    """
    Créer un cours récurrent
    """
    createCoursRecurrent(input: CreateCoursRecurrentInput!): MutationResult!

    """
    Modifier un cours récurrent
    """
    updateCoursRecurrent(input: UpdateCoursRecurrentInput!): MutationResult!

    """
    Supprimer un cours récurrent
    """
    deleteCoursRecurrent(id: ID!): MutationResult!

    """
    Terminer un cours récurrent (soft delete)
    """
    terminateCoursRecurrent(id: ID!, date_fin: String!): MutationResult!

    """
    Inscrire un utilisateur à un cours
    """
    inscrire(input: CreateInscriptionInput!): MutationResult!

    """
    Désinscrire un utilisateur d'un cours
    """
    desinscrire(cours_id: ID!, utilisateur_id: ID!): MutationResult!

    """
    Mettre à jour la présence
    """
    updatePresence(input: UpdatePresenceInput!): MutationResult!

    """
    Valider une inscription (marquer présent)
    """
    validerInscription(cours_id: ID!, utilisateur_id: ID!): MutationResult!

    """
    Annuler une inscription (marquer absent)
    """
    annulerInscription(cours_id: ID!, utilisateur_id: ID!): MutationResult!

    """
    Supprimer une inscription
    """
    deleteInscription(id: ID!): MutationResult!

    """
    Supprimer un cours
    """
    deleteCours(id: ID!): MutationResult!
  }
`;

// ============================================================================
// RESOLVERS
// ============================================================================

export const resolvers = {
  // ==========================================================================
  // QUERIES
  // ==========================================================================
  Query: {
    cours: async (_: any, { id }: { id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursById(id);
    },

    allCours: async () => {
      const repo = getInscriptionRepository();
      return await repo.findAllCours();
    },

    searchCours: async (_: any, { filters }: { filters: any }) => {
      const repo = getInscriptionRepository();
      if (filters.date_debut && filters.date_fin) {
        return await repo.searchCoursByDateRange(filters.date_debut, filters.date_fin);
      }
      return await repo.findAllCours();
    },

    coursByParticipant: async (_: any, { utilisateur_id }: { utilisateur_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursByParticipant(utilisateur_id);
    },

    coursBySemaine: async (_: any, { annee, numero_semaine }: { annee: number; numero_semaine: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursBySemaine(annee, numero_semaine);
    },

    coursByDate: async (_: any, { date }: { date: string }) => {
      const repo = getInscriptionRepository();
      return await repo.searchCoursByDate(date);
    },

    coursByDateRange: async (_: any, { date_debut, date_fin }: { date_debut: string; date_fin: string }) => {
      const repo = getInscriptionRepository();
      return await repo.searchCoursByDateRange(date_debut, date_fin);
    },

    allCoursRecurrents: async () => {
      const repo = getInscriptionRepository();
      return await repo.findAllCoursRecurrents();
    },

    coursRecurrent: async (_: any, { id }: { id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursRecurrentById(id);
    },

    joursDeCours: async () => {
      const repo = getInscriptionRepository();
      return await repo.findJoursDeCours();
    },

    semainesAvecCours: async () => {
      const repo = getInscriptionRepository();
      return await repo.findSemainesAvecCours();
    },

    inscriptionsByCours: async (_: any, { cours_id }: { cours_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findInscriptionsByCours(cours_id);
    },

    inscription: async (_: any, { id }: { id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findInscriptionById(id);
    },

    verifyInscription: async (_: any, { cours_id, utilisateur_id }: { cours_id: number; utilisateur_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.verifyInscription(cours_id, utilisateur_id);
    },

    utilisateursByCours: async (_: any, { cours_id }: { cours_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findUtilisateursByCours(cours_id);
    },

    coursInscritsByUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursInscritsByUtilisateur(utilisateur_id);
    },

    professeursByCours: async (_: any, { cours_id }: { cours_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.findProfesseursByCours(cours_id);
    },

    statsPresenceByCours: async (_: any, { input }: { input: any }) => {
      const repo = getInscriptionRepository();
      return await repo.getStatistiquesPresenceByCours(input.date_debut, input.date_fin);
    },

    statsPresenceByUtilisateur: async (_: any, { input }: { input: any }) => {
      const repo = getInscriptionRepository();
      return await repo.getStatistiquesPresenceByUtilisateur(input.date_debut, input.date_fin);
    },

    countInscriptionsByCours: async (_: any, { cours_id }: { cours_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.countInscriptionsByCours(cours_id);
    },

    countCoursByUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }) => {
      const repo = getInscriptionRepository();
      return await repo.countCoursByUtilisateur(utilisateur_id);
    },
  },

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================
  Mutation: {
    createCours: async (_: any, { input }: { input: any }) => {
      try {
        const repo = getInscriptionRepository();
        const id = await repo.createCours(input);
        return {
          success: true,
          message: 'Cours créé avec succès',
          id: id.toString(),
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la création du cours',
        };
      }
    },

    createCoursRecurrent: async (_: any, { input }: { input: any }) => {
      try {
        const repo = getInscriptionRepository();
        const id = await repo.createCoursRecurrent(input);

        // Associer les professeurs si fournis
        if (input.professeurs && input.professeurs.length > 0) {
          await repo.associateProfesseursToCoursRecurrent(id, input.professeurs);
        }

        return {
          success: true,
          message: 'Cours récurrent créé avec succès',
          id: id.toString(),
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la création du cours récurrent',
        };
      }
    },

    updateCoursRecurrent: async (_: any, { input }: { input: any }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.updateCoursRecurrent(input);

        // Mettre à jour les professeurs si fournis
        if (input.professeurs) {
          await repo.deleteProfesseursFromCoursRecurrent(input.id);
          if (input.professeurs.length > 0) {
            await repo.associateProfesseursToCoursRecurrent(input.id, input.professeurs);
          }
        }

        return {
          success,
          message: success ? 'Cours récurrent modifié avec succès' : 'Cours récurrent non trouvé',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la modification du cours récurrent',
        };
      }
    },

    deleteCoursRecurrent: async (_: any, { id }: { id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.deleteCoursRecurrent(id);
        return {
          success,
          message: success ? 'Cours récurrent supprimé avec succès' : 'Cours récurrent non trouvé',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la suppression du cours récurrent',
        };
      }
    },

    terminateCoursRecurrent: async (_: any, { id, date_fin }: { id: number; date_fin: string }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.softDeleteCoursRecurrent(id, date_fin);
        return {
          success,
          message: success ? 'Cours récurrent terminé avec succès' : 'Cours récurrent non trouvé',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la terminaison du cours récurrent',
        };
      }
    },

    inscrire: async (_: any, { input }: { input: any }) => {
      try {
        const repo = getInscriptionRepository();
        const id = await repo.createInscription(input);
        return {
          success: true,
          message: 'Inscription créée avec succès',
          id: id.toString(),
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de l'inscription",
        };
      }
    },

    desinscrire: async (_: any, { cours_id, utilisateur_id }: { cours_id: number; utilisateur_id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.deleteInscriptionByCoursUser(cours_id, utilisateur_id);
        return {
          success,
          message: success ? 'Désinscription effectuée avec succès' : 'Inscription non trouvée',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la désinscription',
        };
      }
    },

    updatePresence: async (_: any, { input }: { input: any }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.updatePresence({
          inscriptionId: input.inscription_id,
          presence: input.presence,
        });
        return {
          success,
          message: success ? 'Présence mise à jour avec succès' : 'Inscription non trouvée',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la mise à jour de la présence',
        };
      }
    },

    validerInscription: async (_: any, { cours_id, utilisateur_id }: { cours_id: number; utilisateur_id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.validerInscription(cours_id, utilisateur_id);
        return {
          success,
          message: success ? 'Inscription validée avec succès' : 'Inscription non trouvée',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de la validation de l'inscription",
        };
      }
    },

    annulerInscription: async (_: any, { cours_id, utilisateur_id }: { cours_id: number; utilisateur_id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.annulerInscription(cours_id, utilisateur_id);
        return {
          success,
          message: success ? 'Inscription annulée avec succès' : 'Inscription non trouvée',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de l'annulation de l'inscription",
        };
      }
    },

    deleteInscription: async (_: any, { id }: { id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.deleteInscription(id);
        return {
          success,
          message: success ? 'Inscription supprimée avec succès' : 'Inscription non trouvée',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Erreur lors de la suppression de l'inscription",
        };
      }
    },

    deleteCours: async (_: any, { id }: { id: number }) => {
      try {
        const repo = getInscriptionRepository();
        const success = await repo.deleteCours(id);
        return {
          success,
          message: success ? 'Cours supprimé avec succès' : 'Cours non trouvé',
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Erreur lors de la suppression du cours',
        };
      }
    },
  },

  // ==========================================================================
  // FIELD RESOLVERS
  // ==========================================================================
  Cours: {
    professeurs: async (parent: Cours) => {
      const repo = getInscriptionRepository();
      return await repo.findProfesseursByCours(parent.id);
    },

    utilisateurs: async (parent: Cours) => {
      const repo = getInscriptionRepository();
      return await repo.findUtilisateursByCours(parent.id);
    },

    nombre_inscrits: async (parent: Cours) => {
      const repo = getInscriptionRepository();
      return await repo.countInscriptionsByCours(parent.id);
    },
  },

  CoursRecurrent: {
    professeurs: async (parent: CoursRecurrent) => {
      const repo = getInscriptionRepository();
      return await repo.findProfesseursByCoursRecurrent(parent.id);
    },

    jour_nom: (parent: CoursRecurrent) => {
      const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      return jours[parent.jour_semaine] || '';
    },
  },

  Inscription: {
    cours: async (parent: Inscription) => {
      const repo = getInscriptionRepository();
      return await repo.findCoursById(parent.cours_id);
    },
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  typeDefs,
  resolvers,
};
