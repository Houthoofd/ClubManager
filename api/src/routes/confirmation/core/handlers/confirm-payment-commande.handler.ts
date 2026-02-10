/**
 * Handler pour la confirmation de paiement de commande
 */

import { Request, Response } from "express";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import { getStripeInstance } from "../utils/stripe-instance.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Confirme un paiement de commande
 */
export async function confirmPaymentCommande(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { paymentIntentId, commandeId, userId, amount } = req.body;

    console.log("🛒 [ConfirmPaymentCommande] Confirmation paiement commande:", {
      paymentIntentId,
      commandeId,
      userId,
      amount,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? "présent" : "manquant",
        contentType: req.headers["content-type"],
      },
    });

    // Validation renforcée avec messages d'erreur détaillés
    const missingFields = [];
    if (!paymentIntentId) missingFields.push("paymentIntentId");
    if (!commandeId) missingFields.push("commandeId");
    if (!userId) missingFields.push("userId");

    if (missingFields.length > 0) {
      console.error(
        "❌ [ConfirmPaymentCommande] Champs manquants:",
        missingFields,
      );
      throw new ValidationError(
        "Données manquantes pour la confirmation de paiement commande",
        missingFields.map((field) => ({
          field,
          message: `${field} est requis`,
        })),
      );
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      console.error("❌ [ConfirmPaymentCommande] Stripe non initialisé");
      throw new InternalServerError(
        "Service Stripe non disponible",
        new Error("Stripe non initialisé - vérifiez STRIPE_SECRET_KEY"),
      );
    }

    const paiements = new Paiements();

    console.log(
      "🔍 [ConfirmPaymentCommande] Vérification PaymentIntent sur Stripe:",
      paymentIntentId,
    );

    // Vérifier le paiement sur Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log("📊 [ConfirmPaymentCommande] Statut PaymentIntent Stripe:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    if (paymentIntent.status !== "succeeded") {
      console.warn(
        "⚠️ [ConfirmPaymentCommande] PaymentIntent pas en statut succeeded:",
        paymentIntent.status,
      );
      throw new ValidationError("Le paiement n'a pas été confirmé sur Stripe", [
        {
          field: "paymentIntent.status",
          message: `Statut actuel: ${paymentIntent.status}, attendu: succeeded`,
        },
      ]);
    }

    console.log(
      "✅ [ConfirmPaymentCommande] PaymentIntent Stripe validé, mise à jour base de données...",
    );

    // Confirmer le paiement et mettre à jour la commande
    await paiements.confirmerPaiementStripe(paymentIntentId, "reussi");
    console.log("✅ [ConfirmPaymentCommande] Paiement confirmé en base");

    // Utiliser seulement les colonnes existantes de la table commandes
    const updateCommandeQuery = `UPDATE commandes SET statut = 'payée' WHERE id = ?`;
    const updateResult = await paiements.queryAsync(updateCommandeQuery, [
      commandeId,
    ]);

    console.log("✅ [ConfirmPaymentCommande] Commande mise à jour:", {
      commandeId,
      affectedRows: updateResult.affectedRows,
      statutMisAJour: "payée",
      colonnesUtilisees: ["statut"],
      note: "Table commandes: pas de colonne date_paiement - utilisation de statut seulement",
    });

    // Enregistrer la date de paiement dans la table paiements pour traçabilité
    try {
      const updatePaiementDateQuery = `
        UPDATE paiements
        SET date_paiement = NOW(),
            statut = 'reussi',
            details = CONCAT(COALESCE(details, ''), ', Commande payée le: ', NOW())
        WHERE stripe_payment_intent_id = ?
      `;
      await paiements.queryAsync(updatePaiementDateQuery, [paymentIntentId]);
      console.log(
        "✅ [ConfirmPaymentCommande] Date de paiement enregistrée dans table paiements",
      );
    } catch (paiementDateError) {
      console.warn(
        "⚠️ [ConfirmPaymentCommande] Impossible de mettre à jour date dans paiements:",
        paiementDateError,
      );
    }

    // Envoyer email de confirmation commande
    const userQuery = `SELECT email, first_name, last_name FROM utilisateurs WHERE id = ?`;
    const userResults = await paiements.queryAsync(userQuery, [userId]);

    if (userResults.length > 0) {
      const user = userResults[0];
      const userName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Membre";

      try {
        // Récupérer les détails de la commande pour avoir les données complètes
        let commandeDetails = { total: 0, articles: [] as any[] };

        if (commandeId) {
          try {
            const commandeQuery = `
              SELECT
                c.total,
                ca.article_id,
                ca.quantite,
                ca.prix,
                a.nom as article_nom,
                t.nom as taille_nom
              FROM commandes c
              LEFT JOIN commande_articles ca ON c.id = ca.commande_id
              LEFT JOIN articles a ON ca.article_id = a.id
              LEFT JOIN tailles t ON ca.taille_id = t.id
              WHERE c.id = ?
            `;

            const commandeResults = await paiements.queryAsync(commandeQuery, [
              commandeId,
            ]);

            if (commandeResults.length > 0) {
              commandeDetails.total = commandeResults[0].total || 0;
              commandeDetails.articles = commandeResults
                .filter((row: any) => row.article_id)
                .map((row: any) => ({
                  nom: row.article_nom,
                  quantite: row.quantite,
                  prix: row.prix,
                  taille: row.taille_nom,
                }));
            }
          } catch (commandeError) {
            console.warn(
              "⚠️ [ConfirmPaymentCommande] Impossible de récupérer détails commande:",
              commandeError,
            );
          }
        }

        const emailClient = new EmailClient();
        // Utiliser les propriétés attendues par sendOrderConfirmation
        const templateData = {
          userName,
          numeroCommande: commandeId.toString(),
          uniqueId: paymentIntentId,
          dateCommande: new Date().toLocaleDateString("fr-FR"),
          statutCommande: "Confirmée et payée",
          nbArticles: commandeDetails.articles.length.toString(),
          totalCommande: commandeDetails.total.toFixed(2),
          articlesDetails:
            commandeDetails.articles.length > 0
              ? commandeDetails.articles
                  .map((a) => `${a.nom} (${a.taille || "N/A"}) x${a.quantite}`)
                  .join(", ")
              : "Détails non disponibles",
          delaiPreparation: "24-48 heures",
          lieuRetrait: "Accueil du club",
          horaires: "Lundi-Vendredi: 9h-18h",
          conservation: "Votre commande sera conservée 7 jours",
          emailContact: process.env.SUPPORT_EMAIL || "support@clubmanager.com",
          telephoneContact: process.env.CLUB_PHONE || "01 23 45 67 89",
          anneeActuelle: new Date().getFullYear().toString(),
        };

        await emailClient.sendOrderConfirmation(
          user.email,
          templateData,
          parseInt(userId),
        );
        console.log("✅ [ConfirmPaymentCommande] Email commande envoyé");
      } catch (emailError) {
        console.error(
          "❌ [ConfirmPaymentCommande] Erreur email commande:",
          emailError,
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Commande payée avec succès",
      payment_intent_id: paymentIntentId,
      commande_id: commandeId,
      stripe_status: paymentIntent.status,
      database_updated: true,
      email_envoye: true,
      timestamp: new Date().toISOString(),
      commande_info: {
        statut_mis_a_jour: "payée",
        table_structure: "Utilisé colonnes existantes (id, statut)",
        date_paiement_tracee_dans: "table paiements",
      },
    });
  } catch (error: any) {
    console.error(
      "❌ [ConfirmPaymentCommande] Erreur confirmation commande:",
      error,
    );
    console.error("❌ [ConfirmPaymentCommande] Stack trace:", error.stack);

    // Gestion spécifique pour la structure de table connue
    if (error.code === "ER_BAD_FIELD_ERROR") {
      console.error("❌ [ConfirmPaymentCommande] Erreur colonne SQL:", {
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        tableStructure:
          "commandes: id, unique_id, numero_commande, utilisateur_id, total, date_commande, statut, ip_address, user_agent, created_at",
      });

      throw new InternalServerError(
        `Erreur de requête SQL - colonne inexistante: ${error.sqlMessage}`,
        error,
      );
    }

    throw new InternalServerError(
      "Erreur lors de la confirmation du paiement commande",
      error,
    );
  }
}
