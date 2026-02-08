/**
 * Handler POST /api/utilisateurs/inscription
 * Inscription d'un nouvel utilisateur avec envoi d'email de vérification
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import {
  inscrireUtilisateur,
  envoyerEmailVerification,
} from "../services/utilisateurs.service.js";
import { inscriptionUtilisateurSchema } from "../validators/utilisateurs.schema.js";

/**
 * Handler pour l'inscription d'un utilisateur
 * POST /api/utilisateurs/inscription
 *
 * Body:
 * {
 *   prenom: string,
 *   nom: string,
 *   nom_utilisateur?: string,
 *   email: string,
 *   password: string,
 *   genre_id: number,
 *   abonnement_id: number,
 *   date_naissance: string (YYYY-MM-DD),
 *   date_inscription?: string (YYYY-MM-DD),
 *   status_id?: number,
 *   grade_id?: number
 * }
 *
 * @returns 201 - Inscription réussie
 * @returns 400 - Données invalides
 * @returns 500 - Erreur serveur
 */
export async function inscription(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs
): Promise<void> {
  try {
    console.log(
      "📝 [Handler Utilisateurs] POST /inscription - Inscription utilisateur"
    );
    console.log("[Handler Utilisateurs] Body reçu:", req.body);

    // Générer automatiquement le nom_utilisateur s'il n'est pas fourni
    if (!req.body.nom_utilisateur || req.body.nom_utilisateur.trim() === "") {
      const prenom = req.body.prenom
        ? req.body.prenom.toLowerCase().replace(/\s+/g, "")
        : "";
      const nom = req.body.nom
        ? req.body.nom.toLowerCase().replace(/\s+/g, "")
        : "";
      const timestamp = Date.now().toString().slice(-4);

      req.body.nom_utilisateur = `${prenom}_${nom}_${timestamp}`;
      console.log(
        "[Handler Utilisateurs] Nom d'utilisateur généré:",
        req.body.nom_utilisateur
      );
    }

    // Validation avec Zod
    const validationResult = inscriptionUtilisateurSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.log(
        "[Handler Utilisateurs] Erreur de validation Zod:",
        validationResult.error.issues
      );
      res.status(400).json({
        message:
          validationResult.error.issues[0]?.message || "Données invalides",
        errors: validationResult.error.issues,
      });
      return;
    }

    const validatedData = validationResult.data;
    console.log("[Handler Utilisateurs] Données validées:", validatedData);

    // Mapper vers le format attendu par la base de données
    const mappedData = {
      prenom: validatedData.prenom,
      nom: validatedData.nom,
      nom_utilisateur: validatedData.nom_utilisateur,
      email: validatedData.email,
      password: validatedData.password,
      genre_id: validatedData.genre_id,
      abonnement_id: validatedData.abonnement_id,
      date_naissance: validatedData.date_naissance,
      date_inscription: validatedData.date_inscription,
      status_id: validatedData.status_id,
      grade_id: validatedData.grade_id,
    };

    console.log("[Handler Utilisateurs] Données mappées pour DB:", mappedData);

    // Appel du service d'inscription
    const result = await inscrireUtilisateur(mappedData, utilisateursClient);

    console.log("[Handler Utilisateurs] Résultat inscription:", result);

    // Envoi email de vérification
    if (result.userId && result.generatedUserId) {
      try {
        console.log(
          "📧 [Handler Utilisateurs] Démarrage envoi email de vérification..."
        );
        console.log(
          `📧 [Handler Utilisateurs] Email destinataire: ${validatedData.email}`
        );
        console.log(
          `📧 [Handler Utilisateurs] Utilisateur: ${validatedData.prenom} ${validatedData.nom}`
        );
        console.log(
          `📧 [Handler Utilisateurs] UserId généré: ${result.userId}`
        );

        const emailResult = await envoyerEmailVerification(
          validatedData.email,
          validatedData.prenom,
          validatedData.nom,
          result.generatedUserId,
          result.userId
        );

        if (emailResult.success) {
          console.log(
            "✅ [Handler Utilisateurs] Email de vérification envoyé avec succès"
          );

          res.status(201).json({
            message: "Inscription réussie et email de vérification envoyé",
            generatedUserId: result.userId,
            inscriptionDetails: result.details,
            emailStatus: {
              sent: true,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false,
              note: `Email de vérification envoyé à ${validatedData.email}`,
            },
          });
        } else {
          console.warn(
            "⚠️ [Handler Utilisateurs] Échec envoi email de vérification"
          );

          res.status(201).json({
            message:
              "Inscription réussie mais échec envoi email de vérification",
            generatedUserId: result.userId,
            inscriptionDetails: result.details,
            emailStatus: {
              sent: false,
              message: emailResult.message,
              details: emailResult.details,
              emailDestination: validatedData.email,
              isTestMode: false,
            },
            warning:
              "L'email de vérification n'a pas pu être envoyé. Veuillez vérifier votre configuration.",
          });
        }
      } catch (emailError: any) {
        console.error(
          "❌ [Handler Utilisateurs] Erreur critique lors de l'envoi de l'email:",
          emailError
        );

        res.status(201).json({
          message: "Inscription réussie mais erreur lors de l'envoi de l'email",
          generatedUserId: result.userId,
          inscriptionDetails: result.details,
          emailStatus: {
            sent: false,
            error: "Erreur technique lors de l'envoi",
            details: { originalError: emailError.message },
            emailDestination: validatedData.email,
            isTestMode: false,
          },
          warning:
            "Une erreur technique s'est produite lors de l'envoi de l'email de vérification.",
        });
      }
    } else {
      console.warn(
        "⚠️ [Handler Utilisateurs] Inscription sans UserId généré - pas d'email envoyé"
      );

      res.status(201).json({
        message: "Inscription réussie",
        inscriptionDetails: result.details,
        emailStatus: {
          sent: false,
          reason: "Aucun UserId généré",
        },
      });
    }
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur lors de l'inscription:",
      error
    );

    res.status(500).json({
      message: error.message || "Erreur interne du serveur",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
