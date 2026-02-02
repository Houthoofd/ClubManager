import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Paiements } from '../db/clients/paiements/paiements.js';

const router = express.Router();

console.log('🔧 [Échéances] Module échéances initialisé');

// DÉPLACÉ DEPUIS paiements.ts - Routes pour les échéances

// GET - Obtenir toutes les échéances d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 [Échéances] GET /${userId} - Récupération échéances`);
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const paiements = new Paiements();
    const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
    
    if (!echeances || echeances.length === 0) {
      console.log(`⚠️ [Échéances] Aucune échéance pour utilisateur ${userId}`);
      return res.status(200).json([]);
    }

    console.log(`✅ [Échéances] ${echeances.length} échéances trouvées`);
    res.status(200).json(echeances);
  } catch (error: any) {
    console.error('❌ [Échéances] Erreur GET /:userId:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
  }
});

// GET - Récupérer les détails d'une échéance spécifique (sécurisé) - OPTIMISÉ SANS CACHE
router.get('/detail/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = (req as any).user?.id;

    console.log('🔍 [Echeances] Récupération détail échéance:', {
      echeanceId,
      userId,
      userFromToken: !!userId,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      return res.status(401).json({
        error: 'Utilisateur non authentifié',
        details: 'Token invalide ou manquant'
      });
    }

    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({
        error: 'ID échéance invalide',
        received: echeanceId
      });
    }

    const paiements = new Paiements();
    
    // OPTIMISÉ: Requête unique avec toutes les informations nécessaires
    const query = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        CASE 
          WHEN ep.date_echeance < NOW() AND ep.statut != 'payé' THEN 'en_retard'
          ELSE ep.statut
        END as statut_calcule
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      WHERE ep.id = ? AND ep.utilisateur_id = ?
    `;

    const results = await paiements.queryAsync(query, [parseInt(echeanceId), userId]);

    if (results.length === 0) {
      console.warn('⚠️ [Echeances] Échéance non trouvée ou accès non autorisé:', {
        echeanceId,
        userId
      });
      
      return res.status(404).json({
        error: 'Échéance non trouvée',
        message: 'Cette échéance n\'existe pas ou ne vous appartient pas',
        echeanceId: parseInt(echeanceId),
        userId
      });
    }

    const echeance = results[0];
    
    // SIMPLIFIÉ: Format de réponse direct sans cache
    const echeanceFormatee = {
      id: echeance.id,
      utilisateur_id: echeance.utilisateur_id,
      montant: parseFloat(echeance.montant),
      description: echeance.description || 'Cotisation club',
      date_echeance: echeance.date_echeance,
      dateEcheance: echeance.date_echeance, // Alias pour compatibilité
      statut: echeance.statut_calcule,
      date_creation: echeance.date_creation,
      date_paiement: echeance.date_paiement,
      stripe_payment_intent_id: echeance.stripe_payment_intent_id,
      utilisateur: {
        first_name: echeance.first_name,
        last_name: echeance.last_name,
        email: echeance.email
      }
    };

    console.log('✅ [Echeances] Détail échéance récupéré:', {
      id: echeanceFormatee.id,
      montant: echeanceFormatee.montant,
      statut: echeanceFormatee.statut,
      utilisateur: echeanceFormatee.utilisateur_id
    });

    res.json(echeanceFormatee);

  } catch (error: any) {
    console.error('❌ [Echeances] Erreur récupération détail échéance:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message,
      echeanceId: req.params.echeanceId
    });
  }
});

// POST - Créer une échéance
router.post('/', verifyToken, async (req, res) => {
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
router.put('/:id', verifyToken, async (req, res) => {
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

// Route de compatibilité pour ancien format /echeance/:id
router.get('/single/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    console.log(`🔄 [Echeances] Redirection /echeance/${echeanceId} vers /detail/${echeanceId}`);
    
    // Réutiliser la même logique que /detail/:echeanceId
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

// DÉPLACÉ DEPUIS paiements.ts - Routes de debug spécifiques aux échéances
router.get('/debug/echeance/:echeanceId/user/:userId', async (req, res) => {
  // CODE DÉPLACÉ DEPUIS paiements2.ts
  try {
    const { echeanceId, userId } = req.params;
    
    console.log(`🔍 [Debug] Diagnostic échéance ${echeanceId} pour utilisateur ${userId}`);
    
    const paiements = new Paiements();
    
    // 1. Vérifier si l'échéance existe dans la base
    const echeanceExisteQuery = `SELECT * FROM echeances_paiements WHERE id = ?`;
    const echeanceExiste = await paiements.queryAsync(echeanceExisteQuery, [parseInt(echeanceId)]);
    
    // 2. Vérifier si l'utilisateur existe
    const userExisteQuery = `SELECT id, first_name, last_name, email FROM utilisateurs WHERE id = ?`;
    const userExiste = await paiements.queryAsync(userExisteQuery, [parseInt(userId)]);
    
    // 3. Récupérer toutes les échéances de cet utilisateur
    const toutesEcheancesQuery = `SELECT * FROM echeances_paiements WHERE utilisateur_id = ?`;
    const toutesEcheances = await paiements.queryAsync(toutesEcheancesQuery, [parseInt(userId)]);
    
    const diagnostic = {
      echeance_recherchee: {
        id: parseInt(echeanceId),
        existe: echeanceExiste.length > 0,
        details: echeanceExiste[0] || null,
        appartient_utilisateur: echeanceExiste.length > 0 && echeanceExiste[0].utilisateur_id === parseInt(userId)
      },
      utilisateur: {
        id: parseInt(userId),
        existe: userExiste.length > 0,
        details: userExiste[0] || null
      },
      echeances_utilisateur: {
        total: toutesEcheances.length,
        liste: toutesEcheances.map((e: any) => ({
          id: e.id,
          montant: e.montant,
          statut: e.statut,
          date_echeance: e.date_echeance
        }))
      }
    };
    
    res.status(200).json({
      success: true,
      diagnostic,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Erreur diagnostic échéance:', error);
    res.status(500).json({ 
      error: 'Erreur lors du diagnostic',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route manquante - GET /debug/user/:userId/echeances
router.get('/debug/user/:userId/echeances', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 [Debug] Liste complète des échéances pour utilisateur ${userId}`);
    
    const paiements = new Paiements();
    
    // Requête détaillée avec jointures
    const echeancesDetailleesQuery = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan,
        pt.prix as prix_plan
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE ep.utilisateur_id = ?
      ORDER BY ep.date_echeance DESC
    `;
    
    const echeancesDetaillees = await paiements.queryAsync(echeancesDetailleesQuery, [parseInt(userId)]);
    
    // Statistiques
    const stats = {
      total_echeances: echeancesDetaillees.length,
      en_attente: echeancesDetaillees.filter((e: any) => e.statut === 'en attente').length,
      payees: echeancesDetaillees.filter((e: any) => e.statut === 'payé').length,
      echues: echeancesDetaillees.filter((e: any) => 
        e.statut === 'en attente' && new Date(e.date_echeance) < new Date()
      ).length,
      montant_total_du: echeancesDetaillees
        .filter((e: any) => e.statut === 'en attente')
        .reduce((sum: number, e: any) => sum + parseFloat(e.montant), 0)
    };
    
    console.log(`📊 [Debug] Statistiques échéances utilisateur ${userId}:`, stats);
    
    res.status(200).json({
      success: true,
      utilisateur_id: parseInt(userId),
      echeances: echeancesDetaillees,
      statistiques: stats,
      suggestions_test: {
        echeance_la_plus_recente: echeancesDetaillees[0]?.id || null,
        echeances_en_attente: echeancesDetaillees
          .filter((e: any) => e.statut === 'en attente')
          .map((e: any) => ({
            id: e.id,
            montant: e.montant,
            date_echeance: e.date_echeance,
            url_test: `${req.protocol}://${req.get('host')}/pages/paiement?echeance=${e.id}&userId=${userId}`
          }))
          .slice(0, 3)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Erreur liste échéances utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des échéances utilisateur',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route manquante - GET /echeance/:echeanceId (compatibilité)
