/**
 * Resolvers GraphQL pour le module Cours
 * ✅ Pattern standardisé avec middlewares partagés
 *
 * @module cours.resolvers
 */

import type { GraphQLContext } from "../../../../shared/types/context.types.js";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import {
  ajouterCoursInputSchema,
  modifierCoursInputSchema,
  inscrireUtilisateurInputSchema,
  desinscrireUtilisateurInputSchema,
  presenceInputSchema,
  retirerProfesseurInputSchema,
  type AjouterCoursInput,
  type ModifierCoursInput,
  type InscrireUtilisateurInput,
  type DesinscrireUtilisateurInput,
  type PresenceInput,
  type RetirerProfesseurInput,
} from "@clubmanager/types/validators";
import { validateInput } from "../../../../shared/middleware/validation.middleware.js";
import { combineMiddlewares } from "../../../../shared/middleware/auth.middleware.js";
import { requireAuth, requireAdmin, requireStaff } from "../../../../shared/middleware/auth.middleware.js";
import { withSentry } from "../../../../shared/middleware/sentry.middleware.js";

// ============================================
// QUERY RESOLVERS
// ============================================

/**
 * Obtenir tous les cours récurrents
 */
const tousLesCoursResolver = async (
  _parent: unknown,
  _args: unknown,
  _context: GraphQLContext,
) => {
  const coursClient = new Cours();
  const cours = await coursClient.obtenirLesJoursDeCours();

  // Mapper les données pour correspondre au schéma GraphQL
  return cours.map((c: any) => ({
    id: c.id,
    nom: c.type_cours || c.nom,
    type_cours: c.type_cours,
    jour_semaine: c.jour?.toLowerCase() || c.jour_semaine,
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
    professeurs: c.professeurs ? (Array.isArray(c.professeurs) ? c.professeurs : [c.professeurs]) : [],
    places_max: c.places_max,
    created_at: c.created_at,
  }));
};

/**
 * Obtenir le planning complet par jour
 */
const planningCoursResolver = async (
  _parent: unknown,
  _args: unknown,
  _context: GraphQLContext,
) => {
  const coursClient = new Cours();
  const cours = await coursClient.obtenirLesJoursDeCours();

  // Grouper les cours par jour
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const planning = jours.map(jour => {
    const coursJour = cours
      .filter((c: any) => c.jour?.toLowerCase() === jour || c.jour_semaine === jour)
      .map((c: any) => ({
        id: c.id,
        nom: c.type_cours || c.nom,
        type_cours: c.type_cours,
        jour_semaine: jour,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        professeurs: c.professeurs ? (Array.isArray(c.professeurs) ? c.professeurs : [c.professeurs]) : [],
        places_max: c.places_max,
        created_at: c.created_at,
      }));

    return {
      jour,
      cours: coursJour,
    };
  });

  return planning;
};

/**
 * Obtenir les cours d'un utilisateur
 */
const coursUtilisateurResolver = async (
  _parent: unknown,
  args: { utilisateurId: number },
  context: GraphQLContext,
) => {
  const { utilisateurId } = args;

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (context.user?.id !== utilisateurId && context.user?.role !== 'admin') {
    throw new ValidationError(
      "Non autorisé à consulter les cours de cet utilisateur",
      [{ field: "utilisateurId", message: "Accès refusé" }]
    );
  }

  const coursClient = new Cours();
  const inscriptions = await coursClient.obtenirInscriptionsUtilisateur(utilisateurId);

  return inscriptions.map((i: any) => ({
    id: i.id,
    utilisateur_id: i.utilisateur_id,
    cours_id: i.cours_id,
    date_inscription: i.date_inscription,
    presence_validee: i.presence_validee || false,
    utilisateur_nom: i.utilisateur_nom,
    utilisateur_prenom: i.utilisateur_prenom,
    cours_date: i.cours_date,
    cours_type: i.cours_type,
  }));
};

/**
 * Obtenir les participants d'un cours
 */
const participantsCoursResolver = async (
  _parent: unknown,
  args: { coursId: number },
  _context: GraphQLContext,
) => {
  const { coursId } = args;

  const coursClient = new Cours();
  const participants = await coursClient.obtenirParticipantsCours(coursId);

  return {
    cours_id: coursId,
    cours_date: participants[0]?.cours_date,
    cours_type: participants[0]?.cours_type,
    total_participants: participants.length,
    participants: participants.map((p: any) => ({
      id: p.id,
      utilisateur_id: p.utilisateur_id,
      cours_id: p.cours_id,
      date_inscription: p.date_inscription,
      presence_validee: p.presence_validee || false,
      utilisateur_nom: p.utilisateur_nom,
      utilisateur_prenom: p.utilisateur_prenom,
      cours_date: p.cours_date,
      cours_type: p.cours_type,
    })),
  };
};

