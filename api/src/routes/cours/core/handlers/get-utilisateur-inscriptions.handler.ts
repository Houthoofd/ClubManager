import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';

/**
 * Handler pour obtenir les cours auxquels un utilisateur est inscrit
 */
export async function getUtilisateurInscriptions(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'L\'ID de l\'utilisateur est requis.'
      });
      return;
    }

    const client = new Cours();
    const cours = await client.obtenirCoursInscritsParUtilisateur(Number(userId));

    if (!cours || cours.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Aucun cours trouvé pour cet utilisateur.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cours
    });
  } catch (error) {
    console.error('❌ [Get Utilisateur Inscriptions] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des cours inscrits.',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
