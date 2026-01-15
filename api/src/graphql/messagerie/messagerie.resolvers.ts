/**
 * Resolvers GraphQL pour le module Messagerie
 */

import { getMessagerieRepository } from '../../db/clients/messagerie/messagerie.repository.js';
import type {
  TypeMessage,
  MessagePersonnalise,
  MessageAvecExpediteur,
  HistoriqueMessage,
  EmailTemplate,
  UtilisateurMessagerie,
} from '../../db/clients/messagerie/types.js';

/**
 * Contexte GraphQL (à typer selon votre configuration)
 */
interface GraphQLContext {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * Options de pagination
 */
interface PaginationInput {
  limit?: number;
  offset?: number;
}

/**
 * Entrée pour créer un type de message
 */
interface CreateTypeMessageInput {
  title: string;
  content: string;
}

/**
 * Entrée pour mettre à jour un type de message
 */
interface UpdateTypeMessageInput {
  title?: string;
  content?: string;
}

/**
 * Entrée pour créer un message personnalisé
 */
interface CreateMessagePersonnaliseInput {
  utilisateur_id: number;
  contenu: string;
}

/**
 * Entrée pour créer un template d'email
 */
interface CreateEmailTemplateInput {
  title: string;
  subject: string;
  body: string;
  variables?: string[];
}

/**
 * Entrée pour mettre à jour un template d'email
 */
interface UpdateEmailTemplateInput {
  title?: string;
  subject?: string;
  body?: string;
  variables?: string[];
}

/**
 * Entrée pour envoyer un email simple
 */
interface EnvoyerEmailSimpleInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Variable pour template d'email
 */
interface EmailVariableInput {
  key: string;
  value: string;
}

/**
 * Entrée pour envoyer un email avec template
 */
interface EnvoyerEmailTemplateInput {
  to: string;
  templateId: number;
  variables?: EmailVariableInput[];
}

/**
 * Entrée pour envoyer un email de bienvenue
 */
interface EnvoyerEmailBienvenueInput {
  userId: number;
  email: string;
  prenom: string;
}

/**
 * Entrée pour envoyer un email de confirmation
 */
interface EnvoyerEmailConfirmationInput {
  userId: number;
  email: string;
  token: string;
}

/**
 * Resolvers pour la messagerie
 */
export const messagerieResolvers = {
  Query: {
    /**
     * Récupérer tous les types de messages
     */
    typesMessages: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getAllTypesMessages();
      } catch (error) {
        console.error('Erreur lors de la récupération des types de messages:', error);
        throw new Error('Impossible de récupérer les types de messages');
      }
    },

