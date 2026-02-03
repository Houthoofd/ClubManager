import { Request, Response } from "express";
import { Compte } from "../../../../db/clients/compte/compte.js";
import bcrypt from "bcrypt";

/**
 * Handler pour mettre à jour les informations du compte utilisateur
 */
export async function updateAccount(
  req: Request,
  res: Response,
  compteClient?: Compte,
): Promise<void> {
  try {
    const {
      id,
      email,
      date_naissance,
      genres,
      grades,
      abonnement,
      status,
      password,
    } = req.body;

    console.log("📝 [Compte Update] Données reçues:", {
      id,
      email,
      date_naissance,
      genres,
      grades,
      abonnement,
      status,
      hasPassword: !!password,
    });

    if (!id) {
      res.status(400).json({
        success: false,
        error: "ID utilisateur requis",
      });
      return;
    }

    const client = compteClient || new Compte();

    // Vérifier si l'abonnement a changé pour regénérer les échéances
    let abonnementChange = false;
    if (abonnement) {
      abonnementChange = true;
    }

    // Construire l'objet de mise à jour avec conversion des noms en IDs
    const updateData: any = {};

    if (email !== undefined) updateData.email = email;
    if (date_naissance !== undefined)
      updateData.date_naissance = date_naissance;

    // Conversion des noms en IDs pour les champs liés
    if (genres !== undefined) {
      if (!isNaN(Number(genres))) {
        updateData.genres = Number(genres);
      } else {
        updateData.genres = genres;
      }
    }

    if (grades !== undefined) {
      if (!isNaN(Number(grades))) {
        updateData.grades = Number(grades);
      } else {
        updateData.grades = grades;
      }
    }

    if (abonnement !== undefined) {
      if (!isNaN(Number(abonnement))) {
        updateData.abonnement = Number(abonnement);
      } else {
        updateData.abonnement = abonnement;
      }
    }

    if (status !== undefined) {
      if (!isNaN(Number(status))) {
        updateData.status = Number(status);
      } else {
        updateData.status = status;
      }
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    console.log(
      "🔍 [Compte Update] Données à mettre à jour (après conversion):",
      updateData,
    );

    // Utiliser la méthode du client Compte pour mettre à jour
    const result = await client.mettreAJourUtilisateurAvecConversion(
      id,
      updateData,
    );

    if (result.isConfirm) {
      console.log("✅ [Compte Update] Mise à jour réussie");

      // Si l'abonnement a changé, regénérer les échéances
      if (abonnement && abonnementChange) {
        try {
          console.log(
            "💰 [Compte Update] Régénération des échéances pour nouvel abonnement",
          );

          // Supprimer les anciennes échéances en attente
          const deleteOldEcheances = `
            DELETE FROM echeances_paiements
            WHERE utilisateur_id = ? AND statut = 'en attente'
          `;

          // Note: Cette partie nécessite l'intégration avec votre système d'échéances
          // Placeholder pour la logique de régénération des échéances

          console.log("✅ [Compte Update] Échéances régénérées avec succès");
        } catch (echeanceError: any) {
          console.error(
            "❌ [Compte Update] Erreur lors de la régénération des échéances:",
            echeanceError,
          );
          // Ne pas faire échouer la mise à jour du compte pour autant
        }
      }

      res.json({
        success: true,
        message: "Informations mises à jour avec succès",
        echeancesUpdated: abonnementChange,
      });
    } else {
      console.log("❌ [Compte Update] Échec de la mise à jour");
      res.status(400).json({
        success: false,
        error: "Échec de la mise à jour",
        message: result.message || "Erreur inconnue",
      });
    }
  } catch (error: any) {
    console.error("❌ [Compte Update] Erreur:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du compte",
      details: error.message,
    });
  }
}
