/**
 * Repository agrégateur pour le module Cours
 *
 * Ce repository compose tous les repositories spécialisés et fournit
 * une API unifiée pour toutes les opérations sur les cours.
 *
 * Architecture:
 * - CoursReadRepository: opérations de lecture (SELECT)
 * - CoursWriteRepository: opérations d'écriture (INSERT, UPDATE, DELETE)
 * - CoursInscriptionsRepository: gestion des inscriptions et présences
 * - CoursStatisticsRepository: statistiques et rapports
 * - CoursValidationRepository: validations métier
 *
 * @example
 * ```typescript
 * import { getCoursRepository } from './db/clients/cours/cours.repository';
 *
 * const coursRepo = getCoursRepository();
 * const cours = await coursRepo.findById(123);
 * await coursRepo.inscrireUtilisateur(userId, coursId);
 * const stats = await coursRepo.getStatistiquesGlobales();
 * ```
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import { CoursReadRepository } from './repositories/read.repository.js';
import { CoursWriteRepository } from './repositories/write.repository.js';
import { CoursInscriptionsRepository } from './repositories/inscriptions.repository.js';
import { CoursStatisticsRepository } from './repositories/statistics.repository.js';
import { CoursValidationRepository } from './repositories/validation.repository.js';

import type {
  Cours,
  CoursRecurrent,
  CoursAvecProfesseurs,
  JourDeCours,
  UtilisateurParticipant,
  Professeur,
  Semaine,
  DisponibiliteCours,
  CreateCoursData,
  CreateCoursRecurrentData,
  UpdateCoursData,
  UpdateCoursRecurrentData,
  InscriptionCours,
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
  ValidationResult,
} from './types.js';

/**
 * Repository principal pour la gestion des cours
 * Compose tous les repositories spécialisés
 */
export class CoursRepository {
  private mysqlConnector: MysqlConnector;

  // Repositories spécialisés
  private readRepo: CoursReadRepository;
  private writeRepo: CoursWriteRepository;
  private inscriptionsRepo: CoursInscriptionsRepository;
  private statisticsRepo: CoursStatisticsRepository;
  private validationRepo: CoursValidationRepository;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();

