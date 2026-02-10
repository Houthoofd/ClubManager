import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { AjoutCours } from "@clubmanager/types";
import {
  ValidationError,
  ConflictError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour ajouter un cours récurrent
 */
export async function ajouterCours(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const data = req.body;
    console.log("Données reçues pour ajouter un cours:", data);

    // Validation des champs requis
    if (!data.nom || data.nom.length < 2) {
      throw new ValidationError(
        "Le nom du cours est requis et doit contenir au moins 2 caractères",
        [
          {
            field: "nom",
            message:
              "Le nom du cours est requis et doit contenir au moins 2 caractères",
          },
        ],
      );
    }

    if (data.nom.length > 255) {
      throw new ValidationError(
        "Le nom du cours ne peut pas dépasser 255 caractères",
        [
          {
            field: "nom",
            message: "Le nom du cours ne peut pas dépasser 255 caractères",
          },
        ],
      );
    }

    if (!data.heure_debut || !data.heure_fin) {
      throw new ValidationError("Les heures de début et de fin sont requises", [
        { field: "heure_debut", message: "Champ requis" },
        { field: "heure_fin", message: "Champ requis" },
      ]);
    }

    // Validation du format des heures (HH:MM ou HH:MM:SS)
    const heureRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (
      !heureRegex.test(data.heure_debut) ||
      !heureRegex.test(data.heure_fin)
    ) {
      throw new ValidationError(
        "Format d'heure invalide. Utilisez HH:MM ou HH:MM:SS",
        [
          {
            field: "heure_debut",
            message: "Format d'heure invalide. Utilisez HH:MM ou HH:MM:SS",
          },
          {
            field: "heure_fin",
            message: "Format d'heure invalide. Utilisez HH:MM ou HH:MM:SS",
          },
        ],
      );
    }

    // Validation que heure_fin est après heure_debut
    const [hDebut, mDebut] = data.heure_debut.split(":").map(Number);
    const [hFin, mFin] = data.heure_fin.split(":").map(Number);
    const minutesDebut = hDebut * 60 + mDebut;
    const minutesFin = hFin * 60 + mFin;

    if (minutesFin <= minutesDebut) {
      throw new ValidationError(
        "L'heure de fin doit être après l'heure de début",
        [
          {
            field: "heure_fin",
            message: "L'heure de fin doit être après l'heure de début",
          },
        ],
      );
    }

    // Validation de la date (si fournie)
    if (data.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        throw new ValidationError(
          "Format de date invalide. Utilisez YYYY-MM-DD",
          [
            {
              field: "date",
              message: "Format de date invalide. Utilisez YYYY-MM-DD",
            },
          ],
        );
      }

      const dateCours = new Date(data.date);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      if (dateCours < aujourdhui) {
        throw new ValidationError(
          "La date du cours ne peut pas être dans le passé",
          [
            {
              field: "date",
              message: "La date du cours ne peut pas être dans le passé",
            },
          ],
        );
      }
    }

    // Validation du nombre de places (si fourni)
    if (data.places_max !== undefined) {
      const places = Number(data.places_max);
      if (isNaN(places) || places <= 0) {
        throw new ValidationError(
          "Le nombre de places maximum doit être un nombre positif",
          [
            {
              field: "places_max",
              message:
                "Le nombre de places maximum doit être un nombre positif",
            },
          ],
        );
      }
    }

    // Mapping des jours pour convertir le nom en jour_semaine
    const joursDeSemaine: { [key: string]: string } = {
      Lundi: "lundi",
      Mardi: "mardi",
      Mercredi: "mercredi",
      Jeudi: "jeudi",
      Vendredi: "vendredi",
      Samedi: "samedi",
      Dimanche: "dimanche",
    };

    // Support pour date ou jour_semaine
    let jourNormalise: string;

    if (data.jour_semaine) {
      // Convertit le jour reçu (ex: "Vendredi") en format attendu par la procédure (ex: "vendredi")
      jourNormalise =
        joursDeSemaine[data.jour_semaine] || data.jour_semaine.toLowerCase();
      if (
        ![
          "lundi",
          "mardi",
          "mercredi",
          "jeudi",
          "vendredi",
          "samedi",
          "dimanche",
        ].includes(jourNormalise)
      ) {
        throw new ValidationError(`Jour invalide: ${data.jour_semaine}`, [
          {
            field: "jour_semaine",
            message: `Jour invalide: ${data.jour_semaine}`,
          },
        ]);
      }
    } else if (data.date) {
      // Déduire le jour de la semaine à partir de la date
      const dateObj = new Date(data.date);
      const joursIndex = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];
      jourNormalise = joursIndex[dateObj.getDay()];
    } else {
      throw new ValidationError("jour_semaine ou date est requis", [
        { field: "jour_semaine", message: "Champ requis" },
        { field: "date", message: "Champ requis" },
      ]);
    }

    const client = coursClient || new Cours();

    // Vérification des conflits d'horaires AVANT d'ajouter
    try {
      const coursExistants = await client.obtenirLesJoursDeCours();
      const coursConflituels = coursExistants.filter((c) => {
        // Vérifier que les heures ne sont pas null avant de faire les comparaisons
        if (
          !c.heure_debut ||
          !c.heure_fin ||
          !data.heure_debut ||
          !data.heure_fin
        ) {
          return false; // Ignorer les cours avec des heures null
        }

        return (
          c.jour.toLowerCase() === jourNormalise &&
          ((data.heure_debut >= c.heure_debut &&
            data.heure_debut < c.heure_fin) ||
            (data.heure_fin > c.heure_debut && data.heure_fin <= c.heure_fin) ||
            (data.heure_debut <= c.heure_debut &&
              data.heure_fin >= c.heure_fin))
        );
      });

      if (coursConflituels.length > 0) {
        const conflits = coursConflituels
          .map((c) => `${c.type_cours} ${c.heure_debut}-${c.heure_fin}`)
          .join(", ");
        throw new ConflictError(
          `Conflit d'horaire détecté avec: ${conflits}. Impossible d'ajouter le cours`,
        );
      }
    } catch (verificationError) {
      // Re-throw si c'est déjà une erreur GraphQL
      if (verificationError instanceof ConflictError) {
        throw verificationError;
      }
      console.log(
        "Erreur lors de la vérification des conflits:",
        verificationError,
      );
      // Continuer quand même si la vérification échoue
    }

    // Gestion des professeurs
    let professeurs = [];
    if (Array.isArray(data.professeurs)) {
      professeurs = data.professeurs;
    } else if (typeof data.professeurs === "string") {
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
      professeurs: professeurs,
    };

    console.log("Utilisation de la procédure optimisée avec:", ajoutCours);

    // NOUVELLE MÉTHODE OPTIMISÉE avec procédure stockée
    const result =
      await client.ajouterCoursRecurrentAvecProfesseurs(ajoutCours);

    res.status(200).json({
      success: true,
      message: result.message || "Cours récurrent ajouté avec succès",
      data: result,
    });
  } catch (error) {
    console.error("❌ [Ajouter Cours] Erreur:", error);

    // Gestion spécifique de l'erreur de clé étrangère
    if (
      error instanceof Error &&
      error.message.includes("ER_NO_REFERENCED_ROW_2")
    ) {
      throw new ValidationError(
        "Un ou plusieurs professeurs spécifiés n'existent pas en base de données. Veuillez vérifier les noms des professeurs",
        [
          {
            field: "professeurs",
            message: "Professeurs introuvables",
          },
        ],
      );
    }

    // Re-throw les erreurs GraphQL
    if (
      error instanceof ValidationError ||
      error instanceof ConflictError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de l'ajout du cours récurrent",
      error instanceof Error ? error : undefined,
    );
  }
}
