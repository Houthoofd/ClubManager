import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { AjoutCours } from "@clubmanager/types";

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
      res.status(400).json({
        success: false,
        message:
          "Le nom du cours est requis et doit contenir au moins 2 caractères.",
      });
      return;
    }

    if (data.nom.length > 255) {
      res.status(400).json({
        success: false,
        message: "Le nom du cours ne peut pas dépasser 255 caractères.",
      });
      return;
    }

    if (!data.heure_debut || !data.heure_fin) {
      res.status(400).json({
        success: false,
        message: "Les heures de début et de fin sont requises.",
      });
      return;
    }

    // Validation du format des heures (HH:MM ou HH:MM:SS)
    const heureRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (
      !heureRegex.test(data.heure_debut) ||
      !heureRegex.test(data.heure_fin)
    ) {
      res.status(400).json({
        success: false,
        message: "Format d'heure invalide. Utilisez HH:MM ou HH:MM:SS.",
      });
      return;
    }

    // Validation que heure_fin est après heure_debut
    const [hDebut, mDebut] = data.heure_debut.split(":").map(Number);
    const [hFin, mFin] = data.heure_fin.split(":").map(Number);
    const minutesDebut = hDebut * 60 + mDebut;
    const minutesFin = hFin * 60 + mFin;

    if (minutesFin <= minutesDebut) {
      res.status(400).json({
        success: false,
        message: "L'heure de fin doit être après l'heure de début.",
      });
      return;
    }

    // Validation de la date (si fournie)
    if (data.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        res.status(400).json({
          success: false,
          message: "Format de date invalide. Utilisez YYYY-MM-DD.",
        });
        return;
      }

      const dateCours = new Date(data.date);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);

      if (dateCours < aujourdhui) {
        res.status(400).json({
          success: false,
          message: "La date du cours ne peut pas être dans le passé.",
        });
        return;
      }
    }

    // Validation du nombre de places (si fourni)
    if (data.places_max !== undefined) {
      const places = Number(data.places_max);
      if (isNaN(places) || places <= 0) {
        res.status(400).json({
          success: false,
          message: "Le nombre de places maximum doit être un nombre positif.",
        });
        return;
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
        res.status(400).json({
          success: false,
          message: `Jour invalide: ${data.jour_semaine}`,
        });
        return;
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
      res.status(400).json({
        success: false,
        message: "jour_semaine ou date est requis.",
      });
      return;
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
        res.status(409).json({
          success: false,
          message: `Conflit d'horaire détecté avec: ${conflits}. Impossible d'ajouter le cours.`,
        });
        return;
      }
    } catch (verificationError) {
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
      res.status(400).json({
        success: false,
        message:
          "Un ou plusieurs professeurs spécifiés n'existent pas en base de données. Veuillez vérifier les noms des professeurs.",
        details:
          "Erreur de référence de clé étrangère - professeurs introuvables",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'ajout du cours récurrent",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}
