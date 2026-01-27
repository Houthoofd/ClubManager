/**
 * Service Cours - Orchestrateur
 * Gère les cours, inscriptions, présences et professeurs
 */

import type {
  CoursInfo,
  CoursAvecUtilisateurs,
  JourCoursRecurrent,
  UtilisateursParCoursResult,
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
  AjoutCoursRecurrent,
  ModificationCoursRecurrent,
  InscriptionUtilisateur,
  ValidationPresence,
  VerificationInscriptionResult,
  CoursOperationResult,
  SuppressionProfesseurs,
} from "@clubmanager/types";

// Import depuis l'index core qui réexporte tout
import * as core from "./core/index.js";

/**
 * Service principal pour la gestion des cours
 */
export class CoursService {
  // ========== QUERIES COURS ==========

  /**
   * Obtenir les 12 prochains cours pour un participant
   */
  async obtenirCoursPourParticipant(
    participantId: number,
  ): Promise<CoursInfo[]> {
    return await core.obtenirCoursPourParticipant(participantId);
  }

  /**
   * Obtenir cours par semaine pour un participant
   */
  async obtenirCoursParSemaine(
    participantId: number,
    semaine: number,
  ): Promise<CoursInfo[]> {
    return await core.obtenirCoursParSemaine(participantId, semaine);
  }

  /**
   * Obtenir tous les cours (admin)
   */
  async obtenirTousLesCours(): Promise<CoursInfo[]> {
    return await core.obtenirTousLesCours();
  }

  /**
   * Obtenir cours inscrits pour un utilisateur
   */
  async obtenirCoursInscritsParUtilisateur(
    userId: number,
  ): Promise<CoursInfo[]> {
    return await core.obtenirCoursInscritsParUtilisateur(userId);
  }

  // ========== QUERIES INSCRIPTIONS ==========

  /**
   * Obtenir les utilisateurs inscrits à un cours
   */
  async obtenirUtilisateursParCours(
    coursId: number,
  ): Promise<UtilisateursParCoursResult> {
    return await core.obtenirUtilisateursParCours(coursId);
  }

  /**
   * Obtenir cours avec leurs utilisateurs
   */
  async obtenirCoursAvecUtilisateurs(
    participantId: number,
  ): Promise<CoursAvecUtilisateurs[]> {
    return await core.obtenirCoursAvecUtilisateurs(participantId);
  }

  /**
   * Obtenir utilisateurs participants pour un cours
   */
  async obtenirUtilisateursParticipantsParCours(
    coursId: number,
  ): Promise<UtilisateursParCoursResult> {
    return await core.obtenirUtilisateursParticipantsParCours(coursId);
  }

  // ========== QUERIES RÉCURRENTS ==========

  /**
   * Obtenir tous les jours de cours récurrents
   */
  async obtenirJoursDeCours(): Promise<JourCoursRecurrent[]> {
    return await core.obtenirJoursDeCours();
  }

  /**
   * Obtenir jours de cours par semaine
   */
  async obtenirJoursDeCoursParSemaine(
    semaine: number,
  ): Promise<JourCoursRecurrent[]> {
    return await core.obtenirJoursDeCoursParSemaine(semaine);
  }

  /**
   * Obtenir un cours récurrent par ID
   */
  async obtenirCoursRecurrentParId(id: number) {
    return await core.obtenirCoursRecurrentParId(id);
  }

  /**
   * Trouver un cours récurrent par critères
   */
  async trouverCoursRecurrent(
    jour: string,
    type_cours: string,
    heure_debut: string,
    heure_fin: string,
  ): Promise<number | null> {
    return await core.trouverCoursRecurrent(
      jour,
      type_cours,
      heure_debut,
      heure_fin,
    );
  }

  // ========== QUERIES STATISTIQUES ==========

  /**
   * Obtenir les semaines avec cours pour un participant
   */
  async obtenirSemainesAvecCours(participantId: number): Promise<number[]> {
    return await core.obtenirSemainesAvecCours(participantId);
  }

  /**
   * Obtenir statistiques de présence pour un cours
   */
  async obtenirStatistiquesPresenceCours(
    coursId: number,
  ): Promise<StatistiquesPresenceCours> {
    return await core.obtenirStatistiquesPresenceCours(coursId);
  }

  /**
   * Obtenir statistiques de présence pour un utilisateur
   */
  async obtenirStatistiquesPresenceUtilisateur(
    utilisateurId: number,
  ): Promise<StatistiquesPresenceUtilisateur> {
    return await core.obtenirStatistiquesPresenceUtilisateur(utilisateurId);
  }

  // ========== MUTATIONS INSCRIPTIONS ==========

  /**
   * Vérifier si un utilisateur est inscrit à un cours
   */
  async verifierInscriptionUtilisateur(
    coursId: number,
    utilisateurId: number,
  ): Promise<VerificationInscriptionResult> {
    return await core.verifierInscriptionUtilisateur(coursId, utilisateurId);
  }

  /**
   * Inscrire un utilisateur à un cours
   */
  async inscrireUtilisateurAuCours(
    data: InscriptionUtilisateur,
  ): Promise<CoursOperationResult> {
    return await core.inscrireUtilisateurAuCours(data);
  }

  /**
   * Désinscrire un utilisateur d'un cours
   */
  async desinscrireUtilisateurDuCours(
    data: InscriptionUtilisateur,
  ): Promise<CoursOperationResult> {
    return await core.desinscrireUtilisateurDuCours(data);
  }

  /**
   * Valider la présence d'un utilisateur
   */
  async validerPresenceUtilisateur(
    data: ValidationPresence,
  ): Promise<CoursOperationResult> {
    return await core.validerPresenceUtilisateur(data);
  }

  /**
   * Annuler/Marquer absent un utilisateur
   */
  async annulerPresenceUtilisateur(
    data: ValidationPresence,
  ): Promise<CoursOperationResult> {
    return await core.annulerPresenceUtilisateur(data);
  }

  // ========== MUTATIONS COURS RÉCURRENTS ==========

  /**
   * Ajouter un cours récurrent avec professeurs
   */
  async ajouterCoursRecurrent(
    data: AjoutCoursRecurrent,
  ): Promise<CoursOperationResult> {
    return await core.ajouterCoursRecurrent(data);
  }

  /**
   * Modifier un cours récurrent
   */
  async modifierCoursRecurrent(
    data: ModificationCoursRecurrent,
  ): Promise<CoursOperationResult> {
    return await core.modifierCoursRecurrent(data);
  }

  /**
   * Supprimer un cours récurrent et ses occurrences futures
   */
  async supprimerCoursRecurrent(
    coursRecurrentId: number,
  ): Promise<CoursOperationResult> {
    return await core.supprimerCoursRecurrent(coursRecurrentId);
  }

  /**
   * Supprimer un cours récurrent par jour
   */
  async supprimerCoursRecurrentParJour(
    jour: string,
  ): Promise<CoursOperationResult> {
    return await core.supprimerCoursRecurrentParJour(jour);
  }

  // ========== MUTATIONS PROFESSEURS ==========

  /**
   * Associer des professeurs à un cours récurrent
   */
  async associerProfesseursAuCoursRecurrent(
    coursRecurrentId: number,
    professeursNoms: string[],
  ): Promise<CoursOperationResult> {
    return await core.associerProfesseursAuCoursRecurrent(
      coursRecurrentId,
      professeursNoms,
    );
  }

  /**
   * Supprimer des professeurs d'un cours récurrent
   */
  async supprimerProfesseursParNomEtJour(
    data: SuppressionProfesseurs,
  ): Promise<CoursOperationResult> {
    return await core.supprimerProfesseursParNomEtJour(data);
  }

  /**
   * Trouver automatiquement le cours d'un professeur
   */
  async trouverCoursAvecProfesseur(professeurNom: string, jour: string) {
    return await core.trouverCoursAvecProfesseur(professeurNom, jour);
  }

  /**
   * Supprimer des professeurs avec résolution automatique
   */
  async supprimerProfesseursAvecResolution(
    professeursNoms: string[],
    jour: string,
    coursContext?: {
      type_cours?: string;
      heure_debut?: string;
      heure_fin?: string;
    },
  ): Promise<CoursOperationResult> {
    return await core.supprimerProfesseursAvecResolution(
      professeursNoms,
      jour,
      coursContext,
    );
  }

  // ========== VÉRIFICATIONS ==========

  /**
   * Vérifie s'il existe un conflit horaire pour un cours
   */
  async verifierConflitHoraire(params: {
    jour: string;
    heureDebut: string;
    heureFin: string;
    typeCours?: string;
    excludeOriginal?: {
      jour: string;
      type: string;
      heureDebut: string;
      heureFin: string;
    };
  }): Promise<{ exists: boolean; message: string; coursConflict?: any }> {
    return await core.verifierConflitHoraire(params);
  }

  /**
   * Vérifie la capacité d'un cours (nombre d'inscrits vs capacité max)
   */
  async verifierCapaciteCours(
    coursId: number,
  ): Promise<{
    capaciteAtteinte: boolean;
    nombreInscrits: number;
    capaciteMax?: number;
  }> {
    return await core.verifierCapaciteCours(coursId);
  }

  /**
   * Vérifie si un cours récurrent existe avec les critères donnés
   */
  async verifierCoursRecurrentExiste(params: {
    jour: string;
    typeCours: string;
    heureDebut: string;
    heureFin: string;
  }): Promise<{ existe: boolean; coursId?: number; message: string }> {
    return await core.verifierCoursRecurrentExiste(params);
  }

  /**
   * Vérifie si un utilisateur peut s'inscrire à un cours
   */
  async verifierInscriptionPossible(params: {
    coursId: number;
    utilisateurId: number;
  }): Promise<{
    possible: boolean;
    raison?: string;
    dejaInscrit?: boolean;
    capaciteAtteinte?: boolean;
  }> {
    return await core.verifierInscriptionPossible(params);
  }
}

// Instance singleton
export const coursService = new CoursService();
