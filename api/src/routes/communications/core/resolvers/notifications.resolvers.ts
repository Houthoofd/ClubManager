/**
 * 🔄 Notifications Resolvers - GraphQL
 *
 * Resolvers pour le système de notifications utilisateur
 * Mappe user_notifications vers le type Notifications GraphQL
 */

import type { GraphQLContext } from "@/types/graphql.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";
import { getUserIdFromContext, requireAuth } from "@/shared/middleware/auth.middleware.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";

/**
 * Extrait un titre du contenu de la notification
 * Prend les 100 premiers caractères ou jusqu'au premier point
 */
function extractTitle(content: string): string {
  if (!content) return "";

  const maxLength = 100;
  const firstDot = content.indexOf('.');
  const firstNewline = content.indexOf('\n');

  // Trouver le premier séparateur
  const separators = [firstDot, firstNewline].filter(i => i > 0);
  const firstSeparator = separators.length > 0 ? Math.min(...separators) : -1;

  if (firstSeparator > 0 && firstSeparator < maxLength) {
    return content.substring(0, firstSeparator).trim();
  }

  if (content.length <= maxLength) {
    return content.trim();
  }

  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Resolvers GraphQL pour Notifications
 */
export const notificationsResolvers = {
  Query: {
    /**
     * Récupère les notifications d'un utilisateur
     */
    notifications: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que l'utilisateur ne peut voir que ses propres notifications
      // sauf s'il est admin
      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez voir que vos propres notifications");
      }

      const notifications = await prisma.user_notifications.findMany({
        where: {
          user_id: args.userId
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              role: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 100 // Limiter à 100 notifications les plus récentes
      });

      return notifications.map(n => ({
        id: n.id,
        user_id: n.user_id!,
        title: extractTitle(n.content),
        message: n.content,
        type: n.type,
        read: n.lu || false,
        read_at: n.lu ? n.created_at?.toISOString() : null,
        created_at: n.created_at?.toISOString() || new Date().toISOString(),
        user: n.users
      }));
    }
  },

  Mutation: {
    /**
     * Crée une nouvelle notification
     */
    createNotification: async (
      _parent: unknown,
      args: {
        input: {
          user_id?: number;
          user_ids?: number[];
          title: string;
          message: string;
          type: string;
        }
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      // Seuls les admins peuvent créer des notifications pour d'autres utilisateurs
      if (context.user?.role !== 'admin') {
        throw new ValidationError("Seuls les administrateurs peuvent créer des notifications");
      }

      const { user_id, user_ids, title, message, type } = args.input;

      // Validation
      if (!user_id && (!user_ids || user_ids.length === 0)) {
        throw new ValidationError("Au moins un destinataire est requis");
      }

      if (!message || message.trim().length === 0) {
        throw new ValidationError("Le message ne peut pas être vide");
      }

      // Créer pour un seul utilisateur
      if (user_id) {
        const notification = await prisma.user_notifications.create({
          data: {
            user_id,
            type,
            content: message,
            lu: false,
            created_at: new Date()
          },
          include: {
            users: {
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

        return {
          id: notification.id,
          user_id: notification.user_id!,
          title: extractTitle(notification.content),
          message: notification.content,
          type: notification.type,
          read: false,
          read_at: null,
          created_at: notification.created_at?.toISOString() || new Date().toISOString(),
          user: notification.users
        };
      }

      // Créer pour plusieurs utilisateurs
      if (user_ids && user_ids.length > 0) {
        await prisma.user_notifications.createMany({
          data: user_ids.map(uid => ({
            user_id: uid,
            type,
            content: message,
            lu: false,
            created_at: new Date()
          }))
        });

        // Retourner la première notification créée (convention)
        const firstNotification = await prisma.user_notifications.findFirst({
          where: {
            user_id: user_ids[0],
            type,
            content: message
          },
          orderBy: {
            created_at: 'desc'
          },
          include: {
            users: {
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

        if (!firstNotification) {
          throw new Error("Erreur lors de la création des notifications");
        }

        return {
          id: firstNotification.id,
          user_id: firstNotification.user_id!,
          title: extractTitle(firstNotification.content),
          message: firstNotification.content,
          type: firstNotification.type,
          read: false,
          read_at: null,
          created_at: firstNotification.created_at?.toISOString() || new Date().toISOString(),
          user: firstNotification.users
        };
      }

      throw new ValidationError("Aucune notification créée");
    },

    /**
     * Marque une notification comme lue
     */
    markNotificationAsRead: async (
      _parent: unknown,
      args: { notificationId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que la notification appartient bien à l'utilisateur
      const notification = await prisma.user_notifications.findUnique({
        where: { id: args.notificationId }
      });

      if (!notification) {
        throw new NotFoundError("Notification non trouvée");
      }

      if (notification.user_id !== currentUserId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez marquer comme lue que vos propres notifications");
      }

      const updated = await prisma.user_notifications.update({
        where: { id: args.notificationId },
        data: { lu: true },
        include: {
          users: {
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

      return {
        id: updated.id,
        user_id: updated.user_id!,
        title: extractTitle(updated.content),
        message: updated.content,
        type: updated.type,
        read: true,
        read_at: updated.created_at?.toISOString() || new Date().toISOString(),
        created_at: updated.created_at?.toISOString() || new Date().toISOString(),
        user: updated.users
      };
    },

    /**
     * Marque toutes les notifications comme lues
     */
    markAllNotificationsAsRead: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez marquer que vos propres notifications");
      }

      const result = await prisma.user_notifications.updateMany({
        where: {
          user_id: args.userId,
          lu: false
        },
        data: {
          lu: true
        }
      });

      return {
        success: true,
        message: `${result.count} notification(s) marquée(s) comme lue(s)`
      };
    },

    /**
     * Supprime une notification
     */
    deleteNotification: async (
      _parent: unknown,
      args: { notificationId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      // Vérifier que la notification appartient bien à l'utilisateur
      const notification = await prisma.user_notifications.findUnique({
        where: { id: args.notificationId }
      });

      if (!notification) {
        throw new NotFoundError("Notification non trouvée");
      }

      if (notification.user_id !== currentUserId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez supprimer que vos propres notifications");
      }

      await prisma.user_notifications.delete({
        where: { id: args.notificationId }
      });

      return {
        success: true,
        message: "Notification supprimée avec succès"
      };
    },

    /**
     * Supprime toutes les notifications lues d'un utilisateur
     */
    deleteReadNotifications: async (
      _parent: unknown,
      args: { userId: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      const currentUserId = getUserIdFromContext(context);

      if (currentUserId !== args.userId && context.user?.role !== 'admin') {
        throw new ValidationError("Vous ne pouvez supprimer que vos propres notifications");
      }

      const result = await prisma.user_notifications.deleteMany({
        where: {
          user_id: args.userId,
          lu: true
        }
      });

      return {
        success: true,
        message: `${result.count} notification(s) supprimée(s)`
      };
    }
  }
};

export default notificationsResolvers;
