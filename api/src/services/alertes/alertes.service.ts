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

// Import depuis l'index core qui réexporte tout
import * as core from './core/index.js';

/**
 * Service principal de gestion des alertes
 * Délègue les opérations aux modules spécialisés
 */
export class AlertesService {
  // Dashboard et statistiques
  async obtenirDashboardAlertes(): Promise<AlerteDashboard> {
    return core.obtenirDashboardAlertes();
  }

  async obtenirStatistiquesAlertes(): Promise<AlerteStats> {
    return core.obtenirStatistiquesAlertes();
  }

  // Requêtes
  async obtenirAlertesActives(): Promise<AlerteUtilisateur[]> {
    return core.obtenirAlertesActives();
  }

  async obtenirAlertesUtilisateur(utilisateurId: number): Promise<AlerteUtilisateur[]> {
    return core.obtenirAlertesUtilisateur(utilisateurId);
  }

  // Mutations
  async resoudreAlerte(input: ResoudreAlerteInput): Promise<AlerteResult> {
    return core.resoudreAlerte(input);
  }

  async ignorerAlerte(input: IgnorerAlerteInput): Promise<AlerteResult> {
    return core.ignorerAlerte(input);
  }

  async creerAlerte(input: CreateAlerteInput): Promise<AlerteUtilisateur> {
    return core.creerAlerte(input);
  }

  // Détection automatique
  async detecterAlertes(): Promise<AlerteResult> {
    return core.detecterAlertes();
  }
}

// Instance singleton
export const alertesService = new AlertesService();
