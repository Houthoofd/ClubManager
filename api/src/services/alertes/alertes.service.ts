/**
 * Service Alertes - Orchestrateur principal
 * Gestion des alertes utilisateurs avec détection automatique
 */

import type {
  AlerteDashboard,
  AlerteUtilisateur,
  AlerteStats,
  CreateAlerteInput,
  ResoudreAlerteInput,
  IgnorerAlerteInput,
  AlerteResult,
} from '@clubmanager/types';

// Import des modules spécialisés
import { obtenirDashboardAlertes, obtenirStatistiquesAlertes } from './core/stats.js';
import { obtenirAlertesActives, obtenirAlertesUtilisateur } from './core/queries.js';
import { resoudreAlerte, ignorerAlerte, creerAlerte } from './core/mutations.js';
import { detecterAlertes } from './core/detection.js';

/**
 * Service principal de gestion des alertes
 * Délègue les opérations aux modules spécialisés
 */
export class AlertesService {
  // Dashboard et statistiques
  async obtenirDashboardAlertes(): Promise<AlerteDashboard> {
    return obtenirDashboardAlertes();
  }

  async obtenirStatistiquesAlertes(): Promise<AlerteStats> {
    return obtenirStatistiquesAlertes();
  }

  // Requêtes
  async obtenirAlertesActives(): Promise<AlerteUtilisateur[]> {
    return obtenirAlertesActives();
  }

  async obtenirAlertesUtilisateur(utilisateurId: number): Promise<AlerteUtilisateur[]> {
    return obtenirAlertesUtilisateur(utilisateurId);
  }

  // Mutations
  async resoudreAlerte(input: ResoudreAlerteInput): Promise<AlerteResult> {
    return resoudreAlerte(input);
  }

  async ignorerAlerte(input: IgnorerAlerteInput): Promise<AlerteResult> {
    return ignorerAlerte(input);
  }

  async creerAlerte(input: CreateAlerteInput): Promise<AlerteUtilisateur> {
    return creerAlerte(input);
  }

  // Détection automatique
  async detecterAlertes(): Promise<AlerteResult> {
    return detecterAlertes();
  }
}

// Instance singleton
export const alertesService = new AlertesService();
