import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getCategories,
  createCommande,
  getCommandes,
  verifyCommandeUnicity,
  getTailles,
  getPaymentIntent,
  getStatistiquesMagasin,
  healthCheck,
  getDiagnostic,
} from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Magasin Routes] Initialisation des routes magasin refactorisées",
);

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get("/health", healthCheck);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (authentification requise)
 * =============================================================================
 */

/**
 * GET /api/magasin/articles
 * Obtenir tous les articles par catégories
 *
 * Query:
 * - categorie?: string - Filtrer par catégorie (optionnel)
 */
router.get("/articles", verifyToken, getArticles);

/**
 * GET /api/magasin/articles/categories
 * Récupérer toutes les catégories d'articles
 */
router.get("/articles/categories", verifyToken, getCategories);

/**
 * GET /api/magasin/articles/:id
 * Récupérer un article spécifique par son ID
 *
 * Params:
 * - id: number - ID de l'article
 */
router.get("/articles/:id", verifyToken, getArticleById);

/**
 * POST /api/magasin/articles/ajouter
 * Créer un nouvel article
 *
 * Body:
 * {
 *   nom: string,                     // Nom de l'article
 *   description?: string,            // Description (optionnel)
 *   prix: number,                    // Prix en euros
 *   stock: number,                   // Quantité en stock
 *   categorie_id: number,            // ID de la catégorie
 *   image_url?: string,              // URL de l'image (optionnel)
 *   actif?: boolean,                 // Article actif (défaut: true)
 *   tailles_disponibles?: string[]   // Tailles disponibles (optionnel)
 * }
 */
router.post("/articles/ajouter", verifyToken, createArticle);

/**
 * PUT /api/magasin/articles/:id
 * Mettre à jour un article existant
 *
 * Params:
 * - id: number - ID de l'article
 *
 * Body: Tous les champs sont optionnels
 * {
 *   nom?: string,
 *   description?: string,
 *   prix?: number,
 *   stock?: number,
 *   categorie_id?: number,
 *   image_url?: string,
 *   actif?: boolean,
 *   tailles_disponibles?: string[]
 * }
 */
router.put("/articles/:id", verifyToken, updateArticle);

/**
 * DELETE /api/magasin/articles/:id
 * Supprimer un article
 *
 * Params:
 * - id: number - ID de l'article à supprimer
 */
router.delete("/articles/:id", verifyToken, deleteArticle);

/**
 * PUT /api/magasin/modifier/article/:id
 * Alias pour PUT /api/magasin/articles/:id
 * Maintient la compatibilité avec l'ancien système
 *
 * Params:
 * - id: number - ID de l'article
 */
router.put("/modifier/article/:id", verifyToken, updateArticle);

/**
 * GET /api/magasin/tailles
 * Récupérer toutes les tailles disponibles
 */
router.get("/tailles", verifyToken, getTailles);

/**
 * GET /api/magasin/tailles/debug
 * Alias pour GET /api/magasin/diagnostic
 * Informations de débogage sur les tailles
 */
router.get("/debug/tailles-structure", verifyToken, getDiagnostic);

/**
 * POST /api/magasin/commandes/ajouter
 * Créer une nouvelle commande avec protection contre les doublons
 *
 * Body:
 * {
 *   utilisateur_id: number,                     // ID de l'utilisateur
 *   articles: [                                 // Liste des articles
 *     {
 *       article_id: number,                     // ID de l'article
 *       nom?: string,                           // Nom de l'article (optionnel)
 *       quantite: number,                       // Quantité commandée
 *       taille: string,                         // Taille choisie
 *       prix?: number                           // Prix unitaire (optionnel)
 *     }
 *   ],
 *   total: number,                              // Montant total
 *   statut?: string,                            // Statut (défaut: 'en attente')
 *   date?: string                               // Date de la commande (optionnel)
 * }
 *
 * Retourne:
 * {
 *   message: string,
 *   commande: {
 *     id: number,
 *     unique_id: string,                        // ID unique (CMD-XXX-TIMESTAMP-XXXXXXXX)
 *     numero_commande: string,                  // Numéro séquentiel (CMD-XXXXXX)
 *     ...autres champs
 *   },
 *   isDuplicate: boolean                        // true si commande dupliquée détectée
 * }
 */
