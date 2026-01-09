/**
 * Classe principale Alerte - Point d'entrée unifié pour les opérations sur les alertes
 * Composition du repository (lecture) et du service (écriture/actions)
 */

import { ConfirmationResult, VerifyResultWithData } from "@clubmanager/types";
import { AlertesRepository } from "./alertes.repository.js";
import { AlertesService } from "../../../services/alertesService.js";
import type {
  AlerteActive,
  DashboardAlerte,
  StatistiquesAlertes,
  ResoudreAlerteParams,
  IgnorerAlerteParams,
} from "./types.js";

export class Alerte {
  private repository: AlertesRepository;
  private service: AlertesService;

  constructor() {
    this.repository = new AlertesRepository();
    this.service = new AlertesService();
  }

  // ==================== Méthodes de lecture (Repository) ====================

  /**
   * Récupère le dashboard des alertes avec vue d'ensemble
   * @returns Dashboard avec statistiques par type d'alerte
   */
  async obtenirDashboardAlertes(): Promise<
    VerifyResultWithData<DashboardAlerte[]>
  > {
    return this.repository.obtenirDashboard();
  }

  /**
   * Récupère toutes les alertes actives dans le système
   * @returns Liste des alertes actives avec détails utilisateur
   */
  async obtenirAlertesActives(): Promise<VerifyResultWithData<AlerteActive[]>> {
    return this.repository.obtenirAlertesActives();
  }

  /**
   * Récupère les alertes d'un utilisateur spécifique
   * @param userId - ID de l'utilisateur
   * @returns Liste des alertes de l'utilisateur
   */
  async obtenirAlertesUtilisateur(
    userId: number,
  ): Promise<VerifyResultWithData<any[]>> {
    return this.repository.obtenirAlertesUtilisateur(userId);
  }

  /**
   * Récupère les statistiques globales des alertes (30 derniers jours)
   * @returns Statistiques (total, actives, résolues, critiques)
   */
  async obtenirStatistiquesAlertes(): Promise<
    VerifyResultWithData<StatistiquesAlertes>
  > {
    return this.repository.obtenirStatistiques();
  }

  // ==================== Méthodes d'action (Service) ====================

  /**
   * Déclenche la détection automatique des alertes pour tous les utilisateurs
   * @returns Confirmation de l'exécution
   */
  async detecterAlertes(): Promise<ConfirmationResult> {
    return this.service.detecterAlertes();
  }

  /**
   * Résout une alerte avec notes et tracking de l'utilisateur
   * @param alerteId - ID de l'alerte
   * @param notes - Notes de résolution
   * @param effectuePar - ID de l'utilisateur qui résout l'alerte
   * @returns Confirmation de la résolution
   */
  async resoudreAlerte(
    alerteId: number,
    notes: string,
    effectuePar: number,
  ): Promise<ConfirmationResult> {
    return this.service.resoudreAlerte({ alerteId, notes, effectuePar });
  }

  /**
   * Ignore une alerte (la marque comme non pertinente)
   * @param alerteId - ID de l'alerte
   * @param notes - Raison de l'ignorement
   * @returns Confirmation de l'ignorement
   */
  async ignorerAlerte(
    alerteId: number,
    notes: string,
  ): Promise<ConfirmationResult> {
    return this.service.ignorerAlerte({ alerteId, notes });
  }

  /**
   * Résout une alerte de manière simplifiée (sans stored procedure)
   * @param alerteId - ID de l'alerte
   * @returns Confirmation de la résolution
   */
  async resoudreAlerteSimple(alerteId: number): Promise<ConfirmationResult> {
    return this.service.resoudreAlerteSimple(alerteId);
  }

  /**
   * Réactive une alerte précédemment ignorée ou résolue
   * @param alerteId - ID de l'alerte
   * @returns Confirmation de la réactivation
   */
  async reactiverAlerte(alerteId: number): Promise<ConfirmationResult> {
    return this.service.reactiverAlerte(alerteId);
  }
}
