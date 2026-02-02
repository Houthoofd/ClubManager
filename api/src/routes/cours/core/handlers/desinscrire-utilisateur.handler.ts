import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';
import { z } from 'zod';
import {
  DataAnnulation,
  datannulationSchema
} from '@clubmanager/types';

/**
 * Handler pour désinscrire complètement un utilisateur d'un cours
 */
export async function desinscrireUtilisateur(req: Request, res: Response): Promise<void> {
  try {
    console.log('Désinscription utilisateur:', req.body);

    // Validation avec vérification explicite de cours_id
    const parsedData = datannulationSchema.parse(req.body);

    if (!parsedData.cours_id) {
      res.status(400).json({
        success: false,
        message: 'cours_id est requis'
      });
      return;
    }

    const validatedData: DataAnnulation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id
    };

    console.log('Données validées :', validatedData);

    const client = new Cours();
    const annulationReussie = await client.desinscrireUtilisateurDuCours(validatedData);

    if (annulationReussie) {
      res.status(200).json({
        success: true,
        message: 'Réservation annulée avec succès.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Réservation non trouvée ou déjà annulée.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [Désinscrire Utilisateur] Erreur de validation:', error);
      res.status(400).json({
        success: false,
        message: 'Données invalides.',
        errors: error.errors
      });
    } else {
      console.error('❌ [Désinscrire Utilisateur] Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'annulation de la réservation.',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