router.post("/commandes/ajouter", verifyToken, createCommande);

/**
 * GET /api/magasin/commandes
 * Récupérer toutes les commandes
 */
router.get("/commandes", verifyToken, getCommandes);

/**
 * GET /api/magasin/commande/:uniqueId/verify
 * Vérifier l'existence et l'unicité d'une commande
 *
 * Params:
 * - uniqueId: string - ID unique ou numéro de commande
 *
 * Retourne:
 * - exists: boolean
 * - commande?: object (si trouvée)
 * - message: string
 */
router.get("/commande/:uniqueId/verify", verifyToken, verifyCommandeUnicity);

/**
 * GET /api/magasin/commande/:commandeId/payment-intent
 * Récupérer le PaymentIntent Stripe d'une commande
 *
 * Params:
 * - commandeId: string - ID, unique_id ou numero_commande
 *
 * Query:
 * - userId: number - ID de l'utilisateur (requis)
 *
 * Retourne:
 * {
 *   client_secret: string,          // Secret client pour Stripe
 *   payment_intent_id: string,      // ID du Payment Intent
 *   statut: string,                 // Statut du paiement
 *   montant: number,                // Montant
 *   metadata: object                // Métadonnées Stripe
 * }
 */
router.get(
  "/commande/:commandeId/payment-intent",
  verifyToken,
  getPaymentIntent,
);

/**
 * =============================================================================
 * ROUTES DE STATISTIQUES ET DIAGNOSTICS
 * =============================================================================
 */

/**
 * GET /api/magasin/statistiques
 * Récupérer les statistiques du magasin
 *
 * Query:
 * - dateDebut?: string - Date de début (format ISO)
 * - dateFin?: string - Date de fin (format ISO)
 *
 * Retourne:
 * {
 *   total_commandes: number,
 *   commandes_en_attente: number,
 *   commandes_validees: number,
 *   commandes_livrees: number,
 *   commandes_annulees: number,
 *   chiffre_affaires_total: number,
 *   article_le_plus_vendu?: object
 * }
 */
router.get("/statistiques", verifyToken, getStatistiquesMagasin);

/**
 * GET /api/magasin/diagnostic
 * Obtenir un diagnostic détaillé du module magasin
 *
 * Informations sur:
 * - Structure des tables (articles, commandes, tailles)
 * - Contraintes et index
 * - Statistiques (nombre d'articles, de commandes, etc.)
 * - Détection de problèmes éventuels
 */
router.get("/diagnostic", verifyToken, getDiagnostic);

/**
 * =============================================================================
 * ROUTE PAR DÉFAUT - INFO MODULE
 * =============================================================================
 */

/**
 * GET /api/magasin
 * Informations générales sur le module magasin
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    module: "magasin",
    version: "1.0.0",
    architecture: "handlers/services/validators",
    features: {
      articles: true,
      categories: true,
      commandes: true,
      paiements: true,
      tailles: true,
      statistiques: true,
      duplicate_prevention: true,
      email_notifications: true,
    },
    routes: {
      public: ["GET /health"],
      protected: [
        "GET /articles",
        "GET /articles/categories",
        "GET /articles/:id",
        "POST /articles/ajouter",
        "PUT /articles/:id",
        "DELETE /articles/:id",
        "PUT /modifier/article/:id",
        "GET /tailles",
        "POST /commandes/ajouter",
        "GET /commandes",
        "GET /commande/:uniqueId/verify",
        "GET /commande/:commandeId/payment-intent",
        "GET /statistiques",
        "GET /diagnostic",
      ],
    },
    documentation: "Voir les commentaires JSDoc sur chaque route",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ [Magasin Routes] Routes magasin chargées");

export default router;
