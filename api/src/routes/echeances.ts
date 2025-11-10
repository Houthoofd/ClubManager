import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Paiements } from '../db/clients/paiements/paiements.js';

const router = express.Router();

// GET - Échéances d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 [Route] GET /echeances/${userId} - Début traitement`);
    
    if (!userId || isNaN(parseInt(userId))) {
      console.error(`❌ [Route] ID utilisateur invalide: ${userId}`);
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const client = new Paiements();
    console.log(`🔍 [Route] Appel de obtenirEcheancesUtilisateur(${userId})`);
    
    const echeances = await client.obtenirEcheancesUtilisateur(parseInt(userId));
    
    console.log(`🔍 [Route] Résultat de obtenirEcheancesUtilisateur:`, echeances);
    console.log(`🔍 [Route] Type:`, typeof echeances, 'Array?', Array.isArray(echeances));
    console.log(`🔍 [Route] Longueur:`, echeances?.length);

    if (!echeances || echeances.length === 0) {
      console.log(`⚠️ [Route] Aucune échéance trouvée pour l'utilisateur ${userId}, retour tableau vide`);
      return res.status(200).json([]); // Retourner un tableau vide plutôt qu'une 404
    }

    console.log(`✅ [Route] Retour de ${echeances.length} échéances pour l'utilisateur ${userId}`);
    res.status(200).json(echeances);
  } catch (error: any) {
    console.error('❌ [Route] Erreur lors de la récupération des échéances:', error);
    console.error('❌ [Route] Stack trace:', error.stack);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
  }
});

