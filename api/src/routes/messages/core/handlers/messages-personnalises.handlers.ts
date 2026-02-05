import { Request, Response } from 'express';
import { messagesPersonnalisesService } from '../services/messages-personnalises.service.js';
import {
  sendMessageSchema,
  markAsReadSchema,
  getUserMessagesSchema,
  deleteMessageSchema,
  restoreMessageSchema,
  messageStatsSchema,
  sendPaymentReminderSchema,
  countUnreadMessagesSchema,
  toggleMessageStatusSchema,
} from '../validators/messages.schemas.js';
import { z } from 'zod';

/**
 * Fonction utilitaire pour récupérer le rôle utilisateur
 */
const getUserRole = (req: any): string | null => {
  return req.user?.role || req.user?.status || null;
};

/**
 * Fonction utilitaire pour vérifier les permissions admin
 */
const isAdmin = (req: any): boolean => {
  const userRole = getUserRole(req);
  return userRole === 'super-administrateur' || userRole === 'administrateur';
};

/**
 * Handler pour récupérer les messages reçus par un utilisateur
 *
 * @route GET /api/messages/recus/:userId
 * @access Public (temporairement sans auth)
 */
export const getMessagesRecus = async (req: Request, res: Response) => {
  try {
    console.log('📩 [MessagesPersonnalisesHandler] Récupération messages reçus:', req.params.userId);

    // Validation de l'userId
    const { userId } = getUserMessagesSchema.parse({
      userId: req.params.userId,
      limit: req.query.limit as string
    });

    const result = await messagesPersonnalisesService.getMessagesRecus(userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      count: result.count,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur getMessagesRecus:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour marquer un message comme lu
 *
 * @route PUT /api/messages/:messageId/marquer-lu
 * @access Protected
 */
export const marquerMessageCommeLu = async (req: Request, res: Response) => {
  try {
    console.log('✅ [MessagesPersonnalisesHandler] Marquer message comme lu:', req.params.messageId);

    const { messageId } = markAsReadSchema.parse(req.params);

    const result = await messagesPersonnalisesService.marquerCommeLu(messageId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur marquerMessageCommeLu:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du marquage du message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour supprimer un message (soft delete)
 *
 * @route DELETE /api/messages/:messageId
 * @access Protected
 */
export const supprimerMessage = async (req: any, res: Response) => {
  try {
    console.log('🗑️ [MessagesPersonnalisesHandler] Suppression message:', req.params.messageId);

    const { messageId } = deleteMessageSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    const result = await messagesPersonnalisesService.supprimerMessage(messageId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur supprimerMessage:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour récupérer les messages supprimés (corbeille)
 *
 * @route GET /api/messages/corbeille/:userId
 * @access Protected
 */
export const getMessagesSupprimes = async (req: Request, res: Response) => {
  try {
    console.log('🗑️ [MessagesPersonnalisesHandler] Récupération corbeille:', req.params.userId);

    const validatedData = getUserMessagesSchema.parse({
      userId: req.params.userId,
      limit: req.query.limit as string,
    });

    const result = await messagesPersonnalisesService.getMessagesSupprimes(
      validatedData.userId,
      parseInt(validatedData.limit as any)
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      count: result.count,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur getMessagesSupprimes:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la corbeille',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour restaurer un message supprimé
 *
 * @route PUT /api/messages/:messageId/restaurer
 * @access Protected
 */
export const restaurerMessage = async (req: Request, res: Response) => {
  try {
    console.log('♻️ [MessagesPersonnalisesHandler] Restauration message:', req.params.messageId);

    const { messageId } = restoreMessageSchema.parse(req.params);

    const result = await messagesPersonnalisesService.restaurerMessage(messageId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur restaurerMessage:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la restauration du message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour supprimer définitivement un message (admin seulement)
 *
 * @route DELETE /api/messages/:messageId/definitif
 * @access Protected (admin)
 */
export const supprimerDefinitivement = async (req: any, res: Response) => {
  try {
    console.log('⚠️ [MessagesPersonnalisesHandler] Suppression définitive:', req.params.messageId);

    // Vérifier les permissions admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
      });
    }

    const { messageId } = deleteMessageSchema.parse(req.params);

    const result = await messagesPersonnalisesService.supprimerDefinitivement(messageId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur supprimerDefinitivement:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression définitive',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour désactiver un message (admin seulement)
 *
 * @route PUT /api/messages/:messageId/desactiver
 * @access Protected (admin)
 */
export const desactiverMessage = async (req: any, res: Response) => {
  try {
    console.log('🚫 [MessagesPersonnalisesHandler] Désactivation message:', req.params.messageId);

    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
      });
    }

    const { messageId } = toggleMessageStatusSchema.parse(req.params);

    const result = await messagesPersonnalisesService.desactiverMessage(messageId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur desactiverMessage:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la désactivation du message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour réactiver un message (admin seulement)
 *
 * @route PUT /api/messages/:messageId/reactiver
 * @access Protected (admin)
 */
export const reactiverMessage = async (req: any, res: Response) => {
  try {
    console.log('✅ [MessagesPersonnalisesHandler] Réactivation message:', req.params.messageId);

    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
      });
    }

    const { messageId } = toggleMessageStatusSchema.parse(req.params);

    const result = await messagesPersonnalisesService.reactiverMessage(messageId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur reactiverMessage:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID message invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réactivation du message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour récupérer les messages inactifs (admin seulement)
 *
 * @route GET /api/messages/inactifs/:userId?
 * @access Protected (admin)
 */
export const getMessagesInactifs = async (req: any, res: Response) => {
  try {
    console.log('📋 [MessagesPersonnalisesHandler] Récupération messages inactifs');

    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
      });
    }

    const userId = req.params.userId ? parseInt(req.params.userId) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await messagesPersonnalisesService.getMessagesInactifs(userId, limit);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      count: result.count,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur getMessagesInactifs:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des messages inactifs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour compter les messages non lus d'un utilisateur
 *
 * @route GET /api/messages/non-lus/:userId
 * @access Public
 */
export const compterMessagesNonLus = async (req: Request, res: Response) => {
  try {
    console.log('🔢 [MessagesPersonnalisesHandler] Comptage messages non lus:', req.params.userId);

    const { userId } = countUnreadMessagesSchema.parse(req.params);

    const result = await messagesPersonnalisesService.compterMessagesNonLus(userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        count: result.count,
        userId: result.userId,
      },
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur compterMessagesNonLus:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du comptage des messages non lus',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour envoyer un message à plusieurs destinataires
 *
 * @route POST /api/messages/envoie
 * @access Protected
 */
export const envoyerMessage = async (req: Request, res: Response) => {
  try {
    console.log('📤 [MessagesPersonnalisesHandler] Envoi de messages');

    const validatedData = sendMessageSchema.parse(req.body);

    const result = await messagesPersonnalisesService.envoyerMessage(
      validatedData.destinataires,
      validatedData.type_message_id,
      validatedData.envoyerEmail
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur envoyerMessage:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi des messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour envoyer un rappel de paiement
 *
 * @route POST /api/messages/envoyer-rappel
 * @access Public
 */
export const envoyerRappelPaiement = async (req: Request, res: Response) => {
  try {
    console.log('📧 [MessagesPersonnalisesHandler] Envoi rappel de paiement');

    const validatedData = sendPaymentReminderSchema.parse(req.body);

    const result = await messagesPersonnalisesService.envoyerRappelPaiement(
      validatedData.echeanceIds as number[],
      validatedData.messagePersonnalise
    );

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
        data: result.data,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur envoyerRappelPaiement:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du rappel de paiement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour obtenir les statistiques des messages (admin)
 *
 * @route GET /api/messages/admin/stats-completes
 * @access Protected (admin)
 */
export const getStatistiquesMessages = async (req: any, res: Response) => {
  try {
    console.log('📊 [MessagesPersonnalisesHandler] Récupération statistiques messages');

    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
      });
    }

    const validatedData = messageStatsSchema.parse({
      periode: req.query.periode,
      userId: req.query.userId,
    });

    const result = await messagesPersonnalisesService.getStatistiquesMessages(
      validatedData.periode as 'jour' | 'semaine' | 'mois'
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      periode: result.periode,
    });
  } catch (error: any) {
    console.error('❌ [MessagesPersonnalisesHandler] Erreur getStatistiquesMessages:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
