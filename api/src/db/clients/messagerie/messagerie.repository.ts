/**
 * Repository principal pour les opérations de base de données sur la Messagerie
 * Responsabilité: Orchestration des sous-repositories modulaires
 */

import MysqlConnector from "../../connector/mysqlconnector.js";
import type {
  TypeMessage,
  MessageAvecExpediteur,
  MessagePersonnalise,
  UtilisateurMessagerie,
  EmailTemplate,
  HistoriqueMessage,
  StatistiquesMessagerie,
  CreateTypeMessageData,
  UpdateTypeMessageData,
  EnvoyerMessagePersonnaliseData,
  CreateEmailTemplateData,
  UpdateEmailTemplateData,
  SaveMessageData,
  ConfirmationResult,
} from "./types.js";

import { ReadRepository } from "./repositories/read.repository.js";
import { WriteRepository } from "./repositories/write.repository.js";
import { ValidationRepository } from "./repositories/validation.repository.js";

/**
 * Repository principal pour la gestion de la messagerie
 * Délègue aux repositories spécialisés
 */
export class MessagerieRepository {
  private mysqlConnector: MysqlConnector;
  private readRepo: ReadRepository;
  private writeRepo: WriteRepository;
  private validationRepo: ValidationRepository;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    this.readRepo = new ReadRepository();
    this.writeRepo = new WriteRepository();
    this.validationRepo = new ValidationRepository();
  }

  // Utilitaire pour utiliser le client avec Promise
  private queryAsync(sql: string, values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES TYPES DE MESSAGES
  // ==========================================================================

  /**
   * Récupérer tous les types de messages
   */
  async getAllTypesMessages(): Promise<TypeMessage[]> {
    return this.readRepo.getAllTypesMessages();
  }

  /**
   * Récupérer un type de message par son ID
   */
  async getTypeMessageById(id: number): Promise<TypeMessage | null> {
    return this.readRepo.getTypeMessageById(id);
  }

  /**
   * Récupérer un type de message par son titre
   */
  async getTypeMessageByTitle(title: string): Promise<TypeMessage | null> {
    return this.readRepo.getTypeMessageByTitle(title);
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES TYPES DE MESSAGES
  // ==========================================================================

  /**
   * Créer un nouveau type de message
   */
  async createTypeMessage(title: string, content: string): Promise<number> {
    return this.writeRepo.createTypeMessage({ title, content });
  }

  /**
   * Mettre à jour un type de message
   */
  async updateTypeMessage(
    id: number,
    title: string,
    content: string,
  ): Promise<boolean> {
    return this.writeRepo.updateTypeMessage(id, { title, content });
  }

  /**
   * Supprimer un type de message
   */
  async deleteTypeMessage(id: number): Promise<boolean> {
    return this.writeRepo.deleteTypeMessage(id);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES UTILISATEURS
  // ==========================================================================

  /**
   * Récupérer l'ID numérique d'un utilisateur à partir de son userId
   */
  async getUserIdFromUserId(userId: string): Promise<number | null> {
    return this.readRepo.getUserIdFromUserId(userId);
  }

  /**
   * Récupérer tous les utilisateurs actifs
   */
  async getAllUsers(): Promise<UtilisateurMessagerie[]> {
    return this.readRepo.getAllUsers();
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  async getUserById(id: number): Promise<UtilisateurMessagerie | null> {
    return this.readRepo.getUserById(id);
  }

  /**
   * Récupérer un utilisateur par son email
   */
  async getUserByEmail(email: string): Promise<UtilisateurMessagerie | null> {
    return this.readRepo.getUserByEmail(email);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES MESSAGES REÇUS
  // ==========================================================================

  /**
   * Récupérer les messages reçus d'un utilisateur
   */
  async getMessagesRecus(userId: string): Promise<MessageAvecExpediteur[]> {
    return this.readRepo.getMessagesRecus(userId);
  }

  /**
   * Récupérer un message personnalisé par son ID
   */
  async getMessageById(id: number): Promise<MessagePersonnalise | null> {
    return this.readRepo.getMessageById(id);
  }

  /**
   * Récupérer les messages non lus d'un utilisateur
   */
  async getMessagesNonLus(userId: number): Promise<MessageAvecExpediteur[]> {
    return this.readRepo.getMessagesNonLus(userId);
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES MESSAGES
  // ==========================================================================

  /**
   * Marquer un message comme lu
   */
  async marquerMessageLu(messageId: number, userId?: number): Promise<boolean> {
    return this.writeRepo.marquerMessageLu(messageId, userId);
  }

  /**
   * Supprimer un message reçu
   */
  async supprimerMessageRecu(
    messageId: number,
    userId?: number,
  ): Promise<boolean> {
    return this.writeRepo.supprimerMessageRecu(messageId, userId);
  }

  // ==========================================================================
  // MÉTHODES D'ENVOI DE MESSAGES
  // ==========================================================================

  /**
   * Envoyer un message à plusieurs utilisateurs
   */
  async envoyerMessage(
    destinataires: number[],
    typeMessageId: number,
    expediteurId?: number,
  ): Promise<{ success: boolean; count: number; message: string }> {
    // Récupérer le contenu du type de message
    const typeMessage = await this.getTypeMessageById(typeMessageId);
    if (!typeMessage) {
      throw new Error("Type de message non trouvé");
    }

    const contenu = typeMessage.content;
    return this.writeRepo.envoyerMessages(destinataires, contenu);
  }

  /**
   * Envoyer un message personnalisé à un utilisateur
   */
  async envoyerMessagePersonnalise(
    destinataireId: number,
    contenu: string,
    expediteurId?: number,
  ): Promise<boolean> {
    return this.writeRepo.envoyerMessagePersonnalise({
      destinataireId,
      contenu,
      expediteurId,
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DES TEMPLATES D'EMAIL
  // ==========================================================================

  /**
   * Récupérer tous les templates d'email
   */
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return this.readRepo.getAllEmailTemplates();
  }

  /**
   * Récupérer un template d'email par son ID
   */
  async getEmailTemplateById(id: number): Promise<EmailTemplate | null> {
    return this.readRepo.getEmailTemplateById(id);
  }

  /**
   * Récupérer un template d'email par son titre
   */
  async getEmailTemplateByTitle(title: string): Promise<EmailTemplate | null> {
    return this.readRepo.getEmailTemplateByTitle(title);
  }

  /**
   * Récupérer les templates actifs
   */
  async getActiveEmailTemplates(): Promise<EmailTemplate[]> {
    return this.readRepo.getActiveEmailTemplates();
  }

  /**
   * Récupérer les templates par catégorie
   */
  async getEmailTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
    return this.readRepo.getEmailTemplatesByCategory(category);
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DES TEMPLATES D'EMAIL
  // ==========================================================================

  /**
   * Créer un nouveau template d'email
   */
  async createEmailTemplate(data: CreateEmailTemplateData): Promise<number> {
    return this.writeRepo.createEmailTemplate(data);
  }

  /**
   * Mettre à jour un template d'email
   */
  async updateEmailTemplate(
    id: number,
    data: UpdateEmailTemplateData,
  ): Promise<boolean> {
    return this.writeRepo.updateEmailTemplate(id, data);
  }

  /**
   * Activer/Désactiver un template d'email
   */
  async toggleEmailTemplateStatus(id: number, active: boolean): Promise<boolean> {
    return this.writeRepo.toggleEmailTemplateStatus(id, active);
  }

  /**
   * Supprimer un template d'email
   */
  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.writeRepo.deleteEmailTemplate(id);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE L'HISTORIQUE
  // ==========================================================================

  /**
   * Récupérer l'historique des messages
   */
  async getHistoriqueMessages(limit: number = 100): Promise<HistoriqueMessage[]> {
    return this.readRepo.getHistoriqueMessages(limit);
  }

  /**
   * Récupérer l'historique des messages d'un utilisateur
   */
  async getHistoriqueMessagesByUser(
    userId: number,
    limit: number = 100,
  ): Promise<HistoriqueMessage[]> {
    return this.readRepo.getHistoriqueMessagesByUser(userId, limit);
  }

  /**
   * Récupérer l'historique des messages par statut
   */
  async getHistoriqueMessagesByStatus(
    status: string,
    limit: number = 100,
  ): Promise<HistoriqueMessage[]> {
    return this.readRepo.getHistoriqueMessagesByStatus(status, limit);
  }

  /**
   * Récupérer un message de l'historique par son ID
   */
  async getHistoriqueMessageById(id: number): Promise<HistoriqueMessage | null> {
    return this.readRepo.getHistoriqueMessageById(id);
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE DE L'HISTORIQUE
  // ==========================================================================

  /**
   * Sauvegarder un message dans l'historique
   */
  async saveMessageToDb(data: SaveMessageData): Promise<number> {
    return this.writeRepo.saveMessageToDb(data);
  }

  /**
   * Mettre à jour le statut d'un message dans l'historique
   */
  async updateMessageStatus(
    messageId: number,
    status: "sent" | "failed",
    errorMessage?: string,
  ): Promise<boolean> {
    return this.writeRepo.updateMessageStatus(messageId, status, errorMessage);
  }

  /**
   * Marquer un message comme envoyé
   */
  async markMessageAsSent(messageId: number): Promise<boolean> {
    return this.writeRepo.markMessageAsSent(messageId);
  }

  /**
   * Marquer un message comme échoué
   */
  async markMessageAsFailed(
    messageId: number,
    errorMessage: string,
  ): Promise<boolean> {
    return this.writeRepo.markMessageAsFailed(messageId, errorMessage);
  }

  // ==========================================================================
  // MÉTHODES STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques de la messagerie
   */
  async getStatistiquesMessages(userId?: number): Promise<StatistiquesMessagerie> {
    return this.readRepo.getStatistiquesMessages(userId);
  }

  /**
   * Obtenir le taux de succès d'envoi
   */
  async getTauxSucces(
    jours: number = 7,
  ): Promise<{ succes: number; echecs: number; total: number; taux: number }> {
    return this.readRepo.getTauxSucces(jours);
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
  // ==========================================================================

  /**
   * Vérifier si un type de message existe
   */
  async typeMessageExists(id: number): Promise<boolean> {
    return this.validationRepo.typeMessageExists(id);
  }

  /**
   * Vérifier si un message existe
   */
  async messageExists(id: number): Promise<boolean> {
    return this.validationRepo.messageExists(id);
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async userExists(id: number): Promise<boolean> {
    return this.validationRepo.userExists(id);
  }

  /**
   * Vérifier si un utilisateur existe par userId
   */
  async userExistsByUserId(userId: string): Promise<boolean> {
    return this.validationRepo.userExistsByUserId(userId);
  }

  /**
   * Vérifier si un utilisateur existe par email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    return this.validationRepo.userExistsByEmail(email);
  }

  /**
   * Vérifier si un utilisateur est actif
   */
  async userIsActive(id: number): Promise<boolean> {
    return this.validationRepo.userIsActive(id);
  }

  /**
   * Vérifier si un template d'email existe
   */
  async emailTemplateExists(id: number): Promise<boolean> {
    return this.validationRepo.emailTemplateExists(id);
  }

  /**
   * Vérifier si un template est actif
   */
  async emailTemplateIsActive(id: number): Promise<boolean> {
    return this.validationRepo.emailTemplateIsActive(id);
  }

  /**
   * Vérifier si tous les utilisateurs d'une liste existent
   */
  async allUsersExist(userIds: number[]): Promise<boolean> {
    return this.validationRepo.allUsersExist(userIds);
  }

  /**
   * Vérifier si tous les utilisateurs d'une liste sont actifs
   */
  async allUsersActive(userIds: number[]): Promise<boolean> {
    return this.validationRepo.allUsersActive(userIds);
  }

  // ==========================================================================
  // MÉTHODES DE NETTOYAGE
  // ==========================================================================

  /**
   * Nettoyer les anciens messages
   */
  async nettoyerAnciennesMessages(joursAConserver: number = 30): Promise<number> {
    return this.writeRepo.nettoyerAnciennesMessages(joursAConserver);
  }

  /**
   * Nettoyer les anciens messages de l'historique
   */
  async nettoyerHistoriqueAncien(joursAConserver: number = 90): Promise<number> {
    return this.writeRepo.nettoyerHistoriqueAncien(joursAConserver);
  }

  /**
   * Nettoyer les messages en échec
   */
  async nettoyerMessagesEchec(joursAConserver: number = 30): Promise<number> {
    return this.writeRepo.nettoyerMessagesEchec(joursAConserver);
  }

  /**
   * Réinitialiser les messages bloqués en statut pending
   */
  async resetStuckMessages(): Promise<number> {
    return this.writeRepo.resetStuckMessages();
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

let repositoryInstance: MessagerieRepository | null = null;

/**
 * Récupérer l'instance singleton du repository
 */
export function getMessagerieRepository(): MessagerieRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MessagerieRepository();
  }
  return repositoryInstance;
}

export const messagerieRepository = getMessagerieRepository();
