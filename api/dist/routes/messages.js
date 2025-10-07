import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Message } from '../db/clients/messages/messages.js';
const router = Router();
const messageClient = new Message();
// Ajoutons un middleware de debug au début
router.use((req, res, next) => {
    console.log(`🔍 [Messages Route] ${req.method} ${req.path} - Params:`, req.params, 'Query:', req.query);
    next();
});
// MODIFIÉ: Fonction utilitaire pour récupérer le rôle utilisateur
const getUserRole = (req) => {
    return req.user?.role || req.user?.status || null;
};
// MODIFIÉ: Fonction utilitaire pour vérifier les permissions admin
const isAdmin = (req) => {
    const userRole = getUserRole(req);
    return userRole === 'super-administrateur' || userRole === 'administrateur';
};
// ========== GESTION DES TYPES DE MESSAGES ==========
// Route pour récupérer tous les types de messages personnalisés
router.get('/', async (req, res) => {
    try {
        const result = await messageClient.obtenirTousLesTypesDeMessages();
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des types de messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Route pour créer un nouveau type de message
router.post('/types', verifyToken, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title et content sont requis'
            });
        }
        const result = await messageClient.creerTypeMessage(title, content);
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la création du type de message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Route pour modifier un type de message
router.put('/types/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title et content sont requis'
            });
        }
        const result = await messageClient.modifierTypeMessage(parseInt(id), title, content);
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour du type de message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Route pour supprimer un type de message
router.delete('/types/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await messageClient.supprimerTypeMessage(parseInt(id));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la suppression du type de message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// ========== GESTION DES MESSAGES REÇUS ==========
// Route pour récupérer les messages reçus par un utilisateur
router.get('/recus/:userId', async (req, res) => {
    try {
        console.log('🚀 [Messages] Route /recus/:userId appelée avec:', req.params);
        const { userId } = req.params;
        console.log('🔍 [Messages] Récupération messages pour userId:', userId, 'typeof:', typeof userId);
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            console.log('❌ [Messages] ID utilisateur invalide:', userId);
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        console.log('✅ [Messages] UserID converti:', userIdNum);
        const result = await messageClient.obtenirMessagesRecusParUtilisateur(userIdNum);
        console.log('📩 [Messages] Résultat requête:', { isFind: result.isFind, dataLength: result.data?.length || 0 });
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('❌ [Messages] Erreur lors de la récupération des messages reçus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Route pour marquer un message comme lu
router.put('/:messageId/marquer-lu', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const result = await messageClient.marquerMessageCommeLu(parseInt(messageId));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour du message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Route pour supprimer un message reçu (soft delete)
router.delete('/:messageId', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        // Récupérer l'ID de l'utilisateur depuis le token JWT
        const userId = req.user?.id;
        const result = await messageClient.supprimerMessageRecu(parseInt(messageId), userId);
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour récupérer les messages supprimés (corbeille)
router.get('/corbeille/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const result = await messageClient.obtenirMessagesSupprimes(parseInt(userId), limit);
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération de la corbeille:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour restaurer un message supprimé
router.put('/:messageId/restaurer', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const result = await messageClient.restaurerMessage(parseInt(messageId));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la restauration du message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour suppression définitive (admin seulement)
router.delete('/:messageId/definitif', verifyToken, async (req, res) => {
    try {
        // Vérifier les permissions admin
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const { messageId } = req.params;
        const result = await messageClient.supprimerDefinitivementMessage(parseInt(messageId));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la suppression définitive:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour les statistiques de suppression (admin)
router.get('/admin/stats-suppression', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const periode = req.query.periode || 'mois';
        const result = await messageClient.obtenirStatistiquesMessages(periode);
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour désactiver un message
router.put('/:messageId/desactiver', verifyToken, async (req, res) => {
    try {
        // Vérifier les permissions (admin/super-admin seulement)
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const { messageId } = req.params;
        const result = await messageClient.desactiverMessage(parseInt(messageId));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la désactivation du message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour réactiver un message
router.put('/:messageId/reactiver', verifyToken, async (req, res) => {
    try {
        // Vérifier les permissions (admin/super-admin seulement)
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const { messageId } = req.params;
        const result = await messageClient.reactiverMessage(parseInt(messageId));
        if (result.isConfirm) {
            res.json({
                success: true,
                message: result.message
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la réactivation du message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour récupérer les messages inactifs
router.get('/inactifs/:userId?', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const result = await messageClient.obtenirMessagesInactifs(userId ? parseInt(userId) : undefined, limit);
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des messages inactifs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// NOUVEAU: Route pour les statistiques complètes (admin)
router.get('/admin/stats-completes', verifyToken, async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
        }
        const periode = req.query.periode || 'mois';
        const result = await messageClient.obtenirStatistiquesMessages(periode);
        if (result.isFind) {
            res.json({
                success: true,
                data: result.data
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: result.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la récupération des statistiques complètes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// ========== ENVOI DE MESSAGES ==========
// Route pour envoyer un message à des utilisateurs avec double notification
router.post('/envoie', verifyToken, async (req, res) => {
    try {
        const { destinataires, type_message_id, envoyerEmail = true } = req.body;
        console.log('📤 [API] Envoi de messages:', {
            destinataires: destinataires?.length || 0,
            type_message_id,
            envoyerEmail
        });
        // Validation
        if (!destinataires || !Array.isArray(destinataires) || destinataires.length === 0) {
            return res.status(400).json({
                isConfirm: false,
                message: 'Liste des destinataires manquante ou vide'
            });
        }
        if (!type_message_id) {
            return res.status(400).json({
                isConfirm: false,
                message: 'Type de message manquant'
            });
        }
        // Utiliser la méthode avec VRAI envoi email
        const result = await messageClient.envoyerMessageAvecEmails(destinataires, parseInt(type_message_id), envoyerEmail);
        // Log détaillé du résultat RÉEL
        console.log('✅ [API] Messages envoyés:', {
            messagesInternes: result.messagesInternes.isConfirm,
            emailsEnvoyes: result.emailsEnvoyes?.length || 0,
            typeMessage: result.typeMessage?.title
        });
        // Réponse détaillée avec VRAIS résultats d'emails
        let responseMessage = result.messagesInternes.message;
        if (envoyerEmail && result.emailsEnvoyes) {
            const emailsReussis = result.emailsEnvoyes.filter(e => e.success).length;
            const emailsEchecs = result.emailsEnvoyes.filter(e => !e.success).length;
            responseMessage += ` • Emails: ${emailsReussis} envoyés avec succès`;
            if (emailsEchecs > 0) {
                responseMessage += `, ${emailsEchecs} échec(s)`;
            }
        }
        res.status(200).json({
            isConfirm: true,
            message: responseMessage,
            data: {
                messagesInternes: result.messagesInternes,
                emailsEnvoyes: result.emailsEnvoyes,
                typeMessage: result.typeMessage,
                details: {
                    totalDestinataires: destinataires.length,
                    emailsEnvoyes: result.emailsEnvoyes?.filter(e => e.success).length || 0,
                    emailsEchecs: result.emailsEnvoyes?.filter(e => !e.success).length || 0,
                    emailsDetails: result.emailsEnvoyes?.map(e => ({
                        email: e.email,
                        success: e.success,
                        messageId: e.messageId,
                        error: e.error
                    })) || []
                }
            }
        });
    }
    catch (error) {
        console.error('❌ [API] Erreur lors de l\'envoi des messages:', error.message);
        res.status(500).json({
            isConfirm: false,
            message: 'Erreur serveur lors de l\'envoi des messages',
            error: error.message
        });
    }
});
// NOUVEAU: Route pour compter les messages non lus d'un utilisateur
router.get('/non-lus/:userId', async (req, res) => {
    try {
        console.log('🔢 [Messages] Route /non-lus/:userId appelée avec:', req.params);
        const { userId } = req.params;
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            console.log('❌ [Messages] ID utilisateur invalide:', userId);
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        console.log('✅ [Messages] Comptage des messages non lus pour userId:', userIdNum);
        const count = await messageClient.compterMessagesNonLus(userIdNum);
        console.log(`📊 [Messages] Résultat comptage: ${count} messages non lus`);
        res.json({
            success: true,
            data: {
                count: count,
                userId: userIdNum
            }
        });
    }
    catch (error) {
        console.error('❌ [Messages] Erreur lors du comptage des messages non lus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du comptage des messages non lus'
        });
    }
});
// CORRIGÉ: Route pour envoyer un rappel de paiement avec debug amélioré
router.post('/envoyer-rappel', verifyToken, async (req, res) => {
    try {
        const { userId, typeRappel = 'paiement', echeanceId, montant, dateEcheance } = req.body;
        console.log('📧 [Messages] Requête de rappel reçue:', {
            userId,
            typeRappel,
            echeanceId,
            montant,
            dateEcheance,
            userFromToken: req.user?.id,
            userRole: getUserRole(req)
        });
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur manquant'
            });
        }
        // Vérifier les permissions
        const userRole = getUserRole(req);
        const currentUserId = req.user?.id;
        const canSendReminder = ['super-administrateur', 'administrateur', 'professeur'].includes(userRole || '')
            || parseInt(userId) === currentUserId;
        if (!canSendReminder) {
            console.log(`❌ [Messages] Permissions insuffisantes pour ${userRole}, userId: ${currentUserId}, targetUser: ${userId}`);
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes pour envoyer des rappels'
            });
        }
        console.log(`📧 [Messages] Envoi rappel ${typeRappel} à l'utilisateur ${userId}${echeanceId ? ` pour l'échéance ${echeanceId}` : ''}`);
        if (typeRappel === 'paiement') {
            // CORRIGÉ: Debug des variables d'environnement
            console.log('🔧 [Messages] Variables d\'environnement:');
            console.log('  - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Définie' : 'NON DÉFINIE');
            console.log('  - SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NON DÉFINIE');
            console.log('  - SENDGRID_SANDBOX:', process.env.SENDGRID_SANDBOX);
            console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL || 'NON DÉFINIE');
            // Utiliser la nouvelle méthode avec email et lien
            const result = await messageClient.envoyerRappelPaiementAvecEmail(currentUserId || 1, parseInt(userId), echeanceId ? parseInt(echeanceId) : undefined, montant ? parseFloat(montant) : undefined, dateEcheance);
            console.log('📊 [Messages] Résultat envoi rappel:', {
                messageInterne: result.messageInterne.isConfirm,
                emailEnvoye: result.emailEnvoye
            });
            if (result.messageInterne.isConfirm) {
                let responseMessage = 'Rappel de paiement envoyé avec succès';
                if (result.emailEnvoye) {
                    if (result.emailEnvoye.success) {
                        responseMessage += ` et email envoyé à ${result.emailEnvoye.email}`;
                        console.log(`✅ [Messages] Email envoyé avec succès à ${result.emailEnvoye.email} - ID: ${result.emailEnvoye.messageId}`);
                    }
                    else {
                        responseMessage += ` mais échec de l'envoi email: ${result.emailEnvoye.error}`;
                        console.error(`❌ [Messages] Échec envoi email: ${result.emailEnvoye.error}`);
                    }
                }
                else {
                    responseMessage += ' mais aucun email configuré pour cet utilisateur';
                    console.warn(`⚠️ [Messages] Aucun email trouvé pour l'utilisateur ${userId}`);
                }
                res.json({
                    success: true,
                    message: responseMessage,
                    data: {
                        userId: parseInt(userId),
                        typeRappel,
                        echeanceId: echeanceId || null,
                        messageInterne: result.messageInterne,
                        emailEnvoye: result.emailEnvoye,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            else {
                throw new Error(result.messageInterne.message || 'Échec de l\'envoi du message interne');
            }
        }
        else {
            // Pour les autres types de rappels, utiliser l'ancienne méthode
            const titre = typeRappel === 'cours' ? 'Rappel de cours' : 'Rappel';
            const contenu = typeRappel === 'cours'
                ? 'Nous vous rappelons que vous avez des cours programmés cette semaine.'
                : 'Ceci est un rappel automatique du club.';
            const result = await messageClient.envoyerMessagePersonnalise(currentUserId || 1, parseInt(userId), titre, contenu);
            if (result.isConfirm) {
                res.json({
                    success: true,
                    message: `Rappel ${typeRappel} envoyé avec succès`,
                    data: {
                        userId: parseInt(userId),
                        typeRappel,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            else {
                throw new Error(result.message || 'Échec de l\'envoi du message');
            }
        }
    }
    catch (error) {
        console.error('❌ [Messages] Erreur lors de l\'envoi du rappel:', error);
        console.error('❌ [Messages] Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'envoi du rappel',
            error: error.message
        });
    }
});
export default router;
