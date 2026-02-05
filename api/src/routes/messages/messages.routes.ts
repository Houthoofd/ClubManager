import express from 'express';
import { verifyToken } from '../../middleware/auth.js';

// Import des handlers
import {
  // Types de messages
  getAllTypesMessages,
  createTypeMessage,
  updateTypeMessage,
  deleteTypeMessage,
  getTypeMessageById,

  // Messages personnalisés
  getMessagesRecus,
  marquerMessageCommeLu,
  supprimerMessage,
  getMessagesSupprimes,
  restaurerMessage,
  supprimerDefinitivement,
  desactiverMessage,
  reactiverMessage,
  getMessagesInactifs,
  compterMessagesNonLus,
  envoyerMessage,
  envoyerRappelPaiement,
  getStatistiquesMessages,

  // Emails
  sendWelcomeEmail,
  sendValidationEmail,
  recoverUserId,
  confirmEmail,
  sendCustomEmail,
  sendTestEmail,
  getAllTemplates,
  sendTemplateEmail,
  getMessageHistory,
  getEmailStats,
  cleanupExpiredTokens,
  testConfiguration,
} from './core/handlers/index.js';

const router = express.Router();

console.log('🔧 [Messages Routes] Initialisation des routes messages refactorisées');

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * Health check du module
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'active',
    module: 'messages',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * =============================================================================
 * ROUTES POUR LES TYPES DE MESSAGES
 * =============================================================================
 */

/**
 * GET /api/messages/types
 * Récupérer tous les types de messages personnalisés
 */
router.get('/types', getAllTypesMessages);

/**
 * GET /api/messages/types/:id
 * Récupérer un type de message par son ID
 */
router.get('/types/:id', getTypeMessageById);

/**
 * POST /api/messages/types
 * Créer un nouveau type de message
 *
 * Body:
 * {
 *   title: string,
 *   content: string
 * }
 */
router.post('/types', verifyToken, createTypeMessage);

/**
 * PUT /api/messages/types/:id
 * Modifier un type de message existant
 *
 * Params:
 * - id: number - ID du type de message
 *
 * Body:
 * {
 *   title?: string,
 *   content?: string
 * }
 */
router.put('/types/:id', verifyToken, updateTypeMessage);

/**
 * DELETE /api/messages/types/:id
 * Supprimer un type de message
 *
 * Params:
 * - id: number - ID du type de message
 */
router.delete('/types/:id', verifyToken, deleteTypeMessage);

/**
 * =============================================================================
 * ROUTES POUR LES MESSAGES PERSONNALISÉS
 * =============================================================================
 */

/**
 * GET /api/messages/recus/:userId
 * Récupérer les messages reçus par un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
router.get('/recus/:userId', getMessagesRecus);

/**
 * GET /api/messages/non-lus/:userId
 * Compter les messages non lus d'un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
router.get('/non-lus/:userId', compterMessagesNonLus);

/**
 * GET /api/messages/corbeille/:userId
 * Récupérer les messages supprimés (corbeille)
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Query:
 * - limit?: number - Limite de résultats (défaut: 50)
 */
router.get('/corbeille/:userId', verifyToken, getMessagesSupprimes);

/**
 * GET /api/messages/inactifs/:userId?
 * Récupérer les messages inactifs (admin seulement)
 *
 * Params:
 * - userId?: number - ID de l'utilisateur (optionnel)
 *
 * Query:
 * - limit?: number - Limite de résultats (défaut: 50)
 */
router.get('/inactifs/:userId?', verifyToken, getMessagesInactifs);

/**
 * PUT /api/messages/:messageId/marquer-lu
 * Marquer un message comme lu
 *
 * Params:
 * - messageId: number - ID du message
 */
router.put('/:messageId/marquer-lu', verifyToken, marquerMessageCommeLu);

/**
 * PUT /api/messages/:messageId/restaurer
 * Restaurer un message supprimé
 *
 * Params:
 * - messageId: number - ID du message
 */
router.put('/:messageId/restaurer', verifyToken, restaurerMessage);

/**
 * PUT /api/messages/:messageId/desactiver
 * Désactiver un message (admin seulement)
 *
 * Params:
 * - messageId: number - ID du message
 */
router.put('/:messageId/desactiver', verifyToken, desactiverMessage);

/**
 * PUT /api/messages/:messageId/reactiver
 * Réactiver un message (admin seulement)
 *
 * Params:
 * - messageId: number - ID du message
 */
router.put('/:messageId/reactiver', verifyToken, reactiverMessage);

/**
 * DELETE /api/messages/:messageId
 * Supprimer un message (soft delete)
 *
 * Params:
 * - messageId: number - ID du message
 */
router.delete('/:messageId', verifyToken, supprimerMessage);

/**
 * DELETE /api/messages/:messageId/definitif
 * Supprimer définitivement un message (admin seulement)
 *
 * Params:
 * - messageId: number - ID du message
 */
router.delete('/:messageId/definitif', verifyToken, supprimerDefinitivement);

/**
 * POST /api/messages/envoie
 * Envoyer un message à plusieurs destinataires
 *
 * Body:
 * {
 *   destinataires: number[],
 *   type_message_id: number,
 *   envoyerEmail?: boolean (défaut: true)
 * }
 */
router.post('/envoie', verifyToken, envoyerMessage);

/**
 * POST /api/messages/envoyer-rappel
 * Envoyer un rappel de paiement
 *
 * Body:
 * {
 *   echeanceIds: number[],
 *   messagePersonnalise?: string
 * }
 */
router.post('/envoyer-rappel', envoyerRappelPaiement);

