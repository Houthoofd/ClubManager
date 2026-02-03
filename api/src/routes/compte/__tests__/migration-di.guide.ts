/**
 * GUIDE DE MIGRATION - Dependency Injection pour routes/compte
 * 
 * Ce guide explique comment migrer les handlers de compte vers l'injection de dépendances (DI)
 * pour permettre des tests unitaires sans connexions DB réelles.
 * 
 * Inspiré de la migration réussie de routes/cours
 * 
 * @see ClubManager/api/src/routes/compte/__tests__/compte.mock-contract.ts
 * @see ClubManager/api/src/routes/compte/__tests__/compte.di-integration.test.ts
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÉTAPE 1: MODIFIER LES HANDLERS POUR ACCEPTER L'INJECTION
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * AVANT - Handler sans DI (get-informations.handler.ts)
 * -------------------------------------------------------
 */
const HANDLER_BEFORE = `
import { Request, Response } from 'express';
import { Compte } from '../../../../db/clients/compte/compte.js';

export async function getInformations(req: Request, res: Response): Promise<void> {
  try {
    const { prenom, nom } = req.body;

    if (!prenom || !nom) {
      res.status(400).json({
        success: false,
        message: "Les champs 'prenom' et 'nom' sont requis."
      });
      return;
    }

    const client = new Compte();  // ❌ Instance créée ici - difficile à tester
    const utilisateur = await client.obtenirInformationsUtilisateur(prenom, nom);

    if (utilisateur.isFind && utilisateur.data) {
      res.status(200).json({
        success: true,
        utilisateur: utilisateur.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé.",
        data: []
      });
    }
  } catch (error) {
    console.error('❌ [Get Informations] Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
`;

/**
 * APRÈS - Handler avec DI (get-informations.handler.ts)
 * -------------------------------------------------------
 */
const HANDLER_AFTER = `
import { Request, Response } from 'express';
import { Compte } from '../../../../db/clients/compte/compte.js';
import { VerifyResultWithData } from '@clubmanager/types';

export async function getInformations(
  req: Request,
  res: Response,
  compteClient?: Compte  // ✅ Paramètre optionnel pour injection
): Promise<void> {
  try {
    const { prenom, nom } = req.body;

    if (!prenom || !nom) {
      res.status(400).json({
        success: false,
        message: "Les champs 'prenom' et 'nom' sont requis."
      });
      return;
    }

    // ✅ Utilise le client injecté ou crée une nouvelle instance en production
    const client = compteClient || new Compte();
    const utilisateur: VerifyResultWithData = await client.obtenirInformationsUtilisateur(prenom, nom);

    if (utilisateur.isFind && utilisateur.data) {
      res.status(200).json({
        success: true,
        utilisateur: utilisateur.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé.",
        data: []
      });
    }
  } catch (error) {
    console.error('❌ [Get Informations] Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
`;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÉTAPE 2: APPLIQUER LA MIGRATION À TOUS LES HANDLERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Liste des handlers à migrer:
 * 
 * 1. get-informations.handler.ts
 *    - Ajouter: compteClient?: Compte
 *    - Modifier: const client = compteClient || new Compte();
 * 
 * 2. create-password.handler.ts
 *    - Ajouter: compteClient?: Compte
 *    - Modifier: const client = compteClient || new Compte();
 * 
 * 3. change-password.handler.ts
 *    - Ajouter: compteClient?: Compte
 *    - Modifier: const client = compteClient || new Compte();
 * 
 * 4. update-account.handler.ts
 *    - Ajouter: compteClient?: Compte
 *    - Modifier: const client = compteClient || new Compte();
 */

/**
 * Exemple pour create-password.handler.ts
 */
const CREATE_PASSWORD_MIGRATION = `
// AVANT
export async function createPassword(req: Request, res: Response): Promise<void> {
  const client = new Compte();
  // ...
}

// APRÈS
export async function createPassword(
  req: Request,
  res: Response,
  compteClient?: Compte
): Promise<void> {
  const client = compteClient || new Compte();
  // ...
}
`;

/**
 * Exemple pour update-account.handler.ts
 */
const UPDATE_ACCOUNT_MIGRATION = `
// AVANT
export async function updateAccount(req: Request, res: Response): Promise<void> {
  const client = new Compte();
  // ...
}

// APRÈS
export async function updateAccount(
  req: Request,
  res: Response,
  compteClient?: Compte
): Promise<void> {
  const client = compteClient || new Compte();
  // ...
}
`;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÉTAPE 3: METTRE À JOUR LES ROUTES (SI NÉCESSAIRE)
 * ═══════════════════════════════════════════════════════