import { Router, Request, Response } from 'express';
// CORRIGÉ: Utiliser verifyToken comme dans les autres routes
import { verifyToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/stocks
 * Récupérer tous les stocks
 */
router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('🔄 [API] Récupération des stocks...');
    console.log('👤 [API] Utilisateur authentifié:', (req as any).user?.id);
    
    // CORRIGÉ: Utiliser directement le connector MySQL
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // CORRIGÉ: D'abord vérifier la structure de la table stocks
    const describeQuery = `DESCRIBE stocks`;
    
    const tableStructure = await new Promise((resolve, reject) => {
      mysqlConnector.query(describeQuery, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    console.log('📊 [API] Structure de la table stocks:', tableStructure);
    
    // MODIFIÉ: Requête adaptée selon la structure réelle de votre table
    const query = `
      SELECT 
        s.*,
        a.nom as article_nom,
        a.prix as article_prix,
        a.description as article_description
      FROM stocks s
      LEFT JOIN articles a ON s.article_id = a.id
      ORDER BY s.article_id
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
    
    console.log('✅ [API] Stocks récupérés:', {
      count: (result as any[]).length,
      structure: 'Table structure logged above',
      sample: (result as any[]).slice(0, 2)
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération stocks:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des stocks', 
      error: error.message 
    });
  }
});

/**
 * GET /api/stocks/article/:articleId
 * Récupérer les stocks d'un article spécifique
 */
router.get('/article/:articleId', verifyToken, async (req: Request, res: Response) => {
  try {
    const articleId = parseInt(req.params.articleId);
    
    if (isNaN(articleId)) {
      return res.status(400).json({ 
        message: 'ID article invalide' 
      });
    }
    
    console.log('🔄 [API] Récupération stocks article:', articleId);
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // MODIFIÉ: Requête adaptée selon la structure réelle
    const query = `
      SELECT 
        s.*,
        a.nom as article_nom,
        a.prix as article_prix,
        a.description as article_description
      FROM stocks s
      LEFT JOIN articles a ON s.article_id = a.id
      WHERE s.article_id = ?
    `;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [articleId], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération stocks article:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des stocks de l\'article', 
      error: error.message 
    });
  }
});

/**
 * PUT /api/stocks/update
 * Mettre à jour un stock
 */
router.put('/update', verifyToken, async (req: Request, res: Response) => {
  try {
    const { article_id, quantite, operation = 'set', ...otherFields } = req.body;
    
    console.log('🔄 [API] Mise à jour stock:', { article_id, quantite, operation, otherFields });
    
    if (!article_id || quantite === undefined) {
      return res.status(400).json({ 
        message: 'article_id et quantite sont requis' 
      });
    }
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // MODIFIÉ: Requête adaptée selon la structure réelle (sans taille pour l'instant)
    let query: string;
    let params: any[];
    
    if (operation === 'set') {
      query = `UPDATE stocks SET quantite = ? WHERE article_id = ?`;
      params = [quantite, article_id];
    } else if (operation === 'add') {
      query = `UPDATE stocks SET quantite = quantite + ? WHERE article_id = ?`;
      params = [quantite, article_id];
    } else if (operation === 'subtract') {
      query = `UPDATE stocks SET quantite = GREATEST(0, quantite - ?) WHERE article_id = ?`;
      params = [quantite, article_id];
    } else {
      return res.status(400).json({ 
        message: 'Opération invalide. Opérations autorisées: set, add, subtract' 
      });
    }
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, params, (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Stock non trouvé pour cet article'
      });
    }
    
    console.log('✅ [API] Stock mis à jour:', { article_id, quantite });
    res.json({ 
      message: 'Stock mis à jour avec succès',
      article_id,
      quantite,
      operation
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erreur mise à jour stock:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du stock', 
      error: error.message 
    });
  }
});

/**
 * GET /api/stocks/alertes
 * Obtenir les alertes de stock (stocks bas)
 */
router.get('/alertes', verifyToken, async (req: Request, res: Response) => {
  try {
    console.log('🔄 [API] Récupération alertes de stock...');
    
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const seuilAlerte = parseInt(req.query.seuil as string) || 5;
    
    // MODIFIÉ: Requête adaptée selon la structure réelle
    const query = `
      SELECT 
        s.*,
        a.nom as article_nom,
        a.prix as article_prix,
        a.description as article_description
      FROM stocks s
      LEFT JOIN articles a ON s.article_id = a.id
      WHERE s.quantite <= ? AND s.quantite >= 0
      ORDER BY s.quantite ASC, s.article_id
    `;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [seuilAlerte], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    const alertes = result as any[];
    
    console.log('⚠️ [API] Alertes de stock:', {
      alertes: alertes.length,
      seuil: seuilAlerte
    });
    
    res.json(alertes);
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération alertes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des alertes de stock', 
      error: error.message 
    });
  }
});

// AJOUTÉ: Route pour obtenir la structure de la table stocks (debug)
router.get('/debug/structure', verifyToken, async (req: Request, res: Response) => {
  try {
    const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    const query = `DESCRIBE stocks`;
    
    const result = await new Promise((resolve, reject) => {
      mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    
    res.json({
      message: 'Structure de la table stocks',
      structure: result
    });
  } catch (error: any) {
    console.error('❌ [API] Erreur récupération structure:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la structure', 
      error: error.message 
    });
  }
});

export default router;