/**
 * GET /api/messages/admin/stats-completes
 * Obtenir les statistiques des messages (admin seulement)
 *
 * Query:
 * - periode?: 'jour' | 'semaine' | 'mois' (défaut: 'mois')
 */
router.get('/admin/stats-completes', verifyToken, getStatistiquesMessages);

/**
 * Alias pour la route de statistiques de suppression
 */
router.get('/admin/stats-suppression', verifyToken, getStatistiquesMessages);

/**
 * =============================================================================
 * ROUTES POUR LES EMAILS
 * =============================================================================
 */

/**
 * POST /api/messages/emails/welcome
 * Envoyer un email de bienvenue
 *
 * Body:
 * {
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   userId: string,
 *   utilisateurId?: number
 * }
 */
router.post('/emails/welcome', sendWelcomeEmail);

/**
 * POST /api/messages/emails/validation
 * Envoyer un email de validation
 *
 * Body:
 * {
 *   email: string,
 *   firstName: string,
 *   userId: string,
 *   utilisateurId?: number
 * }
 */
router.post('/emails/validation', sendValidationEmail);

/**
 * POST /api/messages/emails/recover-userid
 * Récupérer l'userId par email
 *
 * Body:
 * {
 *   email: string
 * }
 */
router.post('/emails/recover-userid', recoverUserId);

/**
 * GET /api/messages/emails/confirm-email/:token
 * Confirmer un email via token
 *
 * Params:
 * - token: string - Token de validation
 */
router.get('/emails/confirm-email/:token', confirmEmail);

/**
 * POST /api/messages/emails/send-custom
 * Envoyer un email personnalisé
 *
 * Body:
 * {
 *   to: string,
 *   subject: string,
 *   html?: string,
 *   text?: string,
 *   cc?: string,
 *   bcc?: string,
 *   saveToDb?: boolean,
 *   utilisateurId?: number,
 *   type_message?: string
 * }
 */
router.post('/emails/send-custom', verifyToken, sendCustomEmail);

/**
 * POST /api/messages/emails/send-test
 * Envoyer un email de test
 *
 * Body:
 * {
 *   email: string
 * }
 */
router.post('/emails/send-test', verifyToken, sendTestEmail);

/**
 * GET /api/messages/emails/templates
 * Obtenir tous les templates d'emails
 */
router.get('/emails/templates', verifyToken, getAllTemplates);

/**
 * POST /api/messages/emails/send-template
 * Envoyer un email avec template
 *
 * Body:
 * {
 *   templateTitle: string,
 *   to: string,
 *   variables?: Record<string, any>,
 *   saveToDb?: boolean,
 *   utilisateurId?: number
 * }
 */
router.post('/emails/send-template', verifyToken, sendTemplateEmail);

/**
 * GET /api/messages/emails/history/:utilisateurId
 * Obtenir l'historique des messages d'un utilisateur
 *
 * Params:
 * - utilisateurId: number - ID de l'utilisateur
 *
 * Query:
 * - limit?: number - Limite de résultats (défaut: 100)
 */
router.get('/emails/history/:utilisateurId', verifyToken, getMessageHistory);

/**
 * GET /api/messages/emails/stats/:utilisateurId
 * Obtenir les statistiques d'emails d'un utilisateur
 *
 * Params:
 * - utilisateurId: number - ID de l'utilisateur
 *
 * Query:
 * - limit?: number - Limite de résultats (défaut: 1000)
 */
router.get('/emails/stats/:utilisateurId', verifyToken, getEmailStats);

/**
 * DELETE /api/messages/emails/cleanup-expired-tokens
 * Nettoyer les tokens expirés
 */
router.delete('/emails/cleanup-expired-tokens', verifyToken, cleanupExpiredTokens);

/**
 * GET /api/messages/emails/test-config
 * Tester la configuration email
 */
router.get('/emails/test-config', verifyToken, testConfiguration);

/**
 * =============================================================================
 * ROUTE PAR DÉFAUT - INFO MODULE
 * =============================================================================
 */

/**
 * GET /api/messages
 * Informations générales sur le module messages
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    module: 'messages',
    version: '2.0.0',
    architecture: 'handlers/services/validators',
    features: {
      types_messages: true,
      messages_personnalises: true,
      envoi_emails: true,
      templates_emails: true,
      validation_emails: true,
      statistiques: true,
      soft_delete: true,
      corbeille: true,
    },
    routes: {
      types_messages: [
        'GET /types',
        'GET /types/:id',
        'POST /types',
        'PUT /types/:id',
        'DELETE /types/:id',
      ],
      messages_personnalises: [
        'GET /recus/:userId',
        'GET /non-lus/:userId',
        'GET /corbeille/:userId',
        'GET /inactifs/:userId?',
        'PUT /:messageId/marquer-lu',
        'PUT /:messageId/restaurer',
        'PUT /:messageId/desactiver',
        'PUT /:messageId/reactiver',
        'DELETE /:messageId',
        'DELETE /:messageId/definitif',
        'POST /envoie',
        'POST /envoyer-rappel',
        'GET /admin/stats-completes',
      ],
      emails: [
        'POST /emails/welcome',
        'POST /emails/validation',
        'POST /emails/recover-userid',
        'GET /emails/confirm-email/:token',
        'POST /emails/send-custom',
        'POST /emails/send-test',
        'GET /emails/templates',
        'POST /emails/send-template',
        'GET /emails/history/:utilisateurId',
        'GET /emails/stats/:utilisateurId',
        'DELETE /emails/cleanup-expired-tokens',
        'GET /emails/test-config',
      ],
    },
    documentation: 'Voir les commentaires JSDoc sur chaque route',
    timestamp: new Date().toISOString(),
  });
});

console.log('✅ [Messages Routes] Routes messages chargées');

export default router;
