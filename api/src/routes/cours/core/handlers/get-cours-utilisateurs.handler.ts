import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';
import { UtilisateursParCours } from '@clubmanager/types';

/**
 * Handler pour obtenir les utilisateurs participants d'un cours
 */
export async function getCoursUtilisateurs(req: Request, res: Response): Promise<void> {
  try {
    const { coursId } = req.params;

    if (!coursId) {
      res.status(400).json({
        success: false,
        message: 'L\'ID du cours est requis.'
      });
      return;
    }

    const client = new Cours();

    // Récupérer les utilisateurs associés à ce cours
    const utilisateursParCours: UtilisateursParCours = await client.obtenirUtilisateursParticipantsParCours(coursId);

    res.status(200).json({
      success: true,
      data: {
        Cours: utilisateursParCours
      },
      message: 'Cours récupéré avec succès'
    });
  } catch (error) {
    console.error('❌ [Get Cours Utilisateurs] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du cours et des utilisateurs.',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
