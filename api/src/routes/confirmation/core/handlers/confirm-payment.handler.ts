/**
 * Handler pour la confirmation de paiement d'échéance
 */

import { Request, Response } from "express";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import { formatMontant } from "../utils/format-montant.js";
import { getStripeInstance } from "../utils/stripe-instance.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Confirme un paiement d'échéance
 */
export async function confirmPayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { paymentIntentId, echeanceId, userId, amount } = req.body;

    console.log("🎉 [ConfirmPayment] Confirmation paiement échéance:", {
      paymentIntentId,
      echeanceId,
      userId,
      amount,
    });

    // Validation des paramètres
    if (!paymentIntentId || !echeanceId || !userId) {
      throw new ValidationError(
        "Données manquantes pour la confirmation de paiement",
        [
          { field: "paymentIntentId", message: "PaymentIntent ID requis" },
          { field: "echeanceId", message: "Échéance ID requis" },
          { field: "userId", message: "User ID requis" },
        ],
      );
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      throw new InternalServerError(
        "Service Stripe non disponible",
        new Error("Stripe non initialisé"),
      );
    }

    const paiements = new Paiements();

    // Vérifier d'abord si l'échéance est déjà payée
    const checkEcheanceQuery = `
      SELECT id, statut, utilisateur_id, montant, date_echeance, abonnement_id
      FROM echeances_paiements
      WHERE id = ?
    `;
    const echeanceCheck = await paiements.queryAsync(checkEcheanceQuery, [
      parseInt(echeanceId),
    ]);

    if (echeanceCheck.length === 0) {
      throw new NotFoundError(`Échéance non trouvée: ${echeanceId}`);
    }

    const echeanceActuelle = echeanceCheck[0];

    // Si déjà payée, considérer comme succès (idempotence)
    if (echeanceActuelle.statut === "payé") {
      console.log(
        "ℹ️ [ConfirmPayment] Échéance déjà payée - opération idempotente",
      );
      res.status(200).json({
        success: true,
        message: "Paiement confirmé (échéance déjà payée)",
        paiement_id: paymentIntentId,
        echeance_id: parseInt(echeanceId),
        premier_paiement: false,
        statut_upgrade: null,
        echeance_confirmee: true,
        already_paid: true,
      });
      return;
    }

    // Vérifier si c'est le premier paiement AVANT de traiter
    const premierPaiement = await paiements.estPremierPaiement(
      parseInt(userId),
    );

    // Confirmer le paiement Stripe d'abord (table paiements)
    try {
      await paiements.confirmerPaiementStripe(paymentIntentId, "reussi");
      console.log("✅ [ConfirmPayment] Paiement Stripe confirmé en base");
    } catch (stripeError: any) {
      console.error(
        "❌ [ConfirmPayment] Erreur confirmation Stripe:",
        stripeError,
      );
      // Continue même si erreur - peut être déjà confirmé
    }

    // Marquer l'échéance comme payée
    try {
      const updateEcheanceQuery = `
        UPDATE echeances_paiements
        SET
          statut = 'payé',
          date_paiement = CURDATE()
        WHERE id = ? AND statut != 'payé'
      `;

      const updateResult = await paiements.queryAsync(updateEcheanceQuery, [
        parseInt(echeanceId),
      ]);

      if (updateResult.affectedRows === 0) {
        console.warn(
          "⚠️ [ConfirmPayment] Aucune ligne mise à jour - échéance peut-être déjà payée",
        );

        // Vérifier le statut actuel
        const recheckEcheance = await paiements.queryAsync(checkEcheanceQuery, [
          parseInt(echeanceId),
        ]);
        if (
          recheckEcheance.length > 0 &&
          recheckEcheance[0].statut === "payé"
        ) {
          console.log(
            "ℹ️ [ConfirmPayment] Échéance confirmée comme déjà payée",
          );
          // Continue avec le succès
        } else {
          throw new InternalServerError(
            "Impossible de mettre à jour l'échéance",
            new Error("L'échéance n'a pas pu être marquée comme payée"),
          );
        }
      } else {
        console.log("✅ [ConfirmPayment] Échéance marquée comme payée:", {
          echeanceId: parseInt(echeanceId),
          affectedRows: updateResult.affectedRows,
        });
      }
    } catch (updateError: any) {
      console.error(
        "❌ [ConfirmPayment] Erreur mise à jour échéance:",
        updateError,
      );

      if (updateError.code === "ER_DUP_ENTRY") {
        console.warn(
          "⚠️ [ConfirmPayment] Erreur de contrainte détectée - vérification état",
        );

        // Vérifier si l'échéance est maintenant payée malgré l'erreur
        const finalCheck = await paiements.queryAsync(checkEcheanceQuery, [
          parseInt(echeanceId),
        ]);
        if (finalCheck.length > 0 && finalCheck[0].statut === "payé") {
          console.log(
            "✅ [ConfirmPayment] Échéance finalement payée malgré l'erreur",
          );
          // Continuer avec le succès
        } else {
          throw new InternalServerError(
            "Erreur de contrainte de base de données - conflit détecté",
            updateError,
          );
        }
      } else {
        throw updateError;
      }
    }

    // Promotion automatique visiteur → utilisateur si premier paiement
    let statutUpgrade: string | null = null;
    if (premierPaiement) {
      try {
        const statusQuery = `
          SELECT u.status_id, s.nom_role as status_actuel
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
        const statusResult = await paiements.queryAsync(statusQuery, [userId]);

        if (
          statusResult.length > 0 &&
          statusResult[0].status_actuel === "visiteur"
        ) {
          const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
          const nouveauStatut = await paiements.queryAsync(
            utilisateurStatusQuery,
            [],
          );

          if (nouveauStatut.length > 0) {
            const updateUserQuery = `
              UPDATE utilisateurs
              SET status_id = ?, date_modification = NOW()
              WHERE id = ? AND status_id = ?
            `;

            const updateResult = await paiements.queryAsync(updateUserQuery, [
              nouveauStatut[0].id,
              userId,
              statusResult[0].status_id,
            ]);

            if (updateResult.affectedRows > 0) {
              statutUpgrade = "visiteur → utilisateur";
              console.log(
                `✅ [ConfirmPayment] Utilisateur ${userId} promu à utilisateur`,
              );
            }
          }
        }
      } catch (promotionError) {
        console.error("❌ [ConfirmPayment] Erreur promotion:", promotionError);
      }
    }

    // Envoyer email de confirmation
    try {
      const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
      const userResults = await paiements.queryAsync(userQuery, [userId]);

      if (userResults.length > 0) {
        const user = userResults[0];
        const userName =
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Membre";

        const emailClient = new EmailClient();
        const templateData = {
          userName,
          amount: formatMontant(parseFloat(amount)),
          paymentDate: new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          currency: "EUR",
          echeanceId: parseInt(echeanceId).toString(),
          paymentIntentId,
          premierPaiement,
          ...(premierPaiement && {
            isFirstPayment: true,
            welcomeMessage:
              "🎉 Bienvenue ! Votre premier paiement a été confirmé avec succès.",
            statusUpgrade: statutUpgrade,
          }),
          transactionId: paymentIntentId,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
        };

        await emailClient.sendPaymentConfirmation(
          user.email,
          templateData,
          parseInt(userId),
        );
        console.log("✅ [ConfirmPayment] Email de confirmation envoyé");
      }
    } catch (emailError) {
      console.error("❌ [ConfirmPayment] Erreur envoi email:", emailError);
    }

    // Réponse de succès
    let successMessage = "Paiement confirmé avec succès";
    if (premierPaiement) {
      successMessage += ". 🎉 Félicitations pour votre premier paiement !";
      if (statutUpgrade?.includes("→")) {
        successMessage += ` Votre statut a été mis à jour : ${statutUpgrade}.`;
      }
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      paiement_id: paymentIntentId,
      echeance_id: parseInt(echeanceId),
      premier_paiement: premierPaiement,
      statut_upgrade: statutUpgrade,
      echeance_confirmee: true,
    });
  } catch (error: any) {
    console.error("❌ [ConfirmPayment] Erreur confirmation paiement:", error);

    // Gestion globale des erreurs de contrainte
    if (error.code === "ER_DUP_ENTRY") {
      console.warn("⚠️ [ConfirmPayment] Gestion erreur de doublon global");
      res.status(200).json({
        success: true,
        message: "Paiement confirmé (doublon détecté mais état cohérent)",
        paiement_id: req.body.paymentIntentId,
        duplicate_resolved: true,
        error_handled: true,
      });
      return;
    }

    throw new InternalServerError(
      "Erreur lors de la confirmation du paiement",
      error,
    );
  }
}
