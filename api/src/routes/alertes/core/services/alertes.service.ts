/**
 * Service Alertes
 * Logique métier pour la gestion des alertes système
 * ✅ Pattern: Service réutilisable pour REST et GraphQL
 */

import { Alerte } from '../../../../db/clients/alertes/alertes.js';
import {
  InternalServerError,
  ValidationError,
  NotFoundError,
} from '../../../../shared/errors/GraphQLErrors.js';

/**
 * Interface pour le dashboard des alertes
 */
export interface AlerteDashboard {
  totalAlertes: number;
  alertesCritiques: number;
  alertesEnAttente: number;
  alertesResolues: number;
  alertesParType: Record<string, number>;
  tendances: any;
}

/**
 * Interface pour une alerte
 */
export interface AlerteData {
  id: number;
  type: string;
  severite: string;
  message: string;
  utilisateur_id?: number;
  statut: string;
  date_detection: Date;
  date_resolution?: Date;
  notes?: string;
}

/**
 * Récupère le dashboard des alertes
 */
export async function obtenirDashboardAlertes(): Promise<AlerteDashboard> {
  try {
    const client = new Alerte();
    const dashboard = await client.obtenirDashboardAlertes();
    return dashboard;
  } catch (error: any) {
    console.error('[AlertesService] Erreur dashboard:', error);
    throw new InternalServerError(
      'Erreur lors de la récupération du dashboard des alertes',
      error
    );
  }
}

/**
 * Récupère toutes les alertes actives
 */
export async function obtenirAlertesActives(): Promise<AlerteData[]> {
  try {
    const client = new Alerte();
    const alertes = await client.obtenirAlertesActives();
    return alertes;
  } catch (error: any) {
    console.error('[AlertesService] Erreur alertes actives:', error);
    throw new InternalServerError(
      'Erreur lors de la récupération des alertes actives',
      error
    );
  }
}

/**
 * Récupère les alertes d'un utilisateur spécifique
 */
export async function obtenirAlertesUtilisateur(
  userId: number
): Promise<AlerteData[]> {
  if (!userId || isNaN(userId) || userId <= 0) {
    throw new ValidationError('ID utilisateur invalide', [
      { field: 'userId', message: 'L\'ID utilisateur doit être un nombre positif' },
    ]);
  }

  try {
    const client = new Alerte();
    const alertes = await client.obtenirAlertesUtilisateur(userId);
    return alertes;
  } catch (error: any) {
    console.error('[AlertesService] Erreur alertes utilisateur:', error);
    throw new InternalServerError(
      `Erreur lors de la récupération des alertes de l'utilisateur ${userId}`,
      error
    );
  }
}

/**
 * Déclenche manuellement la détection des alertes
 */
export async function detecterAlertes(): Promise<{ success: boolean; message: string }> {
  try {
    const client = new Alerte();
    await client.detecterAlertes();
    return {
      success: true,
      message: 'Détection des alertes effectuée avec succès',
    };
  } catch (error: any) {
    console.error('[AlertesService] Erreur détection alertes:', error);
    throw new InternalServerError(
      'Erreur lors de la détection des alertes',
      error
    );
  }
}

/**
 * Résout une alerte
 */
export async function resoudreAlerte(
  alerteId: number,
  notes: string = '',
  userId?: number
): Promise<{ success: boolean; message: string }> {
  if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
    throw new ValidationError('ID alerte invalide', [
      { field: 'alerteId', message: 'L\'ID de l\'alerte doit être un nombre positif' },
    ]);
  }

  try {
    const client = new Alerte();
    await client.resoudreAlerte(alerteId, notes, userId);
    return {
      success: true,
      message: 'Alerte résolue avec succès',
    };
  } catch (error: any) {
    console.error('[AlertesService] Erreur résolution alerte:', error);

    // Vérifier si l'alerte existe
    if (error.message?.includes('not found') || error.message?.includes('introuvable')) {
      throw new NotFoundError(`Alerte ${alerteId} non trouvée`);
    }

    throw new InternalServerError(
      `Erreur lors de la résolution de l'alerte ${alerteId}`,
      error
    );
  }
}

/**
 * Ignore une alerte
 */
export async function ignorerAlerte(
  alerteId: number,
  notes: string = ''
): Promise<{ success: boolean; message: string }> {
  if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
    throw new ValidationError('ID alerte invalide', [
      { field: 'alerteId', message: 'L\'ID de l\'alerte doit être un nombre positif' },
    ]);
  }

  try {
    const client = new Alerte();
    await client.ignorerAlerte(alerteId, notes);
    return {
      success: true,
      message: 'Alerte ignorée avec succès',
    };
  } catch (error: any) {
    console.error('[AlertesService] Erreur ignorer alerte:', error);

    // Vérifier si l'alerte existe
    if (error.message?.includes('not found') || error.message?.includes('introuvable')) {
      throw new NotFoundError(`Alerte ${alerteId} non trouvée`);
    }

    throw new InternalServerError(
      `Erreur lors de l'ignorement de l'alerte ${alerteId}`,
      error
    );
  }
}

/**
 * Récupère une alerte par son ID
 */
export async function obtenirAlerteParId(alerteId: number): Promise<AlerteData | null> {
  if (!alerteId || isNaN(alerteId) || alerteId <= 0) {
    throw new ValidationError('ID alerte invalide', [
      { field: 'alerteId', message: 'L\'ID de l\'alerte doit être un nombre positif' },
    ]);
  }

  try {
    const client = new Alerte();
    // Supposons qu'il existe une méthode pour récupérer une alerte par ID
    // Sinon, on peut filtrer les alertes actives
    const alertes = await client.obtenirAlertesActives();
    const alerte = alertes.find((a: any) => a.id === alerteId);

    if (!alerte) {
      throw new NotFoundError(`Alerte ${alerteId} non trouvée`);
    }

    return alerte;
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    console.error('[AlertesService] Erreur récupération alerte:', error);
    throw new InternalServerError(
      `Erreur lors de la récupération de l'alerte ${alerteId}`,
      error
    );
  }
}