router.get('/echeance/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId;
    
    console.log(`🔄 [Échéances] Route de compatibilité /echeance/${echeanceId} appelée avec userId=${userId}`);
    
    if (!echeanceId || isNaN(parseInt(echeanceId))) {
      return res.status(400).json({ 
        error: 'ID échéance invalide',
        echeanceId: echeanceId
      });
    }

    const paiements = new Paiements();
    
    // SÉCURITÉ: Si userId fourni, vérification d'appartenance
    if (userId && !isNaN(parseInt(userId as string))) {
      console.log(`🛡️ [Échéances] Vérification appartenance échéance ${echeanceId} à utilisateur ${userId}`);
      
      // Récupérer toutes les échéances de cet utilisateur
      const echeancesUtilisateur = await paiements.obtenirEcheancesUtilisateur(parseInt(userId as string));
      console.log(`📋 [Échéances] Utilisateur ${userId} a ${echeancesUtilisateur.length} échéances`);
      
      // Vérifier que l'échéance demandée existe pour cet utilisateur
      const echeanceAutorisee = echeancesUtilisateur.find((e: any) => e.id === parseInt(echeanceId));
      
      if (!echeanceAutorisee) {
        console.error(`❌ [Échéances] Échéance ${echeanceId} n'appartient pas à l'utilisateur ${userId}`);
        
        return res.status(404).json({ 
          error: 'Échéance non trouvée pour cet utilisateur',
          debug: {
            echeanceId: parseInt(echeanceId),
            userId: parseInt(userId as string),
            echeancesDisponibles: echeancesUtilisateur.map((e: any) => ({ 
              id: e.id, 
              montant: e.montant, 
              statut: e.statut,
              date_echeance: e.date_echeance
            })),
            suggestions: echeancesUtilisateur
              .filter((e: any) => e.statut === 'en attente')
              .slice(0, 3)
              .map((e: any) => ({
                id: e.id,
                url: `/pages/paiement?echeance=${e.id}&userId=${userId}`,
                montant: e.montant,
                date_echeance: e.date_echeance
              }))
          }
        });
      }

      // Enrichir l'échéance avec des informations supplémentaires
      const echeanceEnrichie = {
        ...echeanceAutorisee,
        description: echeanceAutorisee.description || `Cotisation mensuelle - ${new Date(echeanceAutorisee.date_echeance).toLocaleDateString('fr-FR')}`,
        utilisateur_autorise: true,
        verification_passed: true,
        payment_ready: true,
        currency: 'EUR'
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
      // Accès sans vérification utilisateur (moins sécurisé)
      try {
        const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
        const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
        
        if (results.length === 0) {
          return res.status(404).json({ 
            error: 'Échéance non trouvée'
          });
        }

        const echeance = results[0];
        
        if (echeance.statut?.toLowerCase() === 'payé') {
          return res.status(400).json({ 
            error: 'Cette échéance est déjà payée'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            ...echeance,
            description: echeance.description || `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`,
            utilisateur_autorise: false,
            verification_passed: false,
            payment_ready: true,
            currency: 'EUR'
          },
          security: {
            access_verified: false,
            warning: 'Accès sans vérification utilisateur'
          }
        });
        
      } catch (dbError: any) {
        return res.status(500).json({ 
          error: 'Erreur lors de la recherche de l\'échéance en base de données',
          details: dbError.message 
        });
      }
    }

  } catch (error: any) {
    console.error('❌ [Échéances] Erreur route de compatibilité /echeance/:echeanceId:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'échéance',
      details: error.message 
    });
  }
});

