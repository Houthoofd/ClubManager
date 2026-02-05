import { Message } from "../../../../db/clients/messages/messages.js";

/**
 * Service pour la gestion des messages personnalisés
 *
 * Ce service encapsule la logique métier pour les opérations sur
 * les messages personnalisés (envoi, réception, suppression, etc.)
 *
 * @class MessagesPersonnalisesService
 */
export class MessagesPersonnalisesService {
  private messageClient: Message;

  constructor(messageClient?: Message) {
    this.messageClient = messageClient || new Message();
  }

  /**
   * Récupérer les messages reçus par un utilisateur
   *
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Liste des messages reçus
   */
  async getMessagesRecus(userId: number) {
    try {
      if (userId <= 0) {
        return {
          success: false,
          message: "ID utilisateur invalide",
          data: [],
        };
      }

      console.log(
        "✅ [MessagesPersonnalisesService] Récupération messages pour userId:",
        userId,
      );

      const result =
        await this.messageClient.obtenirMessagesRecusParUtilisateur(userId);

      if (!result.isFind) {
        return {
          success: false,
          message: result.message || "Aucun message trouvé",
          data: [],
        };
      }

      return {
        success: true,
        message: "Messages récupérés avec succès",
        data: result.data,
        count: result.data?.length || 0,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesRecus:",
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des messages: ${error.message}`,
      );
    }
  }

  /**
   * Marquer un message comme lu
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de l'opération
   */
  async marquerCommeLu(messageId: number) {
    try {
      if (messageId <= 0) {
        return {
          success: false,
          message: "ID message invalide",
        };
      }

      const result = await this.messageClient.marquerMessageCommeLu(messageId);

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || "Erreur lors du marquage du message",
        };
      }

      return {
        success: true,
        message: result.message || "Message marqué comme lu",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur marquerCommeLu:",
        error,
      );
      throw new Error(`Erreur lors du marquage du message: ${error.message}`);
    }
  }

  /**
   * Supprimer un message (soft delete)
   *
   * @param {number} messageId - ID du message
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Résultat de la suppression
   */
  async supprimerMessage(messageId: number, userId: number) {
    try {
      if (messageId <= 0 || userId <= 0) {
        return {
          success: false,
          message: "ID invalide",
        };
      }

      const result = await this.messageClient.supprimerMessageRecu(
        messageId,
        userId,
      );

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || "Erreur lors de la suppression du message",
        };
      }

      return {
        success: true,
        message: result.message || "Message supprimé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur supprimerMessage:",
        error,
      );
      throw new Error(
        `Erreur lors de la suppression du message: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages supprimés (corbeille)
   *
   * @param {number} userId - ID de l'utilisateur
   * @param {number} limit - Limite de résultats
   * @returns {Promise<any>} Liste des messages supprimés
   */
  async getMessagesSupprimes(userId: number, limit: number = 50) {
    try {
      if (userId <= 0) {
        return {
          success: false,
          message: "ID utilisateur invalide",
          data: [],
        };
      }

      const result = await this.messageClient.obtenirMessagesSupprimes(
        userId,
        limit,
      );

      if (!result.isFind) {
        return {
          success: false,
          message: result.message || "Aucun message supprimé trouvé",
          data: [],
        };
      }

      return {
        success: true,
        message: "Messages supprimés récupérés avec succès",
        data: result.data,
        count: result.data?.length || 0,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesSupprimes:",
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des messages supprimés: ${error.message}`,
      );
    }
  }

  /**
   * Restaurer un message supprimé
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de la restauration
   */
  async restaurerMessage(messageId: number) {
    try {
      if (messageId <= 0) {
        return {
          success: false,
          message: "ID message invalide",
        };
      }

      const result = await this.messageClient.restaurerMessage(messageId);

      if (!result.isConfirm) {
        return {
          success: false,
          message:
            result.message || "Erreur lors de la restauration du message",
        };
      }

      return {
        success: true,
        message: result.message || "Message restauré avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur restaurerMessage:",
        error,
      );
      throw new Error(
        `Erreur lors de la restauration du message: ${error.message}`,
      );
    }
  }

  /**
   * Supprimer définitivement un message (admin seulement)
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de la suppression définitive
   */
  async supprimerDefinitivement(messageId: number) {
    try {
      if (messageId <= 0) {
        return {
          success: false,
          message: "ID message invalide",
        };
      }

      const result =
        await this.messageClient.supprimerDefinitivementMessage(messageId);

      if (!result.isConfirm) {
        return {
          success: false,
          message: result.message || "Erreur lors de la suppression définitive",
        };
      }

      return {
        success: true,
        message: result.message || "Message supprimé définitivement",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur supprimerDefinitivement:",
        error,
      );
      throw new Error(
        `Erreur lors de la suppression définitive: ${error.message}`,
      );
    }
  }

  /**
   * Désactiver un message (admin seulement)
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de la désactivation
   */
  async desactiverMessage(messageId: number) {
    try {
      if (messageId <= 0) {
        return {
          success: false,
          message: "ID message invalide",
        };
      }

      const result = await this.messageClient.desactiverMessage(messageId);

      if (!result.isConfirm) {
        return {
          success: false,
          message:
            result.message || "Erreur lors de la désactivation du message",
        };
      }

      return {
        success: true,
        message: result.message || "Message désactivé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur desactiverMessage:",
        error,
      );
      throw new Error(
        `Erreur lors de la désactivation du message: ${error.message}`,
      );
    }
  }

  /**
   * Réactiver un message (admin seulement)
   *
   * @param {number} messageId - ID du message
   * @returns {Promise<any>} Résultat de la réactivation
   */
  async reactiverMessage(messageId: number) {
    try {
      if (messageId <= 0) {
        return {
          success: false,
          message: "ID message invalide",
        };
      }

      const result = await this.messageClient.reactiverMessage(messageId);

      if (!result.isConfirm) {
        return {
          success: false,
          message:
            result.message || "Erreur lors de la réactivation du message",
        };
      }

      return {
        success: true,
        message: result.message || "Message réactivé avec succès",
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur reactiverMessage:",
        error,
      );
      throw new Error(
        `Erreur lors de la réactivation du message: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer les messages inactifs (admin seulement)
   *
   * @param {number} userId - ID de l'utilisateur (optionnel)
   * @param {number} limit - Limite de résultats
   * @returns {Promise<any>} Liste des messages inactifs
   */
  async getMessagesInactifs(userId?: number, limit: number = 50) {
    try {
      const result = await this.messageClient.obtenirMessagesInactifs(
        userId,
        limit,
      );

      if (!result.isFind) {
        return {
          success: false,
          message: result.message || "Aucun message inactif trouvé",
          data: [],
        };
      }

      return {
        success: true,
        message: "Messages inactifs récupérés avec succès",
        data: result.data,
        count: result.data?.length || 0,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getMessagesInactifs:",
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des messages inactifs: ${error.message}`,
      );
    }
  }

  /**
   * Compter les messages non lus d'un utilisateur
   *
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<any>} Nombre de messages non lus
   */
  async compterMessagesNonLus(userId: number) {
    try {
      if (userId <= 0) {
        return {
          success: false,
          message: "ID utilisateur invalide",
          count: 0,
        };
      }

      console.log(
        "🔢 [MessagesPersonnalisesService] Comptage messages non lus pour userId:",
        userId,
      );

      const count = await this.messageClient.compterMessagesNonLus(userId);

      return {
        success: true,
        message: "Comptage effectué avec succès",
        count: count,
        userId: userId,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur compterMessagesNonLus:",
        error,
      );
      throw new Error(
        `Erreur lors du comptage des messages non lus: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un message à plusieurs destinataires avec emails
   *
   * @param {number[]} destinataires - Liste des IDs des destinataires
   * @param {number} typeMessageId - ID du type de message
   * @param {boolean} envoyerEmail - Envoyer aussi par email
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async envoyerMessage(
    destinataires: number[],
    typeMessageId: number,
    envoyerEmail: boolean = true,
  ) {
    try {
      // Validation
      if (!destinataires || destinataires.length === 0) {
        return {
          success: false,
          message: "Liste des destinataires vide",
        };
      }

      if (typeMessageId <= 0) {
        return {
          success: false,
          message: "Type de message invalide",
        };
      }

      console.log("📤 [MessagesPersonnalisesService] Envoi de messages:", {
        destinataires: destinataires.length,
        typeMessageId,
        envoyerEmail,
      });

      // Utiliser la méthode avec envoi email
      const result = await this.messageClient.envoyerMessageAvecEmails(
        destinataires,
        typeMessageId,
        envoyerEmail,
      );

      // Construire la réponse détaillée
      let responseMessage = result.messagesInternes.message;

      if (envoyerEmail && result.emailsEnvoyes) {
        const emailsReussis = result.emailsEnvoyes.filter(
          (e) => e.success,
        ).length;
        const emailsEchecs = result.emailsEnvoyes.filter(
          (e) => !e.success,
        ).length;

        responseMessage += ` • Emails: ${emailsReussis} envoyés avec succès`;
        if (emailsEchecs > 0) {
          responseMessage += `, ${emailsEchecs} échec(s)`;
        }
      }

      console.log("✅ [MessagesPersonnalisesService] Messages envoyés:", {
        messagesInternes: result.messagesInternes.isConfirm,
        emailsEnvoyes: result.emailsEnvoyes?.length || 0,
        typeMessage: result.typeMessage?.title,
      });

      return {
        success: result.messagesInternes.isConfirm,
        message: responseMessage,
        data: {
          messagesInternes: result.messagesInternes,
          emailsEnvoyes: result.emailsEnvoyes,
          typeMessage: result.typeMessage,
          details: {
            totalDestinataires: destinataires.length,
            emailsEnvoyes:
              result.emailsEnvoyes?.filter((e) => e.success).length || 0,
            emailsEchecs:
              result.emailsEnvoyes?.filter((e) => !e.success).length || 0,
            emailsDetails:
              result.emailsEnvoyes?.map((e) => ({
                email: e.email,
                success: e.success,
                messageId: e.messageId,
                error: e.error,
              })) || [],
          },
        },
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur envoyerMessage:",
        error,
      );
      throw new Error(`Erreur lors de l'envoi des messages: ${error.message}`);
    }
  }

  /**
   * Envoyer un rappel de paiement
   *
   * @param {number[]} echeanceIds - Liste des IDs des échéances
   * @param {string} messagePersonnalise - Message personnalisé optionnel
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async envoyerRappelPaiement(
    echeanceIds: number[],
    messagePersonnalise: string = "",
  ) {
    try {
      if (!echeanceIds || echeanceIds.length === 0) {
        return {
          success: false,
          message: "Liste des échéances vide",
        };
      }

      console.log(
        "📧 [MessagesPersonnalisesService] Envoi rappel de paiement:",
        {
          echeanceIds: echeanceIds.length,
          hasCustomMessage: !!messagePersonnalise,
        },
      );

      const result = await this.messageClient.envoyerRappelPaiementAvecEmail(
        echeanceIds,
        messagePersonnalise,
      );

      if (!result.emailEnvoye?.success) {
        return {
          success: false,
          message:
            result.emailEnvoye?.error || "Erreur lors de l'envoi du rappel",
          data: result,
        };
      }

      return {
        success: true,
        message: "Rappel de paiement envoyé avec succès",
        data: result,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur envoyerRappelPaiement:",
        error,
      );
      throw new Error(
        `Erreur lors de l'envoi du rappel de paiement: ${error.message}`,
      );
    }
  }

  /**
   * Obtenir les statistiques des messages
   *
   * @param {string} periode - Période pour les statistiques (jour, semaine, mois)
   * @returns {Promise<any>} Statistiques des messages
   */
  async getStatistiquesMessages(periode: "jour" | "semaine" | "mois" = "mois") {
    try {
      const result =
        await this.messageClient.obtenirStatistiquesMessages(periode);

      if (!result.isFind) {
        return {
          success: false,
          message:
            result.message || "Erreur lors de la récupération des statistiques",
          data: null,
        };
      }

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        data: result.data,
        periode: periode,
      };
    } catch (error: any) {
      console.error(
        "❌ [MessagesPersonnalisesService] Erreur getStatistiquesMessages:",
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
    }
  }
}

// Export d'une instance singleton
export const messagesPersonnalisesService = new MessagesPersonnalisesService();
