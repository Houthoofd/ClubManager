import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { Message } from '../db/clients/messages/messages.js';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);


router.get('/', async (req: any, res: any) => {
  try {
    let client = new Message();
    const result = await client.obtenirTousLesTypesDeMessages();
    
    if (result.isFind) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({ success: false, error: 'Aucun type de message trouvé.' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des messages :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Nouvel endpoint pour récupérer les messages reçus par un utilisateur
router.get('/recus/:userId', async (req: any, res: any) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ success: false, error: 'ID utilisateur invalide.' });
  }

  try {
    const client = new Message();
    const result = await client.obtenirMessagesRecusParUtilisateur(parseInt(userId));
    
    if (result.isFind) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des messages reçus :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour marquer un message comme lu
router.put('/:messageId/marquer-lu', async (req: any, res: any) => {
  const { messageId } = req.params;

  if (!messageId || isNaN(parseInt(messageId))) {
    return res.status(400).json({ success: false, error: 'ID message invalide.' });
  }

  try {
    const client = new Message();
    const result = await client.marquerMessageCommeLu(parseInt(messageId));
    
    if (result.isConfirm) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({ success: false, error: 'Impossible de marquer le message comme lu.' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour supprimer un message reçu
router.delete('/:messageId', async (req: any, res: any) => {
  const { messageId } = req.params;

  if (!messageId || isNaN(parseInt(messageId))) {
    return res.status(400).json({ success: false, error: 'ID message invalide.' });
  }

  try {
    const client = new Message();
    const result = await client.supprimerMessageRecu(parseInt(messageId));
    
    if (result.isConfirm) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({ success: false, error: 'Impossible de supprimer le message.' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du message :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour créer un type de message
router.post('/types', async (req: any, res: any) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Le titre et le contenu sont requis.' });
  }

  try {
    const client = new Message();
    const result = await client.creerTypeMessage(title, content);

    if (result.isConfirm) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(400).json({ success: false, error: 'Impossible de créer le type de message.' });
    }
  } catch (error) {
    console.error('Erreur lors de la création du type de message :', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour modifier un type de message
router.put('/types/:id', async (req: any, res: any) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: 'ID type de message invalide.' });
  }

  if (!title || !content) {
    return res.status(400).json({ success: false, error: 'Le titre et le contenu sont requis.' });
  }

  try {
    const client = new Message();
    const result = await client.modifierTypeMessage(parseInt(id), title, content);

    if (result.isConfirm) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(400).json({ success: false, error: 'Impossible de modifier le type de message.' });
    }
  } catch (error) {
    console.error('Erreur lors de la modification du type de message :', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour supprimer un type de message
router.delete('/types/:id', async (req: any, res: any) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: 'ID type de message invalide.' });
  }

  try {
    const client = new Message();
    const result = await client.supprimerTypeMessage(parseInt(id));

    if (result.isConfirm) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(400).json({ success: false, error: 'Impossible de supprimer le type de message.' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du type de message :', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

// Endpoint pour envoyer un message avec type_message_id
router.post('/envoie', async (req: any, res: any) => {
  const { destinataires, type_message_id } = req.body;

  if (!Array.isArray(destinataires) || destinataires.length === 0) {
    return res.status(400).json({ success: false, error: 'Les destinataires sont requis.' });
  }

  if (!type_message_id) {
    return res.status(400).json({ success: false, error: 'Le type de message est requis.' });
  }

  try {
    const client = new Message();
    
    // Récupérer le contenu du type de message
    const typeMessage = await client.obtenirTypeMessageParId(parseInt(type_message_id));
    if (!typeMessage) {
      return res.status(404).json({ success: false, error: 'Type de message non trouvé.' });
    }

    // Envoyer le message pour chaque destinataire
    const results = await Promise.all(
      destinataires.map(async (userId: number) => {
        return await client.envoyerMessagePersonnalise(
          req.user?.id || 1, // ID de l'expéditeur (depuis le token JWT ou défaut)
          userId,
          typeMessage.title,
          typeMessage.content
        );
      })
    );

    return res.json({
      success: true,
      message: `Message envoyé à ${destinataires.length} destinataire(s).`,
      message_sent_count: destinataires.length,
      results
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'envoi des messages'
    });
  }
});

// Endpoint pour compter les messages non lus d'un utilisateur
router.get('/non-lus/:userId', async (req: any, res: any) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ success: false, error: 'ID utilisateur invalide.' });
  }

  try {
    const client = new Message();
    const count = await client.compterMessagesNonLus(parseInt(userId));
    
    res.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Erreur lors du comptage des messages non lus :', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
});

export default router;
