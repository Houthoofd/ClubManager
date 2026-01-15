/**
 * Repository principal pour les opérations de base de données sur les Messages
 * Responsabilité: Orchestration et délégation aux sous-repositories
 * Pattern: Singleton
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import { MessagesReadRepository } from './repositories/read.repository.js';
import { MessagesWriteRepository } from './repositories/write.repository.js';
import { MessagesValidationRepository } from './repositories/validation.repository.js';
import type {
  TypeMessagePersonnalise,
  MessagePersonnalise,
  MessagePersonnaliseAvecDetails,
  HistoriqueMessage,
  EmailTemplate,
  MessageStatistiques,
  StatistiquesSuppressions,
  CreateTypeMessageData,
  UpdateTypeMessageData,
  SendMessagePersonnaliseData,
  SaveMessageData,
  UpdateMessageStatusData,
  SendMessageAvecEmailsData,
  SendMessageAvecEmailsResult,
  WelcomeEmailData,
  ValidationEmailData,
  RecoveryEmailData,
  RappelPaiementEmailData,
  EmailResult,
  SendMessageResult,
  MessageSearchResult,
  ConfirmationResult,
} from './types.js';

/**
 * Repository principal pour la gestion des messages
 */
export class MessagesRepository {
  private mysqlConnector: MysqlConnector;
  private readRepository: MessagesReadRepository;
  private writeRepository: MessagesWriteRepository;
  private validationRepository: MessagesValidationRepository;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    this.readRepository = new MessagesReadRepository(this.mysqlConnector);
    this.writeRepository = new MessagesWriteRepository(this.mysqlConnector);
    this.validationRepository = new MessagesValidationRepository(this.mysqlConnector);
  }

  // ==========================================================================
  // TYPES DE MESSAGES PERSONNALISÉS - LECTURE
  // ==========================================================================

  /**
   * Récupérer tous les types de messages actifs
   */
  async obtenirTousLesTypesDeMessages(): Promise<MessageSearchResult> {
    try {
      const types = await this.readRepository.getAllTypesMessages();
      return {
        isFind: types.length > 0,
        message: types.length > 0 ? 'Types de messages trouvés' : 'Aucun type de message trouvé',
        data: types,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des types de messages:', error);
      return {
        isFind: false,
        message: "Erreur lors de la récupération des types de messages",
        data: [],
      };
    }
  }

  /**
   * Récupérer un type de message par ID
   */
  async obtenirTypeMessageParId(typeId: number): Promise<TypeMessagePersonnalise | null> {
    try {
      return await this.readRepository.getTypeMessageById(typeId);
    } catch (error) {
      console.error('Erreur lors de la récupération du type de message:', error);
      return null;
    }
  }

  // ==========================================================================
  // TYPES DE MESSAGES PERSONNALISÉS - ÉCRITURE
  // ==========================================================================

  /**
   * Créer un nouveau type de message
   */
  async creerTypeMessage(data: CreateTypeMessageData): Promise<SendMessageResult> {
    try {
      // Validation: vérifier si le nom existe déjà
      const exists = await this.validationRepository.typeMessageExistsByName(data.nom_type);
      if (exists) {
        return {
          isConfirm: false,
          message: 'Un type de message avec ce nom existe déjà',
        };
      }

      const typeId = await this.writeRepository.createTypeMessage(data);
      return {
        isConfirm: true,
        message: 'Type de message créé avec succès',
        messageId: typeId,
      };
    } catch (error) {
      console.error('Erreur lors de la création du type de message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la création du type de message',
      };
    }
  }

  /**
   * Modifier un type de message
   */
  async modifierTypeMessage(typeId: number, data: UpdateTypeMessageData): Promise<ConfirmationResult> {
    try {
      // Validation: vérifier si le type existe
      const exists = await this.validationRepository.typeMessageExists(typeId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Type de message introuvable',
        };
      }

      const success = await this.writeRepository.updateTypeMessage(typeId, data);
      return {
        isConfirm: success,
        message: success ? 'Type de message modifié avec succès' : 'Échec de la modification',
      };
    } catch (error) {
      console.error('Erreur lors de la modification du type de message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la modification du type de message',
      };
    }
  }

  /**
   * Supprimer un type de message
   */
  async supprimerTypeMessage(typeId: number): Promise<ConfirmationResult> {
    try {
      // Validation: vérifier si le type a des messages associés
      const hasMessages = await this.validationRepository.typeMessageHasMessages(typeId);
      if (hasMessages) {
        return {
          isConfirm: false,
          message: 'Impossible de supprimer: ce type a des messages associés',
        };
      }

      const success = await this.writeRepository.deleteTypeMessage(typeId);
      return {
        isConfirm: success,
        message: success ? 'Type de message supprimé avec succès' : 'Échec de la suppression',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du type de message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la suppression du type de message',
      };
    }
  }

  // ==========================================================================
  // MESSAGES PERSONNALISÉS - LECTURE
  // ==========================================================================

  /**
   * Récupérer les messages reçus par un utilisateur
   */
  async obtenirMessagesRecusParUtilisateur(utilisateurId: number): Promise<MessageSearchResult> {
    try {
      // Validation: vérifier si l'utilisateur existe
      const userExists = await this.validationRepository.userExists(utilisateurId);
      if (!userExists) {
        return {
          isFind: false,
          message: 'Utilisateur introuvable',
          data: [],
        };
      }

      const messages = await this.readRepository.getMessagesRecusParUtilisateur(utilisateurId);
      return {
        isFind: messages.length > 0,
        message: messages.length > 0 ? 'Messages trouvés' : 'Aucun message trouvé',
        data: messages,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return {
        isFind: false,
        message: 'Erreur lors de la récupération des messages',
        data: [],
      };
    }
  }

  /**
   * Compter les messages non lus d'un utilisateur
   */
  async compterMessagesNonLus(utilisateurId: number): Promise<number> {
    try {
      return await this.readRepository.compterMessagesNonLus(utilisateurId);
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
      return 0;
    }
  }

  /**
   * Obtenir les messages inactifs
   */
  async obtenirMessagesInactifs(): Promise<MessageSearchResult> {
    try {
      const messages = await this.readRepository.getMessagesInactifs();
      return {
        isFind: messages.length > 0,
        message: messages.length > 0 ? 'Messages inactifs trouvés' : 'Aucun message inactif',
        data: messages,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages inactifs:', error);
      return {
        isFind: false,
        message: 'Erreur lors de la récupération des messages inactifs',
        data: [],
      };
    }
  }

  /**
   * Obtenir les messages supprimés
   */
  async obtenirMessagesSupprimes(): Promise<MessageSearchResult> {
    try {
      const messages = await this.readRepository.getMessagesSupprimes();
      return {
        isFind: messages.length > 0,
        message: messages.length > 0 ? 'Messages supprimés trouvés' : 'Aucun message supprimé',
        data: messages,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages supprimés:', error);
      return {
        isFind: false,
        message: 'Erreur lors de la récupération des messages supprimés',
        data: [],
      };
    }
  }

  // ==========================================================================
  // MESSAGES PERSONNALISÉS - ÉCRITURE
  // ==========================================================================

  /**
   * Envoyer un message personnalisé
   */
  async envoyerMessage(data: SendMessagePersonnaliseData): Promise<SendMessageResult> {
    try {
      // Validations
      const typeExists = await this.validationRepository.typeMessageExists(data.type_id);
      if (!typeExists) {
        return {
          isConfirm: false,
          message: 'Type de message introuvable',
        };
      }

      const senderCanSend = await this.validationRepository.userCanSendMessage(data.expediteur_id);
      if (!senderCanSend) {
        return {
          isConfirm: false,
          message: "L'expéditeur ne peut pas envoyer de messages",
        };
      }

      const receiverCanReceive = await this.validationRepository.userCanReceiveMessage(data.destinataire_id);
      if (!receiverCanReceive) {
        return {
          isConfirm: false,
          message: 'Le destinataire ne peut pas recevoir de messages',
        };
      }

      const messageId = await this.writeRepository.sendMessagePersonnalise(data);
      return {
        isConfirm: true,
        message: 'Message envoyé avec succès',
        messageId,
      };
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      return {
        isConfirm: false,
        message: "Erreur lors de l'envoi du message",
      };
    }
  }

  /**
   * Marquer un message comme lu
   */
  async marquerMessageCommeLu(messageId: number): Promise<ConfirmationResult> {
    try {
      // Validation: vérifier si le message existe
      const exists = await this.validationRepository.messageExists(messageId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Message introuvable',
        };
      }

      const success = await this.writeRepository.marquerMessageCommeLu(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message marqué comme lu' : 'Échec de la mise à jour',
      };
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors du marquage du message comme lu',
      };
    }
  }

  /**
   * Supprimer un message reçu (soft delete)
   */
  async supprimerMessageRecu(messageId: number): Promise<ConfirmationResult> {
    try {
      // Validation: vérifier si le message existe
      const exists = await this.validationRepository.messageExists(messageId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Message introuvable',
        };
      }

      const success = await this.writeRepository.supprimerMessageRecu(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message supprimé avec succès' : 'Échec de la suppression',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la suppression du message',
      };
    }
  }

  /**
   * Restaurer un message supprimé
   */
  async restaurerMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      // Validation: vérifier si le message existe et est supprimé
      const exists = await this.validationRepository.messageExists(messageId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Message introuvable',
        };
      }

      const isDeleted = await this.validationRepository.messageIsDeleted(messageId);
      if (!isDeleted) {
        return {
          isConfirm: false,
          message: "Le message n'est pas supprimé",
        };
      }

      const success = await this.writeRepository.restaurerMessage(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message restauré avec succès' : 'Échec de la restauration',
      };
    } catch (error) {
      console.error('Erreur lors de la restauration du message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la restauration du message',
      };
    }
  }

  /**
   * Supprimer définitivement un message
   */
  async supprimerDefinitivementMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const success = await this.writeRepository.supprimerDefinitivementMessage(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message supprimé définitivement' : 'Échec de la suppression',
      };
    } catch (error) {
      console.error('Erreur lors de la suppression définitive du message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la suppression définitive du message',
      };
    }
  }

  /**
   * Désactiver un message
   */
  async desactiverMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const exists = await this.validationRepository.messageExists(messageId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Message introuvable',
        };
      }

      const success = await this.writeRepository.desactiverMessage(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message désactivé avec succès' : 'Échec de la désactivation',
      };
    } catch (error) {
      console.error('Erreur lors de la désactivation du message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la désactivation du message',
      };
    }
  }

  /**
   * Réactiver un message
   */
  async reactiverMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const exists = await this.validationRepository.messageExists(messageId);
      if (!exists) {
        return {
          isConfirm: false,
          message: 'Message introuvable',
        };
      }

      const success = await this.writeRepository.reactiverMessage(messageId);
      return {
        isConfirm: success,
        message: success ? 'Message réactivé avec succès' : 'Échec de la réactivation',
      };
    } catch (error) {
      console.error('Erreur lors de la réactivation du message:', error);
      return {
        isConfirm: false,
        message: 'Erreur lors de la réactivation du message',
      };
    }
  }

  // ==========================================================================
  // STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques des messages
   */
  async obtenirStatistiquesMessages(): Promise<MessageSearchResult> {
    try {
      const stats = await this.readRepository.getStatistiquesMessages();
      return {
        isFind: true,
        message: 'Statistiques récupérées',
        data: stats,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        isFind: false,
        message: 'Erreur lors de la récupération des statistiques',
        data: null,
      };
    }
  }

  /**
   * Obtenir les statistiques de suppression
   */
  async obtenirStatistiquesSuppressions(): Promise<MessageSearchResult> {
    try {
      const stats = await this.readRepository.getStatistiquesSuppressions();
      return {
        isFind: true,
        message: 'Statistiques de suppression récupérées',
        data: stats,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de suppression:', error);
      return {
        isFind: false,
        message: 'Erreur lors de la récupération des statistiques',
        data: null,
      };
    }
  }

  // ==========================================================================
  // HISTORIQUE DES MESSAGES (EMAILS)
  // ==========================================================================

  /**
   * Récupérer l'historique des messages d'un utilisateur
   */
  async getMessageHistory(
    utilisateurId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<HistoriqueMessage[]> {
    try {
      return await this.readRepository.getMessageHistory(utilisateurId, limit, offset);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return [];
    }
  }

  /**
   * Sauvegarder un message dans l'historique
   */
  async saveMessageToDatabase(data: SaveMessageData): Promise<number | null> {
    try {
      return await this.writeRepository.saveMessageToDatabase(data);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      return null;
    }
  }

  /**
   * Mettre à jour le statut d'un message dans l'historique
   */
  async updateMessageStatus(data: UpdateMessageStatusData): Promise<boolean> {
    try {
      return await this.writeRepository.updateMessageStatus(data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return false;
    }
  }

  // ==========================================================================
  // EMAIL TEMPLATES
  // ==========================================================================

  /**
   * Récupérer tous les templates actifs
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      return await this.readRepository.getAllTemplates();
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      return [];
    }
  }

  /**
   * Récupérer un template par nom
   */
  async getTemplateByName(nomTemplate: string): Promise<EmailTemplate | null> {
    try {
      return await this.readRepository.getTemplateByName(nomTemplate);
    } catch (error) {
      console.error('Erreur lors de la récupération du template:', error);
      return null;
    }
  }

  // ==========================================================================
  // UTILISATEURS (pour emails)
  // ==========================================================================

  /**
   * Récupérer les emails des destinataires
   */
  async obtenirEmailsDestinataires(utilisateursIds: number[]): Promise<any[]> {
    try {
      return await this.readRepository.getEmailsDestinataires(utilisateursIds);
    } catch (error) {
      console.error('Erreur lors de la récupération des emails:', error);
      return [];
    }
  }

  // ==========================================================================
  // ACCÈS AUX SOUS-REPOSITORIES (pour usage avancé)
  // ==========================================================================

  /**
   * Accès au repository de lecture
   */
  get read(): MessagesReadRepository {
    return this.readRepository;
  }

  /**
   * Accès au repository d'écriture
   */
  get write(): MessagesWriteRepository {
    return this.writeRepository;
  }

  /**
   * Accès au repository de validation
   */
  get validation(): MessagesValidationRepository {
    return this.validationRepository;
  }
}

// ==========================================================================
// SINGLETON
// ==========================================================================

let repositoryInstance: MessagesRepository | null = null;

/**
 * Récupérer l'instance singleton du repository Messages
 */
export function getMessagesRepository(): MessagesRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MessagesRepository();
  }
  return repositoryInstance;
}

/**
 * Export par défaut
 */
export default MessagesRepository;
