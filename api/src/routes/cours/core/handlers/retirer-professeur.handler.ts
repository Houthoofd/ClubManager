import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour retirer un ou plusieurs professeurs d'un cours récurrent
 */
export async function retirerProfesseur(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const { professeursNoms, jour, type_cours, heure_debut, heure_fin } =
      req.body;
    console.log("Données reçues pour retirer un professeur:", req.body);

    // Validation plus stricte des données d'entrée
    if (
      !Array.isArray(professeursNoms) ||
      professeursNoms.length === 0 ||
      !jour
    ) {
      throw new ValidationError("professeursNoms (array) et jour requis", [
        { field: "professeursNoms", message: "Tableau de noms requis" },
        { field: "jour", message: "Champ requis" },
      ]);
    }

    // Vérifier que les noms de professeurs ne sont pas null/undefined/vides
    const professeursValides = professeursNoms.filter(
      (nom) => nom && typeof nom === "string" && nom.trim() !== "",
    );

    if (professeursValides.length === 0) {
      console.error("❌ Aucun nom de professeur valide dans:", professeursNoms);
      throw new ValidationError(
        "Aucun nom de professeur valide fourni. Noms reçus: " +
          JSON.stringify(professeursNoms),
        [
          {
            field: "professeursNoms",
            message: "Aucun nom de professeur valide fourni",
          },
        ],
      );
    }

    if (professeursValides.length !== professeursNoms.length) {
      console.warn("⚠️ Certains noms de professeurs étaient invalides:", {
        original: professeursNoms,
        valides: professeursValides,
      });
    }

    const client = coursClient || new Cours();

    // Construire le contexte avec toutes les informations disponibles
    const coursContext = {
      type_cours,
      heure_debut,
      heure_fin,
    };

    console.log("🎯 Contexte utilisé pour la dissociation:", coursContext);
    console.log("🎯 Professeurs valides à dissocier:", professeursValides);

    // Si on a des informations précises (type, heures), utiliser la méthode directe
    if (type_cours && heure_debut && heure_fin) {
      console.log("✅ Utilisation de la méthode directe avec contexte complet");
      const result = await client.supprimerProfesseursParNomEtJour(
        professeursValides,
        jour,
        coursContext,
      );

      if (result.isConfirm) {
        res.status(200).json({
          success: true,
          message:
            result.message ||
            `${professeursValides.length} professeur(s) retiré(s) avec succès`,
          data: result,
        });
      } else {
        throw new NotFoundError(
          result.message || "Professeur(s) non trouvé(s)",
        );
      }
    } else {
      console.log("⚠️ Utilisation de la méthode avec résolution automatique");
      // Utiliser la résolution automatique si le contexte est incomplet
      const result =
        await client.supprimerProfesseursParNomEtJourAvecResolution(
          professeursValides,
          jour,
          coursContext,
        );

      if (result.isConfirm) {
        res.status(200).json({
          success: true,
          message:
            result.message ||
            `${professeursValides.length} professeur(s) retiré(s) avec succès`,
          data: result,
        });
      } else {
        throw new NotFoundError(
          result.message || "Professeur(s) non trouvé(s)",
        );
      }
    }
  } catch (error) {
    console.error("❌ [Retirer Professeur] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors du retrait du professeur",
      error instanceof Error ? error : undefined,
    );
  }
}