// GET - Une échéance spécifique par ID
router.get('/detail/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    console.log(`🔐 [Paiements] Vérification accès sécurisé échéance ${echeanceId} pour utilisateur ${userId}`);
    
    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({ 
        error: 'ID échéance invalide',
        echeanceId: echeanceId
      });
    }

    const paiements = new Paiements();
    
    // SÉCURITÉ RENFORCÉE: Si userId fourni, vérification stricte d'appartenance
    if (userId && !isNaN(parseInt(userId as string))) {
      console.log(`🛡️ [Paiements] Vérification stricte - échéance ${echeanceId} doit appartenir à utilisateur ${userId}`);
      
      // 1. Récupérer TOUTES les échéances de cet utilisateur
      const echeancesUtilisateur = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      console.log(`📋 [Paiements] Utilisateur ${userId} a ${echeancesUtilisateur.length} échéances`);
      
      // 2. Vérifier que l'échéance demandée est dans cette liste
      const echeanceAutorisee = echeancesUtilisateur.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeanceAutorisee) {
        console.error(`❌ [Paiements] SÉCURITÉ: Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`);
        console.error(`📋 [Paiements] Échéances autorisées:`, echeancesUtilisateur.map((e: any) => ({ id: e.id, montant: e.montant })));
        
        return res.status(403).json({ 
          error: 'Accès refusé - Cette échéance ne vous appartient pas',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: parseInt(userId as string),
            message: 'Échéance non trouvée dans la liste des échéances autorisées pour cet utilisateur'
          }
        });
      }

      console.log(`✅ [Paiements] Accès autorisé - Échéance ${echeanceId} appartient bien à l'utilisateur ${userId}`);
      
      // 3. Vérifier que l'échéance n'est pas déjà payée
      if (echeanceAutorisee.statut?.toLowerCase() === 'payé') {
        console.warn(`⚠️ [Paiements] Échéance ${echeanceId} déjà payée`);
        return res.status(400).json({ 
          error: 'Cette échéance est déjà payée',
          debug: {
            echeanceId: parseInt(echeanceId),
            statut: echeanceAutorisee.statut,
            datePaiement: echeanceAutorisee.date_paiement
          }
        });
      }

      // 4. Retourner l'échéance avec enrichissement des données
      const echeanceEnrichie = {
        ...echeanceAutorisee,
        description: echeanceAutorisee.description || `Cotisation mensuelle - ${new Date(echeanceAutorisee.date_echeance).toLocaleDateString('fr-FR')}`,
        utilisateur_autorise: true,
        verification_passed: true
      };

      return res.status(200).json({
        success: true,
        data: echeanceEnrichie,
        security: {
          access_verified: true,
          user_id: parseInt(userId as string),
          echeance_owner: true
        }
      });
    } else {
      // ACCÈS SANS VÉRIFICATION UTILISATEUR (moins sécurisé, pour compatibilité)
      console.warn(`⚠️ [Paiements] Accès échéance ${echeanceId} sans vérification utilisateur (moins sécurisé)`);
      
      try {
        const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
        const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
        
        if (results.length === 0) {
          return res.status(404).json({ 
            error: 'Échéance non trouvée',
            debug: {
              echeanceId: parseInt(echeanceId),
              userId: null,
              message: 'Aucune échéance trouvée avec cet ID'
            }
          });
        }

        const echeance = results[0];
        
        // Vérifier que l'échéance n'est pas déjà payée
        if (echeance.statut?.toLowerCase() === 'payé') {
          return res.status(400).json({ 
            error: 'Cette échéance est déjà payée',
            debug: {
              echeanceId: parseInt(echeanceId),
              statut: echeance.statut,
              datePaiement: echeance.date_paiement
            }
          });
        }

        console.log(`✅ [Paiements] Échéance ${echeanceId} trouvée (sans vérification utilisateur)`);

        return res.status(200).json({
          success: true,
          data: {
            ...echeance,
            description: echeance.description || `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`,
            utilisateur_autorise: false, // Non vérifié
            verification_passed: false
          },
          security: {
            access_verified: false,
            user_id: null,
            echeance_owner: false,
            warning: 'Accès sans vérification utilisateur'
          }
        });
      } catch (dbError: any) {
        console.error(`❌ [Paiements] Erreur DB lors de la recherche directe:`, dbError);
        return res.status(500).json({ 
          error: 'Erreur lors de la recherche de l\'échéance',
          details: dbError.message 
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur récupération échéance sécurisée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});

// NOUVEAU: Route pour compatibilité avec l'ancien système
router.get('/echeance/:echeanceId', async (req, res) => {
  // Rediriger vers la nouvelle route
  const { echeanceId } = req.params;
  const userId = req.query.userId;
  
  console.log(`🔄 [Echeances] Redirection /echeance/${echeanceId} vers /detail/${echeanceId}`);
  
  // Réutiliser la même logique que /detail/:echeanceId
  try {
    const paiements = new Paiements();
    
    if (userId && !isNaN(parseInt(userId as string))) {
      const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      const echeance = echeances.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeance) {
        return res.status(404).json({ 
          error: 'Échéance non trouvée',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: parseInt(userId as string),
            echeancesDisponibles: echeances.map((e: any) => ({ id: e.id, montant: e.montant, statut: e.statut }))
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: echeance
      });
    } else {
      const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
      const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
      
      if (results.length === 0) {
        return res.status(404).json({ 
          error: 'Échéance non trouvée',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: null,
            message: 'Aucune échéance trouvée avec cet ID'
          }
        });
      }

      const echeance = results[0];
      
      return res.status(200).json({
        success: true,
        data: {
          ...echeance,
          description: `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`
        }
      });
    }

  } catch (error: any) {
    console.error('❌ [Echeances] Erreur récupération échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});

// GET - Toutes les échéances (admin)
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, statut, utilisateur_id } = req.query;
    
    console.log(`🔍 [Paiements] Récupération toutes les échéances - Limit: ${limit}, Offset: ${offset}`);
    
    const paiements = new Paiements();
    
    let query = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (statut) {
      query += ` AND ep.statut = ?`;
      params.push(statut);
    }
    
    if (utilisateur_id) {
      query += ` AND ep.utilisateur_id = ?`;
      params.push(parseInt(utilisateur_id as string));
    }
    
    query += ` ORDER BY ep.date_echeance DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), parseInt(offset as string));
    
    const results = await paiements.queryAsync(query, params);
    
    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM echeances_paiements ep
      WHERE 1=1
    `;
    const countParams: any[] = [];
    
    if (statut) {
      countQuery += ` AND ep.statut = ?`;
      countParams.push(statut);
    }
    
    if (utilisateur_id) {
      countQuery += ` AND ep.utilisateur_id = ?`;
      countParams.push(parseInt(utilisateur_id as string));
    }
    
    const countResult = await paiements.queryAsync(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    console.log(`✅ [Paiements] ${results.length} échéances récupérées sur ${total} total`);
    
    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total
      }
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur récupération toutes les échéances:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des échéances',
      details: error.message 
    });
  }
});

