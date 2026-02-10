import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour modifier un cours récurrent
 */
export async function modifierCours(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    console.log("Données reçues pour modification :", req.body);

    const {
      nom,
      type_cours,
      jour,
      heure_debut,
      heure_fin,
      professeurs,
      jour_original,
      type_cours_original,
      heure_debut_original,
      heure_fin_original,
    } = req.body;

    if (!type_cours || !jour || !heure_debut || !heure_fin || !professeurs) {
      throw new ValidationError("Paramètres manquants pour la modification", [
        { field: "type_cours", message: "Champ requis" },
        { field: "jour", message: "Champ requis" },
        { field: "heure_debut", message: "Champ requis" },
        { field: "heure_fin", message: "Champ requis" },
        { field: "professeurs", message: "Champ requis" },
      ]);
    }

    const client = coursClient || new Cours();

    // Obtenir l'ID du cours récurrent basé sur les données originales
    const coursRecurrentId = await client.obtenirIdCoursRecurrent(
      jour_original || jour,
      type_cours_original || type_cours,
      heure_debut_original || heure_debut,
      heure_fin_original || heure_fin,
    );

    console.log("ID du cours récurrent trouvé:", coursRecurrentId);

    // Mapping des jours
    const joursDeSemaine: { [key: string]: string } = {
      Lundi: "lundi",
      Mardi: "mardi",
      Mercredi: "mercredi",
      Jeudi: "jeudi",
      Vendredi: "vendredi",
      Samedi: "samedi",
      Dimanche: "dimanche",
    };

    const jourNormalise = joursDeSemaine[jour] || jour.toLowerCase();

    // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
    const result = await client.modifierCoursRecurrentAvecProfesseurs({
      cours_recurrent_id: coursRecurrentId,
      type_cours,
      jour_semaine: jourNormalise,
      heure_debut,
      heure_fin,
      professeurs,
    });

    console.log("Résultat modification cours:", result);

    res.status(200).json({
      success: true,
      message: result.message || "Cours récurrent modifié avec succès",
      data: result,
    });
  } catch (error: any) {
    console.error(
      "❌ [Modifier Cours] Erreur lors de la modification du cours :",
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur lors de la modification du cours",
      error instanceof Error ? error : undefined,
    );
  }
}
