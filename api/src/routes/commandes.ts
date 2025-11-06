import { Router, Request, Response } from 'express';
// CORRIGÉ: Utiliser verifyToken comme dans les autres routes
import { verifyToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/commandes
 * Récupérer toutes les commandes
 */
router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('🔄 [API] Récupération des commandes...');
    console.log('👤 [API] Utilisateur authentifié:', (req as any).user?.id);
    
    // CORRIGÉ: Utiliser directement le connector MySQL
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const query = `
      SELECT 
        c.*,
        u.nom_utilisateur,
        u.email as utilisateur_email,
        u.first_name,
        u.last_name
      FROM commandes c
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      ORDER BY c.created_at DESC
    `;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('✅ [API] Commandes récupérées:', {
      count: (result as any[]).length,
      statuts: (result as any[]).reduce((acc: any, cmd: any) => {
        acc[cmd.statut] = (acc[cmd.statut] || 0) + 1;
        return acc;
      }, {})
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération commandes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des commandes', 
      error: error.message 
    });
  }
});

/**
 * GET /api/commandes/:id
 * Récupérer une commande par son ID
 */
router.get('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const commandeId = req.params.id;
    console.log('🔄 [API] Récupération commande:', commandeId);
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const query = `
      SELECT 
        c.*,
        u.nom_utilisateur,
        u.email as utilisateur_email,
        u.first_name,
        u.last_name
      FROM commandes c
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE c.id = ? OR c.unique_id = ? OR c.numero_commande = ?
    `;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [commandeId, commandeId, commandeId], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    if (!(result as any[]).length) {
      return res.status(404).json({ 
        message: 'Commande non trouvée' 
      });
    }
    
    res.json((result as any[])[0]);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération commande:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la commande', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/commandes/:id/statut
 * Mettre à jour le statut d'une commande
 */
router.put('/:id/statut', verifyToken, async (req: Request, res: Response) => {
  try {
    const commandeId = req.params.id;
    const { statut } = req.body;
    
    console.log('🔄 [API] Mise à jour statut commande:', { commandeId, statut });
    
    if (!statut) {
      return res.status(400).json({ 
        message: 'Le statut est requis' 
      });
    }
    
    // Valider le statut selon l'enum de la DB
    const statutsValides = ['en attente', 'payée', 'expédiée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Statuts autorisés: ' + statutsValides.join(', ')
      });
    }
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const query = `
      UPDATE commandes 
      SET statut = ? 
      WHERE id = ? OR unique_id = ? OR numero_commande = ?
    `;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [statut, commandeId, commandeId, commandeId], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Commande non trouvée'
      });
    }
    
    console.log('✅ [API] Statut commande mis à jour:', { commandeId, statut });
    res.json({ 
      message: 'Statut mis à jour avec succès',
      commandeId,
      nouveauStatut: statut
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur mise à jour statut:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut', 
      error: error.message 
    });
  }
});

/**
 * GET /api/commandes/stats/overview
 * Obtenir les statistiques des commandes
 */
router.get('/stats/overview', verifyToken, async (req: Request, res: Response) => {
  try {
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const query = `SELECT * FROM commandes ORDER BY created_at DESC`;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    const commandes = result as any[];
    
    const stats = {
      total: commandes.length,
      enAttente: commandes.filter((c: any) => c.statut === 'en attente').length,
      payees: commandes.filter((c: any) => c.statut === 'payée').length,
      expediees: commandes.filter((c: any) => c.statut === 'expédiée').length,
      annulees: commandes.filter((c: any) => c.statut === 'annulée').length,
      chiffreAffaires: commandes
        .filter((c: any) => c.statut === 'payée' || c.statut === 'expédiée')
        .reduce((sum: number, c: any) => sum + parseFloat(c.total || '0'), 0),
      commandesMoyennes: commandes.length > 0 ? 
        commandes.reduce((sum: number, c: any) => sum + parseFloat(c.total || '0'), 0) / commandes.length : 0
    };
    
    res.json(stats);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération stats commandes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques', 
      error: error.message 
    });
  }
});

// AJOUTÉ: Route pour debug de la structure des données
router.get('/debug/structure', verifyToken, async (req: Request, res: Response) => {
  try {
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Structure de la table commandes
    const commandesStructure = await new Promise((resolve, reject) => {
      mysqlConnector.query('DESCRIBE commandes', [], (error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    // Exemple de données
    const sampleQuery = `
      SELECT c.*, u.nom_utilisateur, u.first_name, u.last_name, u.email
      FROM commandes c
      LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
      LIMIT 2
    `;
    
    const sampleData = await new Promise((resolve, reject) => {
      mysqlConnector.query(sampleQuery, [], (error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    
    res.json({
      message: 'Structure et données d\'exemple de la table commandes',
      structure: commandesStructure,
      sampleData: sampleData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [API] Erreur debug structure commandes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la structure', 
      error: error.message 
    });
  }
});

export default router;