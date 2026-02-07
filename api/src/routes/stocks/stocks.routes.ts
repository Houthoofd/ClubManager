/**
 * Routes du module Stocks
 * Gestion des stocks d'articles
 */

import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getStocks,
  getStockByArticle,
  updateStock,
  getAlertes,
  healthCheck,
} from "./core/handlers/index.js";

const router = express.Router();

console.log("🔧 [Stocks Routes] Initialisation des routes stocks refactorisées");

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * GET /api/stocks/health
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get("/health", healthCheck);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (avec authentification)
 * =============================================================================
 */

/**
 * GET /api/stocks
 * Récupérer tous les stocks avec les informations des articles
 *
 * Response:
 * {
 *   success: true,
 *   message: "Stocks récupérés avec succès",
 *   data: [
 *     {
 *       id: 1,
 *       article_id: 5,
 *       quantite: 25,
 *       article_nom: "Kimono Judo",
 *       article_prix: 89.99,
 *       article_description: "Kimono blanc taille M"
 *     },
 *     ...
 *   ],
 *   count: 15
 * }
 */
router.get("/", verifyToken, getStocks);

/**
 * GET /api/stocks/alertes?seuil=5
 * Récupérer les alertes de stock (stocks bas)
 *
 * Query params:
 * - seuil (optionnel): Seuil d'alerte (défaut: 5)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Alertes de stock récupérées avec succès",
 *   data: [
 *     {
 *       id: 3,
 *       article_id: 12,
 *       quantite: 2,
 *       article_nom: "Ceinture Noire",
 *       article_prix: 15.00
 *     }
 *   ],
 *   count: 3,
 *   seuil: 5
 * }
 */
router.get("/alertes", verifyToken, getAlertes);

/**
 * GET /api/stocks/article/:articleId
 * Récupérer les stocks d'un article spécifique
 *
 * Params:
 * - articleId: ID de l'article
 *
 * Response:
 * {
 *   success: true,
 *   message: "Stock récupéré avec succès",
 *   data: [
 *     {
 *       id: 1,
 *       article_id: 5,
 *       quantite: 25,
 *       article_nom: "Kimono Judo",
 *       article_prix: 89.99
 *     }
 *   ],
 *   count: 1
 * }
 */
router.get("/article/:articleId", verifyToken, getStockByArticle);

/**
 * PUT /api/stocks/update
 * Mettre à jour un stock
 *
 * Body:
 * {
 *   article_id: number,
 *   quantite: number,
 *   operation?: 'set' | 'add' | 'subtract' (défaut: 'set')
 * }
 *
 * Opérations:
 * - 'set': Définir la quantité exacte
 * - 'add': Ajouter à la quantité existante
 * - 'subtract': Soustraire de la quantité existante (minimum 0)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Stock mis à jour avec succès",
 *   data: {
 *     article_id: 5,
 *     quantite: 30,
 *     operation: "add"
 *   }
 * }
 */
router.put("/update", verifyToken, updateStock);

console.log("✅ [Stocks Routes] Routes stocks initialisées avec succès");

export default router;
