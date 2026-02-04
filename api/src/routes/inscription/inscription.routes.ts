/**
 * Routes du module Inscription
 * Gestion de l'inscription des nouveaux utilisateurs
 */

import express from "express";
import { verificationEmail, inscription } from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Inscription Routes] Initialisation des routes inscription refactorisées"
);

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * POST /api/inscription/verification
 * Vérifie si un email existe déjà dans la base de données
 *
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response 200 (email disponible):
 * {
 *   "success": true,
 *   "exists": false,
 *   "message": "Email disponible"
 * }
 *
 * Response 409 (email existe):
 * {
 *   "success": false,
 *   "exists": true,
 *   "message": "Cet email est déjà utilisé"
 * }
 *
 * Response 400 (données invalides):
 * {
 *   "success": false,
 *   "message": "Email invalide",
 *   "errors": [...]
 * }
 */
router.post("/verification", verificationEmail);

/**
 * POST /api/inscription/validation
 * Inscrit un nouvel utilisateur dans le système
 *
 * Body:
 * {
 *   "nom": "Dupont",
 *   "prenom": "Jean",
 *   "email": "jean.dupont@example.com",
 *   "password": "SecureP@ss123",
 *   "date": "1990-01-15",
 *   "abonnement": 1,
 *   "genre": 1
 * }
 *
 * Règles de validation:
 * - nom/prenom: 1-100 caractères, lettres uniquement
 * - email: format valide, 5-255 caractères
 * - password: min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
 * - date: format YYYY-MM-DD, âge entre 5 et 120 ans
 * - abonnement/genre: nombres entiers positifs
 *
 * Response 201 (succès):
 * {
 *   "success": true,
 *   "message": "Inscription réussie",
 *   "userId": 42
 * }
 *
 * Response 409 (email déjà utilisé):
 * {
 *   "success": false,
 *   "message": "Un compte avec cet email existe déjà"
 * }
 *
 * Response 400 (données invalides):
 * {
 *   "success": false,
 *   "message": "Le mot de passe doit contenir au moins 8 caractères",
 *   "errors": [{ "field": "password", "message": "..." }]
 * }
 *
 * Response 500 (erreur serveur):
 * {
 *   "success": false,
 *   "message": "Erreur serveur lors de l'inscription"
 * }
 */
router.post("/validation", inscription);

console.log(
  "✅ [Inscription Routes] Routes inscription initialisées avec succès"
);

export default router;
