import { Request, Response } from 'express';
import { Alerte } from '../../../../db/clients/alertes/alertes.js';

/**
 * Récupère le dashboard des alertes
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const client = new Alerte();
    const dashboard = await client.obtenirDashboardAlertes();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

/**
 * Récupère toutes les alertes actives
 */
export async function getAlertesActives(req: Request, res: Response): Promise<void> {
  try {
    const client = new Alerte();
    const alertes = await client.obtenirAlertesActives();
    
    res.json({
      success: true,
      data: alertes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

/**
 * Récupère les alertes d'un utilisateur spécifique
 */
export async function getAlertesUtilisateur(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ success: false, error: 'ID utilisateur invalide.' });
    return;
  }

  try {
    const client = new Alerte();
    const alertes = await client.obtenirAlertesUtilisateur(parseInt(userId));
    
    res.json({
      success: true,
      data: alertes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes utilisateur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

/**
 * Déclenche manuellement la détection des alertes
 */
export async function detecterAlertes(req: Request, res: Response): Promise<void> {
  try {
    const client = new Alerte();
    await client.detecterAlertes();
    
    res.json({
      success: true,
      message: 'Détection des alertes effectuée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la détection des alertes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

/**
 * Résout une alerte
 */
export async function resoudreAlerte(req: any, res: Response): Promise<void> {
  const { alerteId } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;

  if (!alerteId || isNaN(parseInt(alerteId))) {
    res.status(400).json({ success: false, error: 'ID alerte invalide.' });
    return;
  }

  try {
    const client = new Alerte();
    await client.resoudreAlerte(parseInt(alerteId), notes || '', userId);
    
    res.json({
      success: true,
      message: 'Alerte résolue avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la résolution de l\'alerte:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}

/**
 * Ignore une alerte
 */
export async function ignorerAlerte(req: Request, res: Response): Promise<void> {
  const { alerteId } = req.params;
  const { notes } = req.body;

  if (!alerteId || isNaN(parseInt(alerteId))) {
    res.status(400).json({ success: false, error: 'ID alerte invalide.' });
    return;
  }

  try {
    const client = new Alerte();
    await client.ignorerAlerte(parseInt(alerteId), notes || '');
    
    res.json({
      success: true,
      message: 'Alerte ignorée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'ignorement de l\'alerte:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur.' });
  }
}
