import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';
import { z } from 'zod';
import {
  DataReservation,
  datareservationSchema,
  DataInscription,
  BookResult
} from '@clubmanager/types';

/**
 * Handler pour inscrire un utilisateur à un cours
 */
export async function inscrireUtilisateur(req: Request, res: Response): Promise<void> {
  try {
    // Validation avec vérification explicite de cours_id
    const parsedData = datareservationSchema.parse(req.body);

    if (!parsedData.cours_id) {
      res.status(400).json({
        success: false,
        message: 'cours_id est requis'
      });
      return;
    }

    const validatedData: DataReservation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id
    };

    console.log('Données validées :', validatedData);

    const client = new Cours();

    // Vérification si l'utilisateur est déjà inscrit
    const verifInscriptionUtilisateur: BookResult = await client.verifierInscriptionUtilisateur(validatedData);
    console.log('Résultat de la vérification de l\'utilisateur :', verifInscriptionUtilisateur);

    if (verifInscriptionUtilisateur.isBooked === false) {
      // Vérification de l'ID utilisateur avant l'inscription
      if (!verifInscriptionUtilisateur.data) {
        res.status(400).json({
          success: false,
          message: 'Utilisateur introuvable.'
        });
        return;
      }

      // Si l'utilisateur n'est pas encore inscrit, on procède à l'inscription
      const dataToSend: DataInscription = {
        cours_id: validatedData.cours_id,
        utilisateur_id: verifInscriptionUtilisateur.data.userId,
        status_id: 1
      };

      console.log('Objet dataToSend :', dataToSend);

      // Inscription de l'utilisateur au cours
      const result = await client.inscrireUtilisateurAuCours(dataToSend);
      console.log('Résultat de l\'inscription :', result);

      if (result.isConfirm === true) {
        res.status(201).json({
          success: true,
          message: 'Utilisateur inscrit avec succès.',
          userId: verifInscriptionUtilisateur.data,
          coursId: validatedData.cours_id
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.'
        });
      }
    } else {
      res.status(409).json({
        success: false,
        message: 'Utilisateur déjà inscrit au cours.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [Inscrire Utilisateur] Erreur de validation:', error);
      res.status(400).json({
        success: false,
        message: 'Données invalides.',
        errors: error.errors
      });
    } else {
      console.error('❌ [Inscrire Utilisateur] Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'inscription de l\'utilisateur.',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