// POST - Créer une échéance
router.post('/', verifyToken, async (req: any, res: any) => {
  try {
    const { utilisateur_id, abonnement_id, montant, date_echeance, statut = 'en attente' } = req.body;
    
    console.log(`📝 [Paiements] Création nouvelle échéance:`, req.body);
    
    if (!utilisateur_id || !montant || !date_echeance) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        required: ['utilisateur_id', 'montant', 'date_echeance']
      });
    }

    const paiements = new Paiements();
    
    const echeanceCreee = await paiements.queryAsync(
      'INSERT INTO echeances_paiements (utilisateur_id, abonnement_id, date_echeance, montant, statut) VALUES (?, ?, ?, ?, ?)',
      [utilisateur_id, abonnement_id, date_echeance, montant, 'en attente']
    );

    // Récupérer l'échéance créée
    const echeanceCreeeDetail = await paiements.queryAsync(
      `SELECT * FROM echeances_paiements WHERE id = ?`, 
      [echeanceCreee.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Échéance créée avec succès',
      data: echeanceCreeeDetail[0]
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur création échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'échéance',
      details: error.message 
    });
  }
});

// PUT - Mettre à jour une échéance
router.put('/:id', verifyToken, async (req: any, res: any) => {
  try {
    const echeanceId = parseInt(req.params.id);
    const updates = req.body;
    
    console.log(`📝 [Paiements] Mise à jour échéance ${echeanceId}:`, updates);
    
    if (isNaN(echeanceId)) {
      return res.status(400).json({ 
        error: 'ID échéance invalide' 
      });
    }

    const paiements = new Paiements();
    
    // Vérifier que l'échéance existe
    const existingEcheance = await paiements.queryAsync(
      'SELECT * FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    if (existingEcheance.length === 0) {
      return res.status(404).json({ 
        error: 'Échéance non trouvée' 
      });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const allowedFields = ['montant', 'date_echeance', 'statut', 'date_paiement'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    Object.keys(updates).forEach(field => {
      if (allowedFields.includes(field) && updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun champ valide à mettre à jour',
        allowedFields 
      });
    }
    
    updateValues.push(echeanceId);
    
    const updateQuery = `
      UPDATE echeances_paiements 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    const results = await paiements.queryAsync(updateQuery, updateValues);
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Échéance non trouvée ou non modifiée' 
      });
    }
    
    // Récupérer l'échéance mise à jour
    const echeanceMiseAJour = await paiements.queryAsync(
      'SELECT * FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    console.log(`✅ [Paiements] Échéance ${echeanceId} mise à jour avec succès`);
    
    res.status(200).json({
      success: true,
      message: 'Échéance mise à jour avec succès',
      data: echeanceMiseAJour[0]
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur mise à jour échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de l\'échéance',
      details: error.message 
    });
  }
});

// DELETE - Supprimer une échéance
router.delete('/:id', verifyToken, async (req: any, res: any) => {
  try {
    const echeanceId = parseInt(req.params.id);
    
    console.log(`🗑️ [Paiements] Suppression échéance ${echeanceId}`);
    
    if (isNaN(echeanceId)) {
      return res.status(400).json({ 
        error: 'ID échéance invalide' 
      });
    }

    const paiements = new Paiements();
    
    // Vérifier que l'échéance existe et n'est pas déjà payée
    const existingEcheance = await paiements.queryAsync(
      'SELECT * FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    if (existingEcheance.length === 0) {
      return res.status(404).json({ 
        error: 'Échéance non trouvée' 
      });
    }
    
    if (existingEcheance[0].statut === 'payé') {
      return res.status(400).json({ 
        error: 'Impossible de supprimer une échéance déjà payée' 
      });
    }
    
    const results = await paiements.queryAsync(
      'DELETE FROM echeances_paiements WHERE id = ?',
      [echeanceId]
    );
    
    console.log(`✅ [Paiements] Échéance ${echeanceId} supprimée avec succès`);
    
    res.status(200).json({
      success: true,
      message: 'Échéance supprimée avec succès'
    });

  } catch (error: any) {
    console.error('❌ [Paiements] Erreur suppression échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de l\'échéance',
      details: error.message 
    });
  }
});

export { router as echeancesRoutes };