    // Initialisation des repositories spécialisés
    this.readRepo = new CoursReadRepository(this.mysqlConnector);
    this.writeRepo = new CoursWriteRepository(this.mysqlConnector);
    this.inscriptionsRepo = new CoursInscriptionsRepository(this.mysqlConnector);
    this.statisticsRepo = new CoursStatisticsRepository(this.mysqlConnector);
    this.validationRepo = new CoursValidationRepository(this.mysqlConnector);
  }

  // ==========================================================================
  // OPÉRATIONS DE LECTURE (READ)
  // ==========================================================================

  /**
   * Récupérer tous les cours
   */
  async findAll(): Promise<Cours[]> {
    return this.readRepo.findAll();
  }

  /**
   * Récupérer un cours par son ID
   */
  async findById(coursId: number): Promise<Cours | null> {
    return this.readRepo.findById(coursId);
  }

  /**
   * Récupérer les cours d'une semaine spécifique
   */
  async findByWeek(weekNumber: number, year: number): Promise<Cours[]> {
    return this.readRepo.findByWeek(weekNumber, year);
  }

  /**
   * Récupérer les cours dans une plage de dates
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Cours[]> {
    return this.readRepo.findByDateRange(startDate, endDate);
  }

  /**
   * Récupérer tous les cours futurs
   */
  async findFutureCours(limit?: number): Promise<Cours[]> {
    return this.readRepo.findFutureCours(limit);
  }

  /**
   * Récupérer un cours avec ses professeurs
   */
  async findByIdWithProfesseurs(coursId: number): Promise<CoursAvecProfesseurs | null> {
    return this.readRepo.findByIdWithProfesseurs(coursId);
  }

  /**
   * Récupérer tous les cours avec leurs professeurs
   */
  async findAllWithProfesseurs(): Promise<CoursAvecProfesseurs[]> {
    return this.readRepo.findAllWithProfesseurs();
  }

  /**
   * Récupérer tous les cours récurrents
   */
  async findAllCoursRecurrents(): Promise<CoursRecurrent[]> {
    return this.readRepo.findAllCoursRecurrents();
  }

  /**
   * Récupérer un cours récurrent par son ID
   */
  async findCoursRecurrentById(coursRecurrentId: number): Promise<CoursRecurrent | null> {
    return this.readRepo.findCoursRecurrentById(coursRecurrentId);
  }

  /**
   * Récupérer un cours récurrent par jour et horaire
   */
  async findCoursRecurrentByDayTime(
    jour: string,
    heureDebut: string,
    heureFin: string
  ): Promise<CoursRecurrent | null> {
    return this.readRepo.findCoursRecurrentByDayTime(jour, heureDebut, heureFin);
  }

  /**
   * Récupérer les cours récurrents d'un jour spécifique
   */
  async findCoursRecurrentsByDay(jour: string): Promise<CoursRecurrent[]> {
    return this.readRepo.findCoursRecurrentsByDay(jour);
  }

  /**
   * Récupérer les jours de cours avec détails
   */
  async getJoursDeCours(): Promise<JourDeCours[]> {
    return this.readRepo.getJoursDeCours();
  }

  /**
   * Récupérer les jours de cours pour une semaine spécifique
   */
  async getJoursDeCoursParSemaine(weekNumber: number, year: number): Promise<JourDeCours[]> {
    return this.readRepo.getJoursDeCoursParSemaine(weekNumber, year);
  }

  /**
   * Récupérer les participants d'un cours
   */
  async getParticipantsByCours(coursId: number): Promise<UtilisateurParticipant[]> {
    return this.readRepo.getParticipantsByCours(coursId);
  }

  /**
   * Récupérer les cours d'un utilisateur
   */
  async getCoursByUser(userId: number): Promise<Cours[]> {
    return this.readRepo.getCoursByUser(userId);
  }

  /**
   * Récupérer les cours futurs d'un utilisateur
   */
  async getCoursFutursByUser(userId: number): Promise<Cours[]> {
    return this.readRepo.getCoursFutursByUser(userId);
  }

  /**
   * Récupérer toutes les semaines qui ont des cours
   */
  async getSemainesAvecCours(): Promise<Semaine[]> {
    return this.readRepo.getSemainesAvecCours();
  }

  /**
   * Récupérer les informations d'une semaine spécifique
   */
  async getSemaineInfo(weekNumber: number, year: number): Promise<Semaine | null> {
    return this.readRepo.getSemaineInfo(weekNumber, year);
  }

  /**
   * Récupérer les professeurs d'un cours récurrent
   */
  async getProfesseursByCoursRecurrent(coursRecurrentId: number): Promise<Professeur[]> {
    return this.readRepo.getProfesseursByCoursRecurrent(coursRecurrentId);
  }

  /**
   * Rechercher un professeur par nom
   */
  async findProfesseurByName(nom: string, prenom: string): Promise<Professeur | null> {
    return this.readRepo.findProfesseurByName(nom, prenom);
  }

  /**
   * Récupérer tous les professeurs
   */
  async getAllProfesseurs(): Promise<Professeur[]> {
    return this.readRepo.getAllProfesseurs();
  }

  /**
   * Compter les inscriptions d'un cours
   */
  async countInscriptionsByCours(coursId: number): Promise<number> {
    return this.readRepo.countInscriptionsByCours(coursId);
  }

  /**
   * Vérifier la disponibilité d'un cours
   */
  async checkCoursDisponibilite(coursId: number): Promise<DisponibiliteCours> {
    return this.readRepo.checkCoursDisponibilite(coursId);
  }

  /**
   * Récupérer tous les cours disponibles (avec places)
   */
  async getCoursDisponibles(): Promise<Cours[]> {
    return this.readRepo.getCoursDisponibles();
  }

  // ==========================================================================
  // OPÉRATIONS D'ÉCRITURE (WRITE)
  // ==========================================================================

  /**
   * Créer un nouveau cours
   */
  async createCours(data: CreateCoursData): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.writeRepo.createCours(data);
  }

  /**
   * Créer un cours récurrent
   */
  async createCoursRecurrent(
    data: CreateCoursRecurrentData
  ): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.writeRepo.createCoursRecurrent(data);
  }

  /**
   * Mettre à jour un cours
   */
  async updateCours(
    coursId: number,
    data: UpdateCoursData
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCours(coursId, data);
  }

  /**
   * Mettre à jour le statut actif d'un cours
   */
  async updateCoursActif(
    coursId: number,
    actif: boolean
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCoursActif(coursId, actif);
  }

  /**
   * Mettre à jour la capacité d'un cours
   */
  async updateCoursCapacite(
    coursId: number,
    capaciteMax: number
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCoursCapacite(coursId, capaciteMax);
  }

  /**
   * Mettre à jour un cours récurrent
   */
  async updateCoursRecurrent(
    coursRecurrentId: number,
    data: UpdateCoursRecurrentData
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCoursRecurrent(coursRecurrentId, data);
  }

  /**
   * Mettre à jour le type d'un cours récurrent
   */
  async updateCoursRecurrentType(
    coursRecurrentId: number,
    typeCours: string
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCoursRecurrentType(coursRecurrentId, typeCours);
  }

  /**
   * Mettre à jour les horaires d'un cours récurrent
   */
  async updateCoursRecurrentHoraires(
    coursRecurrentId: number,
    heureDebut: string,
    heureFin: string
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.updateCoursRecurrentHoraires(coursRecurrentId, heureDebut, heureFin);
  }

  /**
   * Supprimer un cours (hard delete)
   */
  async deleteCours(coursId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.deleteCours(coursId);
  }

  /**
   * Supprimer un cours (soft delete)
   */
  async softDeleteCours(coursId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.softDeleteCours(coursId);
  }

  /**
   * Supprimer un cours récurrent (hard delete)
   */
  async deleteCoursRecurrent(coursRecurrentId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.deleteCoursRecurrent(coursRecurrentId);
  }

  /**
   * Supprimer un cours récurrent (soft delete)
   */
  async softDeleteCoursRecurrent(coursRecurrentId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.softDeleteCoursRecurrent(coursRecurrentId);
  }

  /**
   * Générer les cours d'une semaine à partir des cours récurrents
   */
  async generateCoursFromRecurrent(weekNumber: number, year: number): Promise<any> {
    return this.writeRepo.generateCoursFromRecurrent(weekNumber, year);
  }

  /**
   * Générer les cours d'une semaine
   */
  async generateWeekCours(
    weekNumber: number,
    year: number
  ): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.writeRepo.generateWeekCours(weekNumber, year);
  }

  /**
   * Associer un professeur à un cours récurrent
   */
  async associerProfesseur(
    coursRecurrentId: number,
    professeurId: number
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.associerProfesseur(coursRecurrentId, professeurId);
  }

  /**
   * Associer plusieurs professeurs à un cours récurrent
   */
  async associerProfesseurs(
    coursRecurrentId: number,
    professeurIds: number[]
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.associerProfesseurs(coursRecurrentId, professeurIds);
  }

  /**
   * Supprimer tous les professeurs d'un cours récurrent
   */
  async deleteProfesseursByCoursRecurrent(
    coursRecurrentId: number
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.deleteProfesseursByCoursRecurrent(coursRecurrentId);
  }

  /**
   * Supprimer un professeur spécifique d'un cours récurrent
   */
  async deleteProfesseurFromCoursRecurrent(
    coursRecurrentId: number,
    professeurId: number
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.writeRepo.deleteProfesseurFromCoursRecurrent(coursRecurrentId, professeurId);
  }

  /**
   * Créer un nouveau professeur
   */
  async createProfesseur(nom: string, prenom: string): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.writeRepo.createProfesseur(nom, prenom);
  }

  // ==========================================================================
  // GESTION DES INSCRIPTIONS
  // ==========================================================================

  /**
   * Inscrire un utilisateur à un cours
   */
  async inscrireUtilisateur(
    userId: number,
    coursId: number
  ): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.inscriptionsRepo.inscrireUtilisateur(userId, coursId);
  }

  /**
   * Désinscrire un utilisateur d'un cours (par inscription ID)
   */
  async desinscrireUtilisateur(inscriptionId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.desinscrireUtilisateur(inscriptionId);
  }

  /**
   * Désinscrire un utilisateur d'un cours (par user ID et cours ID)
   */
  async desinscrireUtilisateurByCours(
    userId: number,
    coursId: number
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.desinscrireUtilisateurByCours(userId, coursId);
  }

  /**
   * Supprimer toutes les inscriptions d'un cours
   */
  async deleteInscriptionsByCours(coursId: number): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.inscriptionsRepo.deleteInscriptionsByCours(coursId);
  }

  /**
   * Supprimer toutes les inscriptions d'un utilisateur
   */
  async deleteInscriptionsByUser(userId: number): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.inscriptionsRepo.deleteInscriptionsByUser(userId);
  }

  /**
   * Marquer la présence d'un utilisateur à un cours
   */
  async marquerPresence(
    userId: number,
    coursId: number,
    present: boolean
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.marquerPresence(userId, coursId, present);
  }

  /**
   * Valider la présence d'un utilisateur
   */
  async validerPresence(inscriptionId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.validerPresence(inscriptionId);
  }

  /**
   * Annuler la présence d'un utilisateur
   */
  async annulerPresence(inscriptionId: number): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.annulerPresence(inscriptionId);
  }

  /**
   * Mettre à jour le statut d'une inscription
   */
  async updateInscriptionStatus(
    inscriptionId: number,
    status: string
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.updateInscriptionStatus(inscriptionId, status);
  }

  /**
   * Mettre à jour les notes d'une inscription
   */
  async updateInscriptionNotes(
    inscriptionId: number,
    notes: string
  ): Promise<{ isConfirm: boolean; message: string }> {
    return this.inscriptionsRepo.updateInscriptionNotes(inscriptionId, notes);
  }

  /**
   * Vérifier si un utilisateur est inscrit à un cours
   */
  async verifierInscription(
    userId: number,
    coursId: number
  ): Promise<{ isBooked: boolean; isFind: boolean; message: string; inscriptionId?: number; userId?: number }> {
    return this.inscriptionsRepo.verifierInscription(userId, coursId);
  }

  /**
   * Récupérer une inscription par son ID
   */
  async getInscriptionById(inscriptionId: number): Promise<InscriptionCours | null> {
    return this.inscriptionsRepo.getInscriptionById(inscriptionId);
  }

  /**
   * Récupérer toutes les inscriptions d'un utilisateur
   */
  async getInscriptionsByUser(userId: number): Promise<InscriptionCours[]> {
    return this.inscriptionsRepo.getInscriptionsByUser(userId);
  }

  /**
   * Récupérer toutes les inscriptions d'un cours
   */
  async getInscriptionsByCours(coursId: number): Promise<InscriptionCours[]> {
    return this.inscriptionsRepo.getInscriptionsByCours(coursId);
  }

  /**
   * Compter les présents d'un cours
   */
  async countPresentsByCours(coursId: number): Promise<number> {
    return this.inscriptionsRepo.countPresentsByCours(coursId);
  }

  /**
   * Compter les absents d'un cours
   */
  async countAbsentsByCours(coursId: number): Promise<number> {
    return this.inscriptionsRepo.countAbsentsByCours(coursId);
  }

  /**
   * Nettoyer les anciennes inscriptions
   */
  async cleanupOldInscriptions(daysOld: number): Promise<{ isConfirm: boolean; message: string; data?: any }> {
    return this.inscriptionsRepo.cleanupOldInscriptions(daysOld);
  }

  // ==========================================================================
  // STATISTIQUES
  // ==========================================================================

  /**
   * Récupérer les statistiques de présence d'un cours
   */
  async getStatistiquesPresenceCours(coursId: number): Promise<StatistiquesPresenceCours | null> {
    return this.statisticsRepo.getStatistiquesPresenceCours(coursId);
  }

  /**
   * Récupérer les statistiques globales de présence
   */
  async getStatistiquesGlobales(): Promise<StatistiquesPresenceCours[]> {
    return this.statisticsRepo.getStatistiquesGlobales();
  }

  /**
   * Récupérer les statistiques de présence d'un utilisateur
   */
  async getStatistiquesPresenceUtilisateur(userId: number): Promise<StatistiquesPresenceUtilisateur | null> {
    return this.statisticsRepo.getStatistiquesPresenceUtilisateur(userId);
  }

  /**
   * Récupérer les statistiques de tous les utilisateurs
   */
  async getStatistiquesTousUtilisateurs(): Promise<StatistiquesPresenceUtilisateur[]> {
    return this.statisticsRepo.getStatistiquesTousUtilisateurs();
  }

  /**
   * Récupérer les statistiques par type de cours
   */
  async getStatistiquesParTypeCours(): Promise<any[]> {
    return this.statisticsRepo.getStatistiquesParTypeCours();
  }

  /**
   * Récupérer les statistiques par jour de la semaine
   */
  async getStatistiquesParJourSemaine(): Promise<any[]> {
    return this.statisticsRepo.getStatistiquesParJourSemaine();
  }

  /**
   * Calculer le taux de présence moyen
   */
  async getTauxPresenceMoyen(): Promise<number> {
    return this.statisticsRepo.getTauxPresenceMoyen();
  }

  /**
   * Récupérer les cours les plus populaires
   */
  async getCoursPlusPopulaires(limit?: number): Promise<any[]> {
    return this.statisticsRepo.getCoursPlusPopulaires(limit);
  }

  /**
   * Récupérer les utilisateurs les plus assidus
   */
  async getUtilisateursAssidus(limit?: number): Promise<StatistiquesPresenceUtilisateur[]> {
    return this.statisticsRepo.getUtilisateursAssidus(limit);
  }

  /**
   * Compter le nombre total de cours
   */
  async countTotalCours(): Promise<number> {
    return this.statisticsRepo.countTotalCours();
  }

  /**
   * Compter le nombre total de participants uniques
   */
  async countTotalParticipants(): Promise<number> {
    return this.statisticsRepo.countTotalParticipants();
  }

  /**
   * Compter le nombre de cours par semaine
   */
  async countCoursParSemaine(weekNumber: number, year: number): Promise<number> {
    return this.statisticsRepo.countCoursParSemaine(weekNumber, year);
  }

  /**
   * Récupérer les statistiques pour une période donnée
   */
  async getStatistiquesPeriode(startDate: Date, endDate: Date): Promise<any[]> {
    return this.statisticsRepo.getStatistiquesPeriode(startDate, endDate);
  }

  // ==========================================================================
  // VALIDATIONS
  // ==========================================================================

  /**
   * Vérifier si une inscription existe
   */
  async inscriptionExists(userId: number, coursId: number): Promise<boolean> {
    return this.validationRepo.inscriptionExists(userId, coursId);
  }

  /**
   * Vérifier si une inscription existe par ID
   */
  async inscriptionExistsById(inscriptionId: number): Promise<boolean> {
    return this.validationRepo.inscriptionExistsById(inscriptionId);
  }

  /**
   * Vérifier si un cours existe
   */
  async coursExists(coursId: number): Promise<boolean> {
    return this.validationRepo.coursExists(coursId);
  }

  /**
   * Vérifier si un cours récurrent existe
   */
  async coursRecurrentExists(coursRecurrentId: number): Promise<boolean> {
    return this.validationRepo.coursRecurrentExists(coursRecurrentId);
  }

  /**
   * Vérifier si un professeur existe
   */
  async professeurExists(professeurId: number): Promise<boolean> {
    return this.validationRepo.professeurExists(professeurId);
  }

  /**
   * Vérifier si un professeur existe par nom
   */
  async professeurExistsByName(nom: string, prenom: string): Promise<boolean> {
    return this.validationRepo.professeurExistsByName(nom, prenom);
  }

  /**
   * Vérifier si un utilisateur existe et est actif
   */
  async userExistsAndActive(userId: number): Promise<boolean> {
    return this.validationRepo.userExistsAndActive(userId);
  }

  /**
   * Vérifier si un utilisateur peut s'inscrire
   */
  async checkUserCanRegister(userId: number): Promise<boolean> {
    return this.validationRepo.checkUserCanRegister(userId);
  }

  /**
   * Vérifier si un cours est complet
   */
  async checkCoursIsFull(coursId: number): Promise<boolean> {
    return this.validationRepo.checkCoursIsFull(coursId);
  }

  /**
   * Vérifier s'il y a une inscription en double
   */
  async checkDuplicateInscription(userId: number, coursId: number): Promise<boolean> {
    return this.validationRepo.checkDuplicateInscription(userId, coursId);
  }

  /**
   * Vérifier s'il y a un cours récurrent en double
   */
  async checkDuplicateCoursRecurrent(jour: string, heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.checkDuplicateCoursRecurrent(jour, heureDebut, heureFin);
  }

  /**
   * Vérifier s'il y a un cours en double
   */
  async checkDuplicateCours(dateCours: Date, heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.checkDuplicateCours(dateCours, heureDebut, heureFin);
  }

  /**
   * Valider une date de cours
   */
  async validateCoursDate(dateCours: Date): Promise<boolean> {
    return this.validationRepo.validateCoursDate(dateCours);
  }

  /**
   * Vérifier si un cours est passé
   */
  async checkCoursIsPast(coursId: number): Promise<boolean> {
    return this.validationRepo.checkCoursIsPast(coursId);
  }

  /**
   * Vérifier si un utilisateur peut se désinscrire
   */
  async checkCanUnregister(inscriptionId: number): Promise<boolean> {
    return this.validationRepo.checkCanUnregister(inscriptionId);
  }

  /**
   * Vérifier la capacité d'un cours
   */
  async checkCoursCapacity(
    coursId: number
  ): Promise<{ capacite_max: number; places_occupees: number; places_restantes: number; has_capacity: boolean }> {
    return this.validationRepo.checkCoursCapacity(coursId);
  }

  /**
   * Valider une capacité
   */
  async validateCapacite(capacite: number): Promise<boolean> {
    return this.validationRepo.validateCapacite(capacite);
  }

  /**
   * Vérifier si un professeur est déjà assigné à un cours récurrent
   */
  async checkProfesseurAlreadyAssigned(coursRecurrentId: number, professeurId: number): Promise<boolean> {
    return this.validationRepo.checkProfesseurAlreadyAssigned(coursRecurrentId, professeurId);
  }

  /**
   * Vérifier les conflits de professeurs
   */
  async checkProfesseurConflict(professeurId: number, jour: string, heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.checkProfesseurConflict(professeurId, jour, heureDebut, heureFin);
  }

  /**
   * Valider des horaires
   */
  async validateHoraires(heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.validateHoraires(heureDebut, heureFin);
  }

  /**
   * Vérifier les conflits d'horaires
   */
  async checkHoraireConflict(dateCours: Date, heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.checkHoraireConflict(dateCours, heureDebut, heureFin);
  }

  /**
   * Vérifier les conflits d'horaires pour cours récurrents
   */
  async checkHoraireConflictRecurrent(jour: string, heureDebut: string, heureFin: string): Promise<boolean> {
    return this.validationRepo.checkHoraireConflictRecurrent(jour, heureDebut, heureFin);
  }

  /**
   * Valider un jour de la semaine
   */
  async validateJourSemaine(jour: string): Promise<boolean> {
    return this.validationRepo.validateJourSemaine(jour);
  }

  /**
   * Compter les inscriptions actives d'un utilisateur
   */
  async countUserActiveInscriptions(userId: number): Promise<number> {
    return this.validationRepo.countUserActiveInscriptions(userId);
  }

  /**
   * Compter les cours d'un jour
   */
  async countCoursByDay(dateCours: Date): Promise<number> {
    return this.validationRepo.countCoursByDay(dateCours);
  }

  /**
   * Compter les cours récurrents d'un jour
   */
  async countCoursRecurrentsByDay(jour: string): Promise<number> {
    return this.validationRepo.countCoursRecurrentsByDay(jour);
  }

  /**
   * Valider une inscription (vérifications complètes)
   */
  async validateInscription(userId: number, coursId: number): Promise<ValidationResult> {
    return this.validationRepo.validateInscription(userId, coursId);
  }

  /**
   * Valider un cours récurrent (vérifications complètes)
   */
  async validateCoursRecurrent(
    jour: string,
    heureDebut: string,
    heureFin: string,
    typeCours: string,
    capaciteMax: number
  ): Promise<ValidationResult> {
    return this.validationRepo.validateCoursRecurrent(jour, heureDebut, heureFin, typeCours, capaciteMax);
  }
}

// ==========================================================================
// SINGLETON PATTERN
// ==========================================================================

let repositoryInstance: CoursRepository | null = null;

/**
 * Récupérer l'instance singleton du repository Cours
 *
 * @example
 * ```typescript
 * const coursRepo = getCoursRepository();
 * const cours = await coursRepo.findAll();
 * ```
 */
export function getCoursRepository(): CoursRepository {
  if (!repositoryInstance) {
    repositoryInstance = new CoursRepository();
  }
  return repositoryInstance;
}

/**
 * Export par défaut
 */
export default CoursRepository;
