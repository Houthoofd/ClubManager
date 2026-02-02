import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';

/**
 * Handler pour obtenir tous les cours
 */
export async function getAllCours(req: Request, res: Response): Promise<void> {
  try {
    const client = new Cours();
    const cours = await client.obtenirTousLesCours();

    if (!cours || cours.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Aucun cours à venir trouvé.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cours
    });
  } catch (error) {
    console.error('❌ [Get All Cours] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des cours.',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