/**
 * Obtenir les inscriptions d'un utilisateur
 */
const inscriptionsUtilisateurResolver = async (
  _parent: unknown,
  args: { utilisateurId: number },
  context: GraphQLContext,
) => {
  const { utilisateurId } = args;

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (context.user?.id !== utilisateurId && context.user?.role !== 'admin') {
    throw new ValidationError(
      "Non autorisé à consulter les inscriptions de cet utilisateur",
      [{ field: "utilisateurId", message: "Accès refusé" }]
    );
  }

  const coursClient = new Cours();
  const inscriptions = await coursClient.obtenirInscriptionsUtilisateur(utilisateurId);

  return inscriptions.map((i: any) => ({
    id: i.id,
    utilisateur_id: i.utilisateur_id,
    cours_id: i.cours_id,
    date_inscription: i.date_inscription,
    presence_validee: i.presence_validee || false,
    utilisateur_nom: i.utilisateur_nom,
    utilisateur_prenom: i.utilisateur_prenom,
    cours_date: i.cours_date,
    cours_type: i.cours_type,
  }));
};

/**
 * Obtenir les statistiques d'un cours
 */
const statistiquesCoursResolver = async (
  _parent: unknown,
  args: { coursId: number },
  _context: GraphQLContext,
) => {
  const { coursId } = args;

  const coursClient = new Cours();

  // Récupérer les informations du cours
  const cours = await coursClient.obtenirLesJoursDeCours();
  const coursInfo = cours.find((c: any) => c.id === coursId);

  if (!coursInfo) {
    throw new NotFoundError(`Cours non trouvé: ${coursId}`);
  }

  // Récupérer les inscriptions
  const participants = await coursClient.obtenirParticipantsCours(coursId);

  // Calculer les statistiques
  const totalInscriptions = participants.length;
  const presencesValidees = participants.filter((p: any) => p.presence_validee).length;
  const tauxPresence = totalInscriptions > 0 ? (presencesValidees / totalInscriptions) * 100 : 0;

  return {
    cours_id: coursId,
    nom: coursInfo.type_cours || coursInfo.nom,
    type_cours: coursInfo.type_cours,
    total_inscriptions: totalInscriptions,
    taux_presence: tauxPresence,
    places_max: coursInfo.places_max,
    moyenne_participants: totalInscriptions,
  };
};

// ============================================
// MUTATION RESOLVERS
// ============================================

/**
 * Ajouter un cours récurrent
 */