// AJOUTÉ: Route de diagnostic pour vérifier la structure de la table echeances_paiements
router.get('/debug/table-constraints', async (req, res) => {
  try {
    const paiements = new Paiements();
    
    console.log('🔍 [Debug] Analyse structure table echeances_paiements...');
    
    // Vérifier la structure de la table
    const describeQuery = 'DESCRIBE echeances_paiements';
    const tableStructure = await paiements.queryAsync(describeQuery, []);
    
    // Vérifier les contraintes
    const constraintsQuery = `
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE,
        TABLE_NAME,
        COLUMN_NAME
      FROM information_schema.TABLE_CONSTRAINTS tc
      LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu 
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
        AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
      WHERE tc.TABLE_NAME = 'echeances_paiements' 
        AND tc.TABLE_SCHEMA = DATABASE()
    `;
    const constraints = await paiements.queryAsync(constraintsQuery, []);
    
    // Vérifier les index
    const indexQuery = 'SHOW INDEX FROM echeances_paiements';
    const indexes = await paiements.queryAsync(indexQuery, []);
    
    // Vérifier s'il y a une contrainte problématique
    const constrainteProblematique = constraints.find((c: any) => 
      c.CONSTRAINT_NAME && c.CONSTRAINT_NAME.includes('utilisateur_periode_abonnement')
    );
    
    const diagnostic = {
      table: 'echeances_paiements',
      structure_attendue: {
        colonnes: [
          'id (INT AUTO_INCREMENT PRIMARY KEY)',
          'utilisateur_id (INT NOT NULL)',
          'abonnement_id (INT NOT NULL)',
          'date_echeance (DATE NOT NULL)',
          'montant (DECIMAL(10, 2) NOT NULL)',
          'statut (ENUM: payé, en attente, échu)',
          'date_paiement (DATE)'
        ],
        contraintes_attendues: [
          'PRIMARY KEY (id)',
          'FOREIGN KEY (utilisateur_id) → utilisateurs(id)',
          'FOREIGN KEY (abonnement_id) → plans_tarifaires(id)'
        ],
        contraintes_NON_attendues: [
          'uk_utilisateur_periode_abonnement (cette contrainte est pour la table paiements)'
        ]
      },
      structure_reelle: {
        colonnes: tableStructure,
        contraintes: constraints,
        indexes: indexes
      },
      probleme_detecte: !!constrainteProblematique,
      contrainte_problematique: constrainteProblematique || null,
      solution: constrainteProblematique ? 
        'Supprimer la contrainte uk_utilisateur_periode_abonnement de cette table car elle appartient à la table paiements' :
        'Structure normale détectée',
      commande_fix: constrainteProblematique ?
        `ALTER TABLE echeances_paiements DROP INDEX ${constrainteProblematique.CONSTRAINT_NAME};` :
        null,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 [Debug] Diagnostic table echeances_paiements:', diagnostic);
    
    res.json({
      success: true,
      diagnostic,
      message: constrainteProblematique ? 
        'PROBLÈME DÉTECTÉ: Contrainte inappropriée sur la table echeances_paiements' :
        'Structure de table normale'
    });
    
  } catch (error: any) {
    console.error('❌ [Debug] Erreur diagnostic contraintes:', error);
    res.status(500).json({
      error: 'Erreur lors du diagnostic des contraintes',
      details: error.message
    });
  }
});

console.log('✅ [Échéances] Routes échéances chargées');

// CORRIGÉ: Export par défaut au lieu de named export
export default router;