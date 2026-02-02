/**
 * Resolvers GraphQL pour le service cours
 */

import { coursService } from './cours.service.js';
import type {
  AjoutCoursRecurrent,
  ModificationCoursRecurrent,
  InscriptionUtilisateur,
  ValidationPresence,
  SuppressionProfesseurs
} from '@clubmanager/types';

export const coursResolvers = {
  Query: {
    // ========== QUERIES COURS ==========

    /**
     * Obtenir les cours pour un participant
     */
    coursPourParticipant: async (_: any, { participantId }: { participantId: number }) => {
      try {
        return await coursService.obtenirCoursPourParticipant(participantId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des cours: ${error.message}`);
      }
    },

    /**
     * Obtenir cours par semaine
     */
    coursParSemaine: async (
      _: any,
      { participantId, semaine }: { participantId: number; semaine: number }
    ) => {
      try {
        return await coursService.obtenirCoursParSemaine(participantId, semaine);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des cours: ${error.message}`);
      }
    },

    /**
     * Obtenir tous les cours (admin)
     */
    tousLesCours: async () => {
      try {
        return await coursService.obtenirTousLesCours();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des cours: ${error.message}`);
      }
    },

    /**
     * Obtenir cours inscrits pour un utilisateur
     */
    coursInscritsUtilisateur: async (_: any, { userId }: { userId: number }) => {
      try {
        return await coursService.obtenirCoursInscritsParUtilisateur(userId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des cours: ${error.message}`);
      }
    },

    // ========== QUERIES INSCRIPTIONS ==========

    /**
     * Obtenir utilisateurs d'un cours
     */
    utilisateursParCours: async (_: any, { coursId }: { coursId: number }) => {
      try {
        return await coursService.obtenirUtilisateursParCours(coursId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
      }
    },

    /**
     * Obtenir cours avec utilisateurs
     */
    coursAvecUtilisateurs: async (_: any, { participantId }: { participantId: number }) => {
      try {
        return await coursService.obtenirCoursAvecUtilisateurs(participantId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
    },

    /**
     * Obtenir utilisateurs participants pour un cours
     */
    utilisateursParticipants: async (_: any, { coursId }: { coursId: number }) => {
      try {
        return await coursService.obtenirUtilisateursParticipantsParCours(coursId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
    },

    // ========== QUERIES RÉCURRENTS ==========

    /**
     * Obtenir tous les jours de cours
     */
    joursDeCours: async () => {
      try {
        return await coursService.obtenirJoursDeCours();
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération des jours: ${error.message}`);
      }
    },

    /**
     * Obtenir jours de cours par semaine
     */
    joursDeCoursParSemaine: async (_: any, { semaine }: { semaine: number }) => {
      try {
        return await coursService.obtenirJoursDeCoursParSemaine(semaine);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
    },

    /**
     * Obtenir cours récurrent par ID
     */
    coursRecurrent: async (_: any, { id }: { id: number }) => {
      try {
        return await coursService.obtenirCoursRecurrentParId(id);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
    },

    // ========== QUERIES STATISTIQUES ==========

    /**
     * Obtenir semaines avec cours
     */
    semainesAvecCours: async (_: any, { participantId }: { participantId: number }) => {
      try {
        return await coursService.obtenirSemainesAvecCours(participantId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`);
      }
    },

    /**
     * Statistiques de présence pour un cours
     */
    statistiquesPresenceCours: async (_: any, { coursId }: { coursId: number }) => {
      try {
        return await coursService.obtenirStatistiquesPresenceCours(coursId);
      } catch (error: any) {
        throw new Error(`Erreur lors du calcul: ${error.message}`);
      }
    },

    /**
     * Statistiques de présence pour un utilisateur
     */
    statistiquesPresenceUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
      try {
        return await coursService.obtenirStatistiquesPresenceUtilisateur(utilisateurId);
      } catch (error: any) {
        throw new Error(`Erreur lors du calcul: ${error.message}`);
      }
    },

    /**
     * Vérifier inscription utilisateur
     */
    verifierInscription: async (
      _: any,
      { coursId, utilisateurId }: { coursId: number; utilisateurId: number }
    ) => {
      try {
        return await coursService.verifierInscriptionUtilisateur(coursId, utilisateurId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la vérification: ${error.message}`);
      }
    }
  },

  Mutation: {
    // ========== MUTATIONS INSCRIPTIONS ==========

    /**
     * Inscrire un utilisateur à un cours
     */
    inscrireUtilisateur: async (_: any, { input }: { input: InscriptionUtilisateur }) => {
      try {
        return await coursService.inscrireUtilisateurAuCours(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de l'inscription: ${error.message}`);
      }
    },

    /**
     * Désinscrire un utilisateur
     */
    desinscrireUtilisateur: async (_: any, { input }: { input: InscriptionUtilisateur }) => {
      try {
        return await coursService.desinscrireUtilisateurDuCours(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de la désinscription: ${error.message}`);
      }
    },

    /**
     * Valider présence
     */
    validerPresence: async (_: any, { input }: { input: ValidationPresence }) => {
      try {
        return await coursService.validerPresenceUtilisateur(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de la validation: ${error.message}`);
      }
    },

    /**
     * Annuler présence / Marquer absent
     */
    annulerPresence: async (_: any, { input }: { input: ValidationPresence }) => {
      try {
        return await coursService.annulerPresenceUtilisateur(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de l'annulation: ${error.message}`);
      }
    },

    // ========== MUTATIONS COURS RÉCURRENTS ==========

    /**
     * Ajouter un cours récurrent
     */
    ajouterCoursRecurrent: async (_: any, { input }: { input: AjoutCoursRecurrent }) => {
      try {
        return await coursService.ajouterCoursRecurrent(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de l'ajout: ${error.message}`);
      }
    },

    /**
     * Modifier un cours récurrent
     */
    modifierCoursRecurrent: async (_: any, { input }: { input: ModificationCoursRecurrent }) => {
      try {
        return await coursService.modifierCoursRecurrent(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de la modification: ${error.message}`);
      }
    },

    /**
     * Supprimer un cours récurrent
     */
    supprimerCoursRecurrent: async (_: any, { coursRecurrentId }: { coursRecurrentId: number }) => {
      try {
        return await coursService.supprimerCoursRecurrent(coursRecurrentId);
      } catch (error: any) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
    },

    /**
     * Supprimer cours récurrent par jour
     */
    supprimerCoursRecurrentParJour: async (_: any, { jour }: { jour: string }) => {
      try {
        return await coursService.supprimerCoursRecurrentParJour(jour);
      } catch (error: any) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
    },

    // ========== MUTATIONS PROFESSEURS ==========

    /**
     * Associer professeurs à un cours récurrent
     */
    associerProfesseurs: async (
      _: any,
      { coursRecurrentId, professeursNoms }: { coursRecurrentId: number; professeursNoms: string[] }
    ) => {
      try {
        return await coursService.associerProfesseursAuCoursRecurrent(coursRecurrentId, professeursNoms);
      } catch (error: any) {
        throw new Error(`Erreur lors de l'association: ${error.message}`);
      }
    },

    /**
     * Supprimer professeurs d'un cours
     */
    supprimerProfesseurs: async (_: any, { input }: { input: SuppressionProfesseurs }) => {
      try {
        return await coursService.supprimerProfesseursParNomEtJour(input);
      } catch (error: any) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
    },

    /**
     * Supprimer professeurs avec résolution automatique
     */
    supprimerProfesseursAuto: async (
      _: any,
      {
        professeursNoms,
        jour,
        coursContext
      }: {
        professeursNoms: string[];
        jour: string;
        coursContext?: { type_cours?: string; heure_debut?: string; heure_fin?: string };
      }
    ) => {
      try {
        return await coursService.supprimerProfesseursAvecResolution(
          professeursNoms,
          jour,
          coursContext
        );
      } catch (error: any) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  }
};
