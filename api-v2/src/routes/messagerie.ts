import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import MysqlConnector from '../db/connector/mysqlconnector.js';

const router = express.Router();
const mysqlConnector = MysqlConnector.getInstance();

// Utilitaire pour utiliser le client avec Promise
function queryAsync(sql: string, values: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    mysqlConnector.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

// ========== GESTION DES TYPES DE MESSAGES ==========

// Route pour récupérer tous les types de messages personnalisés
router.get('/', async (req, res) => {
  try {
    const typesMessages = await queryAsync(
      'SELECT * FROM types_messages_personnalises ORDER BY title',
      []
    );

    res.json({
      success: true,
      data: typesMessages
    });
  } catch (error) {
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

    await queryAsync(
      'INSERT INTO types_messages_personnalises (title, content) VALUES (?, ?)',
      [title, content]
    );

    res.json({
      success: true,
      message: 'Type de message créé avec succès'
    });
  } catch (error) {
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

    await queryAsync(
      'UPDATE types_messages_personnalises SET title = ?, content = ?, updated_at = NOW() WHERE id = ?',
      [title, content, id]
    );

    res.json({
      success: true,
      message: 'Type de message mis à jour avec succès'
    });
  } catch (error) {
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

    await queryAsync(
      'DELETE FROM types_messages_personnalises WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Type de message supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du type de message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========== GESTION DES MESSAGES REÇUS ==========

// Route pour récupérer les messages reçus par un utilisateur
router.get('/recus/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Convertir userId string en id numérique
    const users = await queryAsync(
      'SELECT id FROM utilisateurs WHERE userId = ?',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userIdNum = users[0].id;

    // Récupérer les messages personnalisés de cet utilisateur
    const messagesRecus = await queryAsync(
      `SELECT 
        mp.id,
        mp.contenu,
        mp.created_at as date_reception,
        CONCAT(u.first_name, ' ', u.last_name) as expediteur_nom,
        FALSE as lu
      FROM messages_personnalises mp
      JOIN utilisateurs u ON mp.utilisateur_id = u.id
      WHERE mp.utilisateur_id = ?
      ORDER BY mp.created_at DESC`,
      [userIdNum]
    );

    res.json({
      success: true,
      data: messagesRecus
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages reçus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour marquer un message comme lu
router.put('/recus/:messageId/lu', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Pour l'instant, juste retourner succès car on n'a pas de champ 'lu' dans messages_personnalises
    res.json({
      success: true,
      message: 'Message marqué comme lu'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour supprimer un message reçu
router.delete('/recus/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    await queryAsync(
      'DELETE FROM messages_personnalises WHERE id = ?',
      [messageId]
    );

    res.json({
      success: true,
      message: 'Message supprimé'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ========== ENVOI DE MESSAGES ==========

// Route pour envoyer un message à des utilisateurs
router.post('/envoie', verifyToken, async (req, res) => {
  try {
    const { destinataires, type_message_id } = req.body;
    
    if (!destinataires || !Array.isArray(destinataires) || destinataires.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste de destinataires requise'
      });
    }

    if (!type_message_id) {
      return res.status(400).json({
        success: false,
        message: 'Type de message requis'
      });
    }

    // Récupérer le contenu du type de message
    const typeMessages = await queryAsync(
      'SELECT content FROM types_messages_personnalises WHERE id = ?',
      [type_message_id]
    );

    if (!typeMessages.length) {
      return res.status(404).json({
        success: false,
        message: 'Type de message non trouvé'
      });
    }

    const contenu = typeMessages[0].content;

    // Insérer un message personnalisé pour chaque destinataire
    for (const destinataireId of destinataires) {
      await queryAsync(
        'INSERT INTO messages_personnalises (utilisateur_id, contenu) VALUES (?, ?)',
        [destinataireId, contenu]
      );
    }

    res.json({
      success: true,
      message: `Message envoyé à ${destinataires.length} destinataire(s)`
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
