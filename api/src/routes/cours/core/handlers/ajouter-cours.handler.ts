import { Request, Response } from 'express';
import { Cours } from '../../../../db/clients/cours/cours.js';
import { AjoutCours } from '@clubmanager/types';

/**
 * Handler pour ajouter un cours récurrent
 */
export async function ajouterCours(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    console.log('Données reçues pour ajouter un cours:', data);

    // Mapping des jours pour convertir le nom en jour_semaine
    const joursDeSemaine: { [key: string]: string } = {
      'Lundi': 'lundi',
      'Mardi': 'mardi',
      'Mercredi': 'mercredi',
      'Jeudi': 'jeudi',
      'Vendredi': 'vendredi',
      'Samedi': 'samedi',
      'Dimanche': 'dimanche'
    };

    // Convertit le jour reçu (ex: "Vendredi") en format attendu par la procédure (ex: "vendredi")
    const jourNormalise = joursDeSemaine[data.jour_semaine];
    if (!jourNormalise) {
      res.status(400).json({
        success: false,
        message: `Jour invalide: ${data.jour_semaine}`
      });
      return;
    }

    const client = new Cours();

    // Vérification des conflits d'horaires AVANT d'ajouter
    try {
      const coursExistants = await client.obtenirLesJoursDeCours();
      const coursConflituels = coursExistants.filter(c => {
        // Vérifier que les heures ne sont pas null avant de faire les comparaisons
        if (!c.heure_debut || !c.heure_fin || !data.heure_debut || !data.heure_fin) {
          return false; // Ignorer les cours avec des heures null
        }

        return c.jour.toLowerCase() === jourNormalise &&
          ((data.heure_debut >= c.heure_debut && data.heure_debut < c.heure_fin) ||
            (data.heure_fin > c.heure_debut && data.heure_fin <= c.heure_fin) ||
            (data.heure_debut <= c.heure_debut && data.heure_fin >= c.heure_fin));
      });

      if (coursConflituels.length > 0) {
        const conflits = coursConflituels.map(c => `${c.type_cours} ${c.heure_debut}-${c.heure_fin}`).join(', ');
        res.status(409).json({
          success: false,
          message: `Conflit d'horaire détecté avec: ${conflits}. Impossible d'ajouter le cours.`
        });
        return;
      }
    } catch (verificationError) {
      console.log('Erreur lors de la vérification des conflits:', verificationError);
      // Continuer quand même si la vérification échoue
    }

    // Gestion des professeurs
    let professeurs = [];
    if (Array.isArray(data.professeurs)) {
      professeurs = data.professeurs;
    } else if (typeof data.professeurs === 'string') {
      try {
        professeurs = JSON.parse(data.professeurs);
      } catch (parseError) {
        professeurs = [data.professeurs];
      }
    } else if (data.professeurs) {
      professeurs = [data.professeurs];
    }

    // Utilisation de la nouvelle procédure stockée optimisée
    const ajoutCours: AjoutCours = {
      nom: data.nom || `${data.type_cours} - ${jourNormalise}`,
      type_cours: data.type_cours,
      jour_semaine: jourNormalise,
      heure_debut: data.heure_debut,
      heure_fin: data.heure_fin,
      professeurs: professeurs
    };

    console.log('Utilisation de la procédure optimisée avec:', ajoutCours);

    // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
    const result = await client.ajouterCoursRecurrentAvecProfesseurs(ajoutCours);

    res.status(200).json({
      success: true,
      message: result.message || 'Cours récurrent ajouté avec succès',
      data: result
    });
  } catch (error) {
    console.error('❌ [Ajouter Cours] Erreur:', error);

    // Gestion spécifique de l'erreur de clé étrangère
    if (error instanceof Error && error.message.includes('ER_NO_REFERENCED_ROW_2')) {
      res.status(400).json({
        success: false,
        message: 'Un ou plusieurs professeurs spécifiés n\'existent pas en base de données. Veuillez vérifier les noms des professeurs.',
        details: 'Erreur de référence de clé étrangère - professeurs introuvables'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'ajout du cours récurrent',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
}
