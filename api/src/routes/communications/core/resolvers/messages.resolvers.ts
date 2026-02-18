/**
 * 🔄 Messages Resolvers - GraphQL
 *
 * Resolvers pour le système de messagerie avec support multi-destinataires
 * Utilise direct_messages + message_read_status pour mapper vers Messages/MessageRecipients
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";
import { getUserIdFromContext, requireAuth } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

/**
 * Resolvers GraphQL pour Messages
 */
export const messagesResolvers = {
  Query: {
    /**
     * Récupère les types de messages
     */
    messageTypes: async (
      _parent: unknown,
      _args: Record<string, never>,
      context: GraphQLContext
    ) => {
      requireAuth(context);

      const types = await prisma.custom_message_types.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
      });

      return types.map(t => ({
        id: t.id,
        type_name: t.name,
        description: t.description,
        active: t.active,
        created_at: null, // Pas dans la table
        updated_at: null  // Pas dans la table
      }));
    },

    /**
     * Récupère les messages reçus par un utilisateur
     */
    messagesReceived: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que l'utilisateur ne peut voir que ses propres messages
      // sauf s'il est admin
      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez voir que vos propres messages");
      }

      const recipients = await prisma.message_read_status.findMany({
        where: {
          user_id: args.userId,
          deleted_at: null
        },
        include: {
          direct_messages: {
            include: {
              users_direct_messages_sender_idTousers: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: {
          id: 'desc' // Plus récents en premier
        }
      });

      return recipients.map(r => ({
        id: r.id,
        message_id: r.message_id,
        recipient_id: args.userId,
        read: r.read_at !== null,
        read_at: r.read_at?.toISOString() || null,
        deleted: false,
        created_at: r.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
        recipient: null, // Sera résolu par le field resolver
        message: {
          id: r.direct_messages.id,
          sender_id: r.direct_messages.sender_id,
          type_message_id: null, // direct_messages n'a pas de type
          subject: r.direct_messages.subject,
          content: r.direct_messages.content,
          sent_at: r.direct_messages.sent_at?.toISOString() || null,
          created_at: r.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
          sender: r.direct_messages.users_direct_messages_sender_idTousers,
          messageType: null,
          recipients: [] // Sera résolu si nécessaire
        }
      }));
    },

    /**
     * Récupère les messages supprimés (corbeille)
     */
    messagesTrashed: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez voir que votre propre corbeille");
      }

      const recipients = await prisma.message_read_status.findMany({
        where: {
          user_id: args.userId,
          deleted_at: { not: null }
        },
        include: {
          direct_messages: {
            include: {
              users_direct_messages_sender_idTousers: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: {
          deleted_at: 'desc'
        }
      });

      return recipients.map(r => ({
        id: r.id,
        message_id: r.message_id,
        recipient_id: args.userId,
        read: r.read_at !== null,
        read_at: r.read_at?.toISOString() || null,
        deleted: true,
        created_at: r.deleted_at?.toISOString() || new Date().toISOString(),
        message: {
          id: r.direct_messages.id,
          sender_id: r.direct_messages.sender_id,
          type_message_id: null,
          subject: r.direct_messages.subject,
          content: r.direct_messages.content,
          sent_at: r.direct_messages.sent_at?.toISOString() || null,
          created_at: r.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
          sender: r.direct_messages.users_direct_messages_sender_idTousers,
          messageType: null,
          recipients: []
        }
      }));
    },

    /**
     * Compte les messages non lus d'un utilisateur
     */
    unreadMessagesCount: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez voir que votre propre compteur");
      }

      const count = await prisma.message_read_status.count({
        where: {
          user_id: args.userId,
          read_at: null,
          deleted_at: null
        }
      });

      return { count };
    }
  },

  Mutation: {
    /**
     * Crée un nouveau type de message (admin seulement)
     */
    createMessageType: async (
      _parent: unknown,
      args: { input: { type_name: string; description?: string; active?: boolean } },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (context.user?.role !== 'admin') {
        throw new ValidationError("Seuls les administrateurs peuvent créer des types de messages");
      }

      const type = await prisma.custom_message_types.create({
        data: {
          name: args.input.type_name,
          type_code: args.input.type_name.toLowerCase().replace(/\s+/g, '_'),
          description: args.input.description || null,
          active: args.input.active !== undefined ? args.input.active : true
        }
      });

      return {
        id: type.id,
        type_name: type.name,
        description: type.description,
        active: type.active,
        created_at: null,
        updated_at: null
      };
    },

    /**
     * Met à jour un type de message
     */
    updateMessageType: async (
      _parent: unknown,
      args: { id: number; input: { type_name?: string; description?: string; active?: boolean } },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (context.user?.role !== 'admin') {
        throw new ValidationError("Seuls les administrateurs peuvent modifier des types de messages");
      }

      const type = await prisma.custom_message_types.update({
        where: { id: args.id },
        data: {
          name: args.input.type_name,
          description: args.input.description,
          active: args.input.active
        }
      });

      return {
        id: type.id,
        type_name: type.name,
        description: type.description,
        active: type.active,
        created_at: null,
        updated_at: null
      };
    },

    /**
     * Supprime un type de message
     */
    deleteMessageType: async (
      _parent: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      if (context.user?.role !== 'admin') {
        throw new ValidationError("Seuls les administrateurs peuvent supprimer des types de messages");
      }

      await prisma.custom_message_types.delete({
        where: { id: args.id }
      });

      return {
        success: true,
        message: "Type de message supprimé avec succès"
      };
    },

    /**
     * Envoie un message à un ou plusieurs destinataires
     */
    sendMessage: async (
      _parent: unknown,
      args: {
        input: {
          sender_id: number;
          type_message_id?: number;
          subject?: string;
          content: string;
          recipient_ids: number[];
        }
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que l'utilisateur envoie en son nom (sauf admin)
      if (currentUserId !== args.input.sender_id && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez envoyer des messages qu'en votre nom");
      }

      // Validation
      if (!args.input.recipient_ids || args.input.recipient_ids.length === 0) {
        throw new ValidationError("Au moins un destinataire est requis");
      }

      if (!args.input.content || args.input.content.trim().length === 0) {
        throw new ValidationError("Le contenu du message ne peut pas être vide");
      }

      // Transaction pour créer le message et tous les statuts
      const result = await prisma.$transaction(async (tx) => {
        // 1. Créer le message principal
        const message = await tx.direct_messages.create({
          data: {
            sender_id: args.input.sender_id,
            receiver_id: null, // On utilise message_read_status pour les destinataires
            content: args.input.content,
            subject: args.input.subject || null,
            sent_at: new Date()
          },
          include: {
            users_direct_messages_sender_idTousers: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role: true
              }
            }
          }
        });

        // 2. Créer les statuts de lecture pour chaque destinataire
        await tx.message_read_status.createMany({
          data: args.input.recipient_ids.map(recipient_id => ({
            message_id: message.id,
            user_id: recipient_id,
            read_at: null,
            deleted_at: null
          }))
        });

        // 3. Créer une notification pour chaque destinataire
        await tx.user_notifications.createMany({
          data: args.input.recipient_ids.map(recipient_id => ({
            user_id: recipient_id,
            message_id: message.id,
            type: 'message',
            content: `Nouveau message de ${message.users_direct_messages_sender_idTousers.first_name} ${message.users_direct_messages_sender_idTousers.last_name}: ${args.input.subject || args.input.content.substring(0, 50)}`,
            lu: false
          }))
        });

        return message;
      });

      return {
        id: result.id,
        sender_id: result.sender_id,
        type_message_id: args.input.type_message_id || null,
        subject: result.subject,
        content: result.content,
        sent_at: result.sent_at?.toISOString() || null,
        created_at: result.sent_at?.toISOString() || new Date().toISOString(),
        sender: result.users_direct_messages_sender_idTousers,
        messageType: null,
        recipients: []
      };
    },

    /**
     * Marque un message comme lu
     */
    markMessageAsRead: async (
      _parent: unknown,
      args: { recipientId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que le statut appartient bien à l'utilisateur
      const status = await prisma.message_read_status.findUnique({
        where: { id: args.recipientId }
      });

      if (!status) {
        throw new NotFoundError("Statut de message non trouvé");
      }

      if (status.user_id !== currentUserId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez marquer comme lu que vos propres messages");
      }

      const updated = await prisma.message_read_status.update({
        where: { id: args.recipientId },
        data: { read_at: new Date() },
        include: {
          direct_messages: {
            include: {
              users_direct_messages_sender_idTousers: true
            }
          }
        }
      });

      return {
        id: updated.id,
        message_id: updated.message_id,
        recipient_id: updated.user_id!,
        read: true,
        read_at: updated.read_at?.toISOString() || null,
        deleted: updated.deleted_at !== null,
        created_at: updated.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
        message: {
          id: updated.direct_messages.id,
          sender_id: updated.direct_messages.sender_id,
          type_message_id: null,
          subject: updated.direct_messages.subject,
          content: updated.direct_messages.content,
          sent_at: updated.direct_messages.sent_at?.toISOString() || null,
          created_at: updated.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
          sender: updated.direct_messages.users_direct_messages_sender_idTousers,
          messageType: null,
          recipients: []
        }
      };
    },

    /**
     * Supprime un message reçu (le met dans la corbeille)
     */
    deleteReceivedMessage: async (
      _parent: unknown,
      args: { recipientId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que le statut appartient bien à l'utilisateur
      const status = await prisma.message_read_status.findUnique({
        where: { id: args.recipientId }
      });

      if (!status) {
        throw new NotFoundError("Statut de message non trouvé");
      }

      if (status.user_id !== currentUserId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez supprimer que vos propres messages");
      }

      await prisma.message_read_status.update({
        where: { id: args.recipientId },
        data: { deleted_at: new Date() }
      });

      return {
        success: true,
        message: "Message déplacé dans la corbeille"
      };
    },

    /**
     * Restaure un message depuis la corbeille
     */
    restoreMessage: async (
      _parent: unknown,
      args: { recipientId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que le statut appartient bien à l'utilisateur
      const status = await prisma.message_read_status.findUnique({
        where: { id: args.recipientId }
      });

      if (!status) {
        throw new NotFoundError("Statut de message non trouvé");
      }

      if (status.user_id !== currentUserId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez restaurer que vos propres messages");
      }

      const updated = await prisma.message_read_status.update({
        where: { id: args.recipientId },
        data: { deleted_at: null },
        include: {
          direct_messages: {
            include: {
              users_direct_messages_sender_idTousers: true
            }
          }
        }
      });

      return {
        id: updated.id,
        message_id: updated.message_id,
        recipient_id: updated.user_id!,
        read: updated.read_at !== null,
        read_at: updated.read_at?.toISOString() || null,
        deleted: false,
        created_at: updated.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
        message: {
          id: updated.direct_messages.id,
          sender_id: updated.direct_messages.sender_id,
          type_message_id: null,
          subject: updated.direct_messages.subject,
          content: updated.direct_messages.content,
          sent_at: updated.direct_messages.sent_at?.toISOString() || null,
          created_at: updated.direct_messages.sent_at?.toISOString() || new Date().toISOString(),
          sender: updated.direct_messages.users_direct_messages_sender_idTousers,
          messageType: null,
          recipients: []
        }
      };
    }
  }
};

export default messagesResolvers;