const ajouterCoursResolver = async (
  _parent: unknown,
  args: { input: AjouterCoursInput },
  _context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(ajouterCoursInputSchema, input);

  console.log("🎓 [AjouterCours] Ajout cours:", validatedInput);

  const coursClient = new Cours();

  // Vérification des conflits d'horaires
  try {
    const coursExistants = await coursClient.obtenirLesJoursDeCours();
    const coursConflituels = coursExistants.filter((c: any) => {
      if (!c.heure_debut || !c.heure_fin) return false;

      const jourMatch = c.jour?.toLowerCase() === validatedInput.jour_semaine ||
                        c.jour_semaine === validatedInput.jour_semaine;

      if (!jourMatch) return false;

      const [hDebut, mDebut] = validatedInput.heure_debut.split(':').map(Number);
      const [hFin, mFin] = validatedInput.heure_fin.split(':').map(Number);
      const minutesDebut = hDebut * 60 + mDebut;
      const minutesFin = hFin * 60 + mFin;

      const [hDebutExist, mDebutExist] = c.heure_debut.split(':').map(Number);
      const [hFinExist, mFinExist] = c.heure_fin.split(':').map(Number);
      const minutesDebutExist = hDebutExist * 60 + mDebutExist;
      const minutesFinExist = hFinExist * 60 + mFinExist;

      return (
        (minutesDebut >= minutesDebutExist && minutesDebut < minutesFinExist) ||
        (minutesFin > minutesDebutExist && minutesFin <= minutesFinExist) ||
        (minutesDebut <= minutesDebutExist && minutesFin >= minutesFinExist)
      );
    });

    if (coursConflituels.length > 0) {
      const conflits = coursConflituels
        .map((c: any) => `${c.type_cours} ${c.heure_debut}-${c.heure_fin}`)
        .join(", ");
      throw new ConflictError(
        `Conflit d'horaire détecté avec: ${conflits}. Impossible d'ajouter le cours`
      );
    }
  } catch (error) {
    if (error instanceof ConflictError) throw error;
    console.log("⚠️ [AjouterCours] Erreur vérification conflits:", error);
  }

  // Préparation des données pour ajout
  const ajoutCours = {
    nom: validatedInput.nom,
    type_cours: validatedInput.type_cours,
    jour_semaine: validatedInput.jour_semaine,
    heure_debut: validatedInput.heure_debut,
    heure_fin: validatedInput.heure_fin,
    professeurs: validatedInput.professeurs || [],
  };

  try {
    const result = await coursClient.ajouterCoursRecurrentAvecProfesseurs(ajoutCours);

    console.log("✅ [AjouterCours] Cours ajouté:", result);

    return {
      success: true,
      message: result.message || "Cours récurrent ajouté avec succès",
      cours_recurrent_id: result.cours_recurrent_id || result.id,
    };
  } catch (error: any) {
    console.error("❌ [AjouterCours] Erreur:", error);

    if (error.message?.includes("ER_NO_REFERENCED_ROW_2")) {
      throw new ValidationError(
        "Un ou plusieurs professeurs spécifiés n'existent pas",
        [{ field: "professeurs", message: "Professeurs introuvables" }]
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'ajout du cours récurrent",
      error
    );
  }
};

/**
 * Modifier un cours récurrent
 */
const modifierCoursResolver = async (
  _parent: unknown,
  args: { coursId: number; input: ModifierCoursInput },
  _context: GraphQLContext,
) => {
  const { coursId, input } = args;

  // Validation Zod
  const validatedInput = validateInput(modifierCoursInputSchema, input);

  console.log("✏️ [ModifierCours] Modification cours:", coursId, validatedInput);

  const coursClient = new Cours();

  try {
    const result = await coursClient.modifierCoursRecurrent(coursId, validatedInput);

    console.log("✅ [ModifierCours] Cours modifié:", result);

    return {
      success: true,
      message: "Cours modifié avec succès",
      cours_recurrent_id: coursId,
    };
  } catch (error: any) {
    console.error("❌ [ModifierCours] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la modification du cours",
      error
    );
  }
};

/**
 * Supprimer un jour de cours
 */
const supprimerJourCoursResolver = async (
  _parent: unknown,
  args: { coursId: number },
  _context: GraphQLContext,
) => {
  const { coursId } = args;

  console.log("🗑️ [SupprimerJourCours] Suppression cours:", coursId);

  const coursClient = new Cours();

  try {
    await coursClient.supprimerJourCours(coursId);

    console.log("✅ [SupprimerJourCours] Cours supprimé:", coursId);

    return {
      success: true,
      message: "Jour de cours supprimé avec succès",
      cours_id: coursId,
    };
  } catch (error: any) {
    console.error("❌ [SupprimerJourCours] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la suppression du cours",
      error
    );
  }
};

/**
 * Inscrire un utilisateur à un cours
 */
const inscrireUtilisateurResolver = async (
  _parent: unknown,
  args: { input: InscrireUtilisateurInput },
  context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(inscrireUtilisateurInputSchema, input);

  console.log("📝 [InscrireUtilisateur] Inscription:", validatedInput);

  const coursClient = new Cours();

  try {
    // Vérifier si l'utilisateur est déjà inscrit
    const verifInscription = await coursClient.verifierInscriptionUtilisateur({
      utilisateur_nom: validatedInput.utilisateur_nom,
      utilisateur_prenom: validatedInput.utilisateur_prenom,
      cours_id: validatedInput.cours_id,
    });

    if (verifInscription.isBooked) {
      throw new ConflictError("Utilisateur déjà inscrit à ce cours");
    }

    // Vérifier si l'utilisateur existe
    if (!verifInscription.userExists) {
      throw new NotFoundError("Utilisateur non trouvé");
    }

    // Inscrire l'utilisateur
    const result = await coursClient.inscrireUtilisateur({
      utilisateur_nom: validatedInput.utilisateur_nom,
      utilisateur_prenom: validatedInput.utilisateur_prenom,
      cours_id: validatedInput.cours_id,
    });

    console.log("✅ [InscrireUtilisateur] Inscription réussie:", result);

    return {
      success: true,
      message: "Inscription réussie",
      inscription_id: result.inscription_id,
      utilisateur_id: verifInscription.userId,
      cours_id: validatedInput.cours_id,
    };
  } catch (error: any) {
    console.error("❌ [InscrireUtilisateur] Erreur:", error);

    if (error instanceof ConflictError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur lors de l'inscription",
      error
    );
  }
};

/**
 * Désinscrire un utilisateur d'un cours
 */
const desinscrireUtilisateurResolver = async (
  _parent: unknown,
  args: { input: DesinscrireUtilisateurInput },
  context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(desinscrireUtilisateurInputSchema, input);

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (context.user?.id !== validatedInput.utilisateur_id && context.user?.role !== 'admin') {
    throw new ValidationError(
      "Non autorisé à désinscrire cet utilisateur",
      [{ field: "utilisateur_id", message: "Accès refusé" }]
    );
  }

  console.log("❌ [DesinscrireUtilisateur] Désinscription:", validatedInput);

  const coursClient = new Cours();

  try {
    const result = await coursClient.desinscrireUtilisateur(
      validatedInput.utilisateur_id,
      validatedInput.cours_id
    );

    console.log("✅ [DesinscrireUtilisateur] Désinscription réussie:", result);

    return {
      success: true,
      message: "Désinscription réussie",
      inscription_id: result.inscription_id,
    };
  } catch (error: any) {
    console.error("❌ [DesinscrireUtilisateur] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la désinscription",
      error
    );
  }
};

/**
 * Valider la présence d'un utilisateur
 */
const validerPresenceResolver = async (
  _parent: unknown,
  args: { input: PresenceInput },
  _context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(presenceInputSchema, input);

  console.log("✅ [ValiderPresence] Validation présence:", validatedInput);

  const coursClient = new Cours();

  try {
    const result = await coursClient.validerPresence(
      validatedInput.utilisateur_id,
      validatedInput.cours_id
    );

    console.log("✅ [ValiderPresence] Présence validée:", result);

    return {
      success: true,
      message: "Présence validée avec succès",
      inscription_id: result.inscription_id,
      presence_validee: true,
    };
  } catch (error: any) {
    console.error("❌ [ValiderPresence] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la validation de présence",
      error
    );
  }
};

/**
 * Annuler la présence d'un utilisateur
 */
const annulerPresenceResolver = async (
  _parent: unknown,
  args: { input: PresenceInput },
  _context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(presenceInputSchema, input);

  console.log("❌ [AnnulerPresence] Annulation présence:", validatedInput);

  const coursClient = new Cours();

  try {
    const result = await coursClient.annulerPresence(
      validatedInput.utilisateur_id,
      validatedInput.cours_id
    );

    console.log("✅ [AnnulerPresence] Présence annulée:", result);

    return {
      success: true,
      message: "Présence annulée avec succès",
      inscription_id: result.inscription_id,
      presence_validee: false,
    };
  } catch (error: any) {
    console.error("❌ [AnnulerPresence] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de l'annulation de présence",
      error
    );
  }
};

/**
 * Retirer un professeur d'un cours
 */
const retirerProfesseurResolver = async (
  _parent: unknown,
  args: { input: RetirerProfesseurInput },
  _context: GraphQLContext,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(retirerProfesseurInputSchema, input);

  console.log("👨‍🏫 [RetirerProfesseur] Retrait professeur:", validatedInput);

  const coursClient = new Cours();

  try {
    const result = await coursClient.retirerProfesseur(
      validatedInput.cours_recurrent_id,
      validatedInput.professeur_id
    );

    console.log("✅ [RetirerProfesseur] Professeur retiré:", result);

    return {
      success: true,
      message: "Professeur retiré avec succès",
      cours_recurrent_id: validatedInput.cours_recurrent_id,
    };
  } catch (error: any) {
    console.error("❌ [RetirerProfesseur] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors du retrait du professeur",
      error
    );
  }
};

// ============================================
// EXPORTS AVEC MIDDLEWARES
// ============================================

export const coursResolvers = {
  Query: {
    tousLesCours: combineMiddlewares(
      requireAuth,
      withSentry
    )(tousLesCoursResolver),

    planningCours: combineMiddlewares(
      requireAuth,
      withSentry
    )(planningCoursResolver),

    coursUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry
    )(coursUtilisateurResolver),

    participantsCours: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry
    )(participantsCoursResolver),

    inscriptionsUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry
    )(inscriptionsUtilisateurResolver),

    statistiquesCours: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry
    )(statistiquesCoursResolver),
  },

  Mutation: {
    ajouterCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry
    )(ajouterCoursResolver),

    modifierCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry
    )(modifierCoursResolver),

    supprimerJourCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry
    )(supprimerJourCoursResolver),

    inscrireUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry
    )(inscrireUtilisateurResolver),

    desinscrireUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry
    )(desinscrireUtilisateurResolver),

    validerPresence: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry
    )(validerPresenceResolver),

    annulerPresence: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry
    )(annulerPresenceResolver),

    retirerProfesseur: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry
    )(retirerProfesseurResolver),
  },
};