    /**
     * Récupérer un type de message par son ID
     */
    typeMessage: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const typeMessage = await repository.getTypeMessageById(id);
        return typeMessage || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du type de message ${id}:`, error);
        throw new Error('Impossible de récupérer le type de message');
      }
    },

    /**
     * Récupérer un type de message par son titre
     */
    typeMessageParTitre: async (_: any, { title }: { title: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const typeMessage = await repository.getTypeMessageByTitle(title);
        return typeMessage || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du type de message par titre ${title}:`, error);
        throw new Error('Impossible de récupérer le type de message');
      }
    },

    /**
     * Récupérer tous les messages personnalisés
     */
    messagesPersonnalises: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getAllMessagesPersonnalises(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération des messages personnalisés:', error);
        throw new Error('Impossible de récupérer les messages personnalisés');
      }
    },

    /**
     * Récupérer un message personnalisé par son ID
     */
    messagePersonnalise: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const message = await repository.getMessagePersonnaliseById(id);
        return message || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du message personnalisé ${id}:`, error);
        throw new Error('Impossible de récupérer le message personnalisé');
      }
    },

    /**
     * Récupérer les messages d'un utilisateur
     */
    messagesUtilisateur: async (_: any, { utilisateur_id }: { utilisateur_id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getMessagesPersonnalisesByUtilisateur(utilisateur_id);
      } catch (error) {
        console.error(`Erreur lors de la récupération des messages de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer les messages de l\'utilisateur');
      }
    },

    /**
     * Récupérer les messages reçus d'un utilisateur
     */
    messagesRecus: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getMessagesRecus(userId);
      } catch (error) {
        console.error(`Erreur lors de la récupération des messages reçus de l'utilisateur ${userId}:`, error);
        throw new Error('Impossible de récupérer les messages reçus');
      }
    },

    /**
     * Récupérer les messages non lus d'un utilisateur
     */
    messagesNonLus: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getMessagesNonLus(userId);
      } catch (error) {
        console.error(`Erreur lors de la récupération des messages non lus de l'utilisateur ${userId}:`, error);
        throw new Error('Impossible de récupérer les messages non lus');
      }
    },

    /**
     * Compter les messages non lus d'un utilisateur
     */
    compterMessagesNonLus: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.countMessagesNonLus(userId);
      } catch (error) {
        console.error(`Erreur lors du comptage des messages non lus de l'utilisateur ${userId}:`, error);
        return 0;
      }
    },

    /**
     * Récupérer l'historique des messages envoyés
     */
    historiqueMessages: async (_: any, { pagination }: { pagination?: PaginationInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getHistoriqueMessages(limit, offset);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des messages:', error);
        throw new Error('Impossible de récupérer l\'historique des messages');
      }
    },

    /**
     * Récupérer l'historique des messages d'un utilisateur
     */
    historiqueMessagesUtilisateur: async (
      _: any,
      { utilisateur_id, pagination }: { utilisateur_id: number; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getMessagerieRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getHistoriqueMessagesByUtilisateur(utilisateur_id, limit, offset);
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique des messages de l'utilisateur ${utilisateur_id}:`, error);
        throw new Error('Impossible de récupérer l\'historique des messages de l\'utilisateur');
      }
    },

    /**
     * Récupérer les messages par statut
     */
    messagesParStatut: async (
      _: any,
      { status, pagination }: { status: 'pending' | 'sent' | 'failed'; pagination?: PaginationInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getMessagerieRepository();
        const limit = pagination?.limit || 50;
        const offset = pagination?.offset || 0;
        return await repository.getHistoriqueMessagesByStatut(status, limit, offset);
      } catch (error) {
        console.error(`Erreur lors de la récupération des messages par statut ${status}:`, error);
        throw new Error('Impossible de récupérer les messages par statut');
      }
    },

    /**
     * Récupérer tous les templates d'email
     */
    emailTemplates: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getAllEmailTemplates();
      } catch (error) {
        console.error('Erreur lors de la récupération des templates d\'email:', error);
        throw new Error('Impossible de récupérer les templates d\'email');
      }
    },

    /**
     * Récupérer un template d'email par son ID
     */
    emailTemplate: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const template = await repository.getEmailTemplateById(id);
        return template || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du template d'email ${id}:`, error);
        throw new Error('Impossible de récupérer le template d\'email');
      }
    },

    /**
     * Récupérer un template d'email par son titre
     */
    emailTemplateParTitre: async (_: any, { title }: { title: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const template = await repository.getEmailTemplateByTitle(title);
        return template || null;
      } catch (error) {
        console.error(`Erreur lors de la récupération du template d'email par titre ${title}:`, error);
        throw new Error('Impossible de récupérer le template d\'email');
      }
    },

    /**
     * Récupérer les statistiques de la messagerie
     */
    statistiquesMessagerie: async (_: any, { utilisateur_id }: { utilisateur_id?: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getStatistiquesMessages(utilisateur_id);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques de la messagerie:', error);
        throw new Error('Impossible de récupérer les statistiques de la messagerie');
      }
    },

    /**
     * Récupérer tous les utilisateurs pour la messagerie
     */
    utilisateursMessagerie: async (_: any, __: any, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.getAllUtilisateursForMessaging();
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs pour la messagerie:', error);
        throw new Error('Impossible de récupérer les utilisateurs pour la messagerie');
      }
    },

    /**
     * Vérifier si un type de message existe
     */
    typeMessageExiste: async (_: any, { title }: { title: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.typeMessageExists(title);
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'existence du type de message ${title}:`, error);
        return false;
      }
    },

    /**
     * Vérifier si un template existe
     */
    emailTemplateExiste: async (_: any, { title }: { title: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        return await repository.emailTemplateExists(title);
      } catch (error) {
        console.error(`Erreur lors de la vérification de l'existence du template ${title}:`, error);
        return false;
      }
    },
  },

  Mutation: {
    /**
     * Créer un nouveau type de message
     */
    creerTypeMessage: async (_: any, { input }: { input: CreateTypeMessageInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.createTypeMessage(input.title, input.content);
        return {
          isConfirm: true,
          message: 'Type de message créé avec succès',
          insertId: result,
        };
      } catch (error) {
        console.error('Erreur lors de la création du type de message:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création du type de message',
        };
      }
    },

    /**
     * Mettre à jour un type de message
     */
    mettreAJourTypeMessage: async (_: any, { id, input }: { id: number; input: UpdateTypeMessageInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.updateTypeMessage(id, input.title, input.content);
        return {
          isConfirm: true,
          message: 'Type de message mis à jour avec succès',
        };
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du type de message ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour du type de message',
        };
      }
    },

    /**
     * Supprimer un type de message
     */
    supprimerTypeMessage: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.deleteTypeMessage(id);
        return {
          isConfirm: true,
          message: 'Type de message supprimé avec succès',
        };
      } catch (error) {
        console.error(`Erreur lors de la suppression du type de message ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la suppression du type de message',
        };
      }
    },

    /**
     * Créer un message personnalisé
     */
    creerMessagePersonnalise: async (_: any, { input }: { input: CreateMessagePersonnaliseInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.createMessagePersonnalise(input.utilisateur_id, input.contenu);
        return {
          isConfirm: true,
          message: 'Message personnalisé créé avec succès',
          insertId: result,
        };
      } catch (error) {
        console.error('Erreur lors de la création du message personnalisé:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création du message personnalisé',
        };
      }
    },

    /**
     * Envoyer un message personnalisé à un utilisateur
     */
    envoyerMessagePersonnalise: async (
      _: any,
      { utilisateur_id, contenu }: { utilisateur_id: number; contenu: string },
      context: GraphQLContext
    ) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.envoyerMessagePersonnalise(utilisateur_id, contenu);
        return {
          success: result.isConfirm,
          message: result.message,
          messageId: result.insertId,
        };
      } catch (error) {
        console.error(`Erreur lors de l'envoi du message à l'utilisateur ${utilisateur_id}:`, error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi du message',
        };
      }
    },

    /**
     * Envoyer un message à tous les utilisateurs
     */
    envoyerMessageTousUtilisateurs: async (_: any, { contenu }: { contenu: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.envoyerMessageTousUtilisateurs(contenu);
        return {
          success: result.isConfirm,
          message: result.message,
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message à tous les utilisateurs:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi du message à tous les utilisateurs',
        };
      }
    },

    /**
     * Marquer un message comme lu
     */
    marquerMessageLu: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.markMessageAsRead(id);
        return {
          isConfirm: true,
          message: 'Message marqué comme lu',
        };
      } catch (error) {
        console.error(`Erreur lors du marquage du message ${id} comme lu:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage du message comme lu',
        };
      }
    },

    /**
     * Marquer tous les messages d'un utilisateur comme lus
     */
    marquerTousMessagesLus: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.markAllMessagesAsRead(userId);
        return {
          isConfirm: true,
          message: 'Tous les messages marqués comme lus',
        };
      } catch (error) {
        console.error(`Erreur lors du marquage de tous les messages de l'utilisateur ${userId} comme lus:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors du marquage de tous les messages comme lus',
        };
      }
    },

    /**
     * Supprimer un message personnalisé
     */
    supprimerMessagePersonnalise: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.deleteMessagePersonnalise(id);
        return {
          isConfirm: true,
          message: 'Message personnalisé supprimé avec succès',
        };
      } catch (error) {
        console.error(`Erreur lors de la suppression du message personnalisé ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la suppression du message personnalisé',
        };
      }
    },

    /**
     * Créer un nouveau template d'email
     */
    creerEmailTemplate: async (_: any, { input }: { input: CreateEmailTemplateInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.createEmailTemplate(
          input.title,
          input.subject,
          input.body,
          input.variables || []
        );
        return {
          isConfirm: true,
          message: 'Template d\'email créé avec succès',
          insertId: result,
        };
      } catch (error) {
        console.error('Erreur lors de la création du template d\'email:', error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la création du template d\'email',
        };
      }
    },

    /**
     * Mettre à jour un template d'email
     */
    mettreAJourEmailTemplate: async (
      _: any,
      { id, input }: { id: number; input: UpdateEmailTemplateInput },
      context: GraphQLContext
    ) => {
      try {
        const repository = getMessagerieRepository();
        await repository.updateEmailTemplate(id, {
          title: input.title,
          subject: input.subject,
          body: input.body,
          variables: input.variables,
        });
        return {
          isConfirm: true,
          message: 'Template d\'email mis à jour avec succès',
        };
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du template d'email ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la mise à jour du template d\'email',
        };
      }
    },

    /**
     * Supprimer un template d'email
     */
    supprimerEmailTemplate: async (_: any, { id }: { id: number }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        await repository.deleteEmailTemplate(id);
        return {
          isConfirm: true,
          message: 'Template d\'email supprimé avec succès',
        };
      } catch (error) {
        console.error(`Erreur lors de la suppression du template d'email ${id}:`, error);
        return {
          isConfirm: false,
          message: 'Erreur lors de la suppression du template d\'email',
        };
      }
    },

    /**
     * Envoyer un email simple
     */
    envoyerEmailSimple: async (_: any, { input }: { input: EnvoyerEmailSimpleInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.sendEmail({
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        return {
          success: result.success,
          message: result.message,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email simple:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email',
        };
      }
    },

    /**
     * Envoyer un email avec template
     */
    envoyerEmailAvecTemplate: async (_: any, { input }: { input: EnvoyerEmailTemplateInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const variables: Record<string, string> = {};
        if (input.variables) {
          input.variables.forEach((v) => {
            variables[v.key] = v.value;
          });
        }
        const result = await repository.sendEmailWithTemplate(input.to, input.templateId, variables);
        return {
          success: result.success,
          message: result.message,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email avec template:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email avec template',
        };
      }
    },

    /**
     * Envoyer un email de bienvenue
     */
    envoyerEmailBienvenue: async (_: any, { input }: { input: EnvoyerEmailBienvenueInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.sendWelcomeEmail(input.userId, input.email, input.prenom);
        return {
          success: result.success,
          message: result.message,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email de bienvenue',
        };
      }
    },

    /**
     * Envoyer un email de confirmation
     */
    envoyerEmailConfirmation: async (_: any, { input }: { input: EnvoyerEmailConfirmationInput }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.sendConfirmationEmail(input.userId, input.email, input.token);
        return {
          success: result.success,
          message: result.message,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email de confirmation',
        };
      }
    },

    /**
     * Renvoyer un email de confirmation
     */
    renvoyerEmailConfirmation: async (_: any, { userId, email }: { userId: number; email: string }, context: GraphQLContext) => {
      try {
        const repository = getMessagerieRepository();
        const result = await repository.resendConfirmationEmail(userId, email);
        return {
          success: result.success,
          message: result.message,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error('Erreur lors du renvoi de l\'email de confirmation:', error);
        return {
          success: false,
          message: 'Erreur lors du renvoi de l\'email de confirmation',
        };
      }
    },
  },
};
