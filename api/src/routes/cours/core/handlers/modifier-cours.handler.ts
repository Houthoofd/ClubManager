import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';

/**
 * Handler pour modifier un cours récurrent
 */
export async function modifierCours(req: Request, res: Response): Promise<void> {
  try {
    console.log('Données reçues pour modification :', req.body);

    const {
      nom, type_cours, jour, heure_debut, heure_fin, professeurs,
      jour_original, type_cours_original, heure_debut_original, heure_fin_original
    } = req.body;

    if (!type_cours || !jour || !heure_debut || !heure_fin || !professeurs) {
      res.status(400).json({
        success: false,
        error: 'Paramètres manquants pour la modification'
      });
      return;
    }

    const client = new Cours();

    try {
      // Obtenir l'ID du cours récurrent basé sur les données originales
      const coursRecurrentId = await client.obtenirIdCoursRecurrent(
        jour_original || jour,
        type_cours_original || type_cours,
        heure_debut_original || heure_debut,
        heure_fin_original || heure_fin
      );

      console.log('ID du cours récurrent trouvé:', coursRecurrentId);

      // Mapping des jours
      const joursDeSemaine: { [key: string]: string } = {
        'Lundi': 'lundi',
        'Mardi': 'mardi',
        'Mercredi': 'mercredi',
        'Jeudi': 'jeudi',
        'Vendredi': 'vendredi',
        'Samedi': 'samedi',
        'Dimanche': 'dimanche'
      };

      const jourNormalise = joursDeSemaine[jour] || jour.toLowerCase();

      // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
      const result = await client.modifierCoursRecurrentAvecProfesseurs({
        cours_recurrent_id: coursRecurrentId,
        type_cours,
        jour_semaine: jourNormalise,
        heure_debut,
        heure_fin,
        professeurs
      });

      console.log('Résultat modification cours:', result);

      res.status(200).json({
        success: true,
        message: result.message || 'Cours modifié avec succès',
        data: result
      });
    } catch (error: any) {
      console.error('❌ [Modifier Cours] Erreur lors de la modification du cours :', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la modification du cours',
        details: error.message
      });
    }
  } catch (error: any) {
    console.error('❌ [Modifier Cours] Erreur générale lors de la modification :', error);
    res.status(500).json({
      success: false,
      error: 'Erreur générale lors de la modification',
      details: error.message
    });
  }
}
