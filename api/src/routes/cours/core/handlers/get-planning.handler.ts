import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';

/**
 * Handler pour obtenir le planning des cours (jours de cours)
 */
export async function getPlanning(req: Request, res: Response): Promise<void> {
  try {
    const client = new Cours();
    console.log('Appel pour obtenir les jours de cours');

    const result = await client.obtenirLesJoursDeCours();
    console.log('Résultat des jours de cours:', result);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ [Get Planning] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des jours de cours',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
