import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';
import { z } from 'zod';
import {
  DataValidation,
  datavalidationSchema
} from '@clubmanager/types';

/**
 * Handler pour valider la présence d'un utilisateur à un cours
 */
export async function validerPresence(req: Request, res: Response): Promise<void> {
  try {
    console.log('Validation de présence:', req.body);

    // Validation avec vérification explicite de cours_id
    const parsedData = datavalidationSchema.parse(req.body);

    if (!parsedData.cours_id) {
      res.status(400).json({
        success: false,
        message: 'cours_id est requis'
      });
      return;
    }

    const validatedData: DataValidation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id
    };

    console.log('Données validées :', validatedData);

    const client = new Cours();
    const validationReussie = await client.validerUtilisateurAuCours(validatedData);

    if (validationReussie) {
      res.status(200).json({
        success: true,
        message: 'Présence validée avec succès.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Présence non trouvée ou déjà validée.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [Valider Présence] Erreur de validation:', error);
      res.status(400).json({
        success: false,
        message: 'Données invalides.',
        errors: error.errors
      });
    } else {
      console.error('❌ [Valider Présence] Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la validation de la présence.',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
