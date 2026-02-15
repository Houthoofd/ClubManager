/**
 * Resolvers GraphQL pour le module Cours
 * ✅ Pattern standardisé avec middlewares partagés
 *
 * @module cours.resolvers
 */

import type { GraphQLContext } from "@/shared/types/context.types.js";
import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "@/shared/errors/GraphQLErrors.js";
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
} from "@clubmanager/types/domains/cours/validators";
import { validateInput } from "@/shared/middleware/validation.middleware.js";
import { combineMiddlewares } from "@/shared/middleware/auth.middleware.js";
import {
  requireAuth,
  requireAdmin,
  requireStaff,
} from "@/shared/middleware/auth.middleware.js";
import { withSentry } from "@/shared/middleware/sentry.middleware.js";

// Helper: Convertir jour_semaine (1-7) en nom de jour
const joursMap = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];
const getJourNom = (jourNum: number): string =>
  joursMap[jourNum - 1] || "inconnu";

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
  const cours = await prisma.cours_recurrent.findMany({
    where: { active: true },
    include: {
      cours_recurrent_professeur: {
        include: {
          professeurs: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
    orderBy: [{ jour_semaine: "asc" }, { heure_debut: "asc" }],
  });

  // Mapper les données pour correspondre au schéma GraphQL
  return cours.map((c) => ({
    id: c.id,
    nom: c.type_cours,
    type_cours: c.type_cours,
    jour_semaine: getJourNom(c.jour_semaine),
    heure_debut: c.heure_debut,
    heure_fin: c.heure_fin,
    professeurs: c.cours_recurrent_professeur.map((cp) => ({
      id: cp.professeurs.id,
      nom: cp.professeurs.nom,
      prenom: cp.professeurs.prenom,
    })),
    places_max: c.places_max,
    created_at: null,
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
  const cours = await prisma.cours_recurrent.findMany({
    where: { active: true },
    include: {
      cours_recurrent_professeur: {
        include: {
          professeurs: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
    orderBy: [{ jour_semaine: "asc" }, { heure_debut: "asc" }],
  });

  // Grouper les cours par jour
  const jours = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];

  const planning = jours.map((jour, index) => {
    const jourNum = index + 1;
    const coursJour = cours
      .filter((c) => c.jour_semaine === jourNum)
      .map((c) => ({
        id: c.id,
        nom: c.type_cours,
        type_cours: c.type_cours,
        jour_semaine: jour,
        heure_debut: c.heure_debut,
        heure_fin: c.heure_fin,
        professeurs: c.cours_recurrent_professeur.map((cp) => ({
          id: cp.professeurs.id,
          nom: cp.professeurs.nom,
          prenom: cp.professeurs.prenom,
        })),
        places_max: c.places_max,
        created_at: null,
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
  _context: GraphQLContext,
) => {
  const { utilisateurId } = args;

  if (!utilisateurId || utilisateurId <= 0) {
    throw new ValidationError("ID utilisateur invalide", [
      { field: "utilisateurId", message: "L'ID utilisateur doit être positif" },
    ]);
  }

  const inscriptions = await prisma.inscriptions.findMany({
    where: { utilisateur_id: utilisateurId },
    include: {
      users: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
        },
      },
    },
    orderBy: { date_inscription: "desc" },
  });

  return inscriptions.map((i) => ({
    id: i.id,
    utilisateur_id: i.utilisateur_id,
    cours_id: i.cours_id,
    date_inscription: i.date_inscription,
    presence_validee: i.status_id || false,
    utilisateur_nom: i.users.last_name,
    utilisateur_prenom: i.users.first_name,
    cours_date: i.cours.date_cours,
    cours_type: i.cours.type_cours,
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

  const participants = await prisma.inscriptions.findMany({
    where: { cours_id: coursId },
    include: {
      users: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
        },
      },
    },
    orderBy: { date_inscription: "asc" },
  });

  return {
    cours_id: coursId,
    cours_date: participants[0]?.cours.date_cours || null,
    cours_type: participants[0]?.cours.type_cours || null,
    total_participants: participants.length,
    participants: participants.map((p) => ({
      id: p.id,
      utilisateur_id: p.utilisateur_id,
      cours_id: p.cours_id,
      date_inscription: p.date_inscription,
      presence_validee: p.status_id || false,
      utilisateur_nom: p.users.last_name,
      utilisateur_prenom: p.users.first_name,
      cours_date: p.cours.date_cours,
      cours_type: p.cours.type_cours,
    })),
  };
};

/**
 * Obtenir les inscriptions d'un utilisateur
 */
const inscriptionsUtilisateurResolver = async (
  _parent: unknown,
  args: { utilisateurId: number },
  _context: GraphQLContext,
) => {
  const { utilisateurId } = args;

  if (!utilisateurId || utilisateurId <= 0) {
    throw new ValidationError("ID utilisateur invalide", [
      { field: "utilisateurId", message: "L'ID utilisateur doit être positif" },
    ]);
  }

  const inscriptions = await prisma.inscriptions.findMany({
    where: { utilisateur_id: utilisateurId },
    include: {
      users: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      cours: {
        select: {
          id: true,
          date_cours: true,
          type_cours: true,
        },
      },
    },
    orderBy: { date_inscription: "desc" },
  });

  return inscriptions.map((i) => ({
    id: i.id,
    utilisateur_id: i.utilisateur_id,
    cours_id: i.cours_id,
    date_inscription: i.date_inscription,
    presence_validee: i.status_id || false,
    utilisateur_nom: i.users.last_name,
    utilisateur_prenom: i.users.first_name,
    cours_date: i.cours.date_cours,
    cours_type: i.cours.type_cours,
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

  // Récupérer les informations du cours récurrent
  const coursInfo = await prisma.cours_recurrent.findUnique({
    where: { id: coursId },
  });

  if (!coursInfo) {
    throw new NotFoundError(`Cours non trouvé: ${coursId}`);
  }

  // Récupérer tous les cours (instances) de ce cours récurrent
  const coursInstances = await prisma.cours.findMany({
    where: { cours_recurrent_id: coursId },
    select: { id: true },
  });

  const coursInstanceIds = coursInstances.map((c) => c.id);

  // Récupérer les inscriptions pour toutes les instances
  const inscriptions = await prisma.inscriptions.findMany({
    where: {
      cours_id: { in: coursInstanceIds },
    },
    select: {
      status_id: true,
    },
  });

  // Calculer les statistiques
  const totalInscriptions = inscriptions.length;
  const presencesValidees = inscriptions.filter(
    (i) => i.status_id === true,
  ).length;
  const tauxPresence =
    totalInscriptions > 0 ? (presencesValidees / totalInscriptions) * 100 : 0;

  return {
    cours_id: coursId,
    nom: coursInfo.type_cours,
    type_cours: coursInfo.type_cours,
    total_inscriptions: totalInscriptions,
    taux_presence: tauxPresence,
    places_max: coursInfo.places_max,
    moyenne_participants:
      coursInstances.length > 0 ? totalInscriptions / coursInstances.length : 0,
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
  const validatedInput = validateInput(ajouterCoursInputSchema, input as any);

  console.log("🎓 [AjouterCours] Ajout cours:", validatedInput);

  // Convertir jour_semaine en numéro
  const jourNums: Record<string, number> = {
    lundi: 1,
    mardi: 2,
    mercredi: 3,
    jeudi: 4,
    vendredi: 5,
    samedi: 6,
    dimanche: 7,
  };
  const jourNum = jourNums[validatedInput.jour_semaine.toLowerCase()];

  if (!jourNum) {
    throw new ValidationError("Jour de semaine invalide", [
      { field: "jour_semaine", message: "Jour non reconnu" },
    ]);
  }

  // Vérification des conflits d'horaires
  try {
    const coursExistants = await prisma.cours_recurrent.findMany({
      where: {
        active: true,
        jour_semaine: jourNum,
      },
    });

    const heureDebut = validatedInput.heure_debut;
    const heureFin = validatedInput.heure_fin;

    const coursConflituels = coursExistants.filter((c) => {
      if (!c.heure_debut || !c.heure_fin) return false;

      // Convertir les heures en minutes pour faciliter la comparaison
      const parseTime = (time: any): number => {
        const timeStr = typeof time === "string" ? time : time.toString();
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
      };

      const minutesDebut = parseTime(heureDebut);
      const minutesFin = parseTime(heureFin);
      const minutesDebutExist = parseTime(c.heure_debut);
      const minutesFinExist = parseTime(c.heure_fin);

      return (
        (minutesDebut >= minutesDebutExist && minutesDebut < minutesFinExist) ||
        (minutesFin > minutesDebutExist && minutesFin <= minutesFinExist) ||
        (minutesDebut <= minutesDebutExist && minutesFin >= minutesFinExist)
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
  } catch (error: any) {
    if (error instanceof ConflictError) throw error;
    console.log("⚠️ [AjouterCours] Erreur vérification conflits:", error);
  }

  try {
    // Créer le cours récurrent avec ses professeurs
    const result = await prisma.cours_recurrent.create({
      data: {
        type_cours: validatedInput.type_cours,
        jour_semaine: jourNum,
        heure_debut: validatedInput.heure_debut,
        heure_fin: validatedInput.heure_fin,
        active: true,
        cours_recurrent_professeur: {
          create: (validatedInput.professeurs || []).map((profId) => ({
            professeur_id: Number(profId),
          })),
        },
      },
      include: {
        cours_recurrent_professeur: {
          include: {
            professeurs: true,
          },
        },
      },
    });

    console.log("✅ [AjouterCours] Cours ajouté:", result.id);

    return {
      success: true,
      message: "Cours récurrent ajouté avec succès",
      cours_recurrent_id: result.id,
    };
  } catch (error: any) {
    console.error("❌ [AjouterCours] Erreur:", error);

    if (error.code === "P2003") {
      throw new ValidationError(
        "Un ou plusieurs professeurs spécifiés n'existent pas",
        [{ field: "professeurs", message: "Professeurs introuvables" }],
      );
    }

    throw new InternalServerError(
      "Erreur lors de l'ajout du cours récurrent",
      error,
    );
  }
};

/**
 * Modifier un cours récurrent
 */
const modifierCoursResolver = async (
  _parent: unknown,
  args: { coursId: number; input: ModifierCoursInput },
  _context: unknown,
) => {
  const { coursId, input } = args;

  // Validation Zod
  const validatedInput = validateInput(modifierCoursInputSchema, input);

  console.log(
    "✏️ [ModifierCours] Modification cours:",
    coursId,
    validatedInput,
  );

  // Convertir jour_semaine si fourni
  let jourNum: number | undefined;
  if (validatedInput.jour_semaine) {
    const jourNums: Record<string, number> = {
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
      dimanche: 7,
    };
    jourNum = jourNums[validatedInput.jour_semaine.toLowerCase()];
  }

  const result = await prisma.cours_recurrent.update({
    where: { id: coursId },
    data: {
      ...(validatedInput.type_cours && {
        type_cours: validatedInput.type_cours,
      }),
      ...(jourNum && { jour_semaine: jourNum }),
      ...(validatedInput.heure_debut && {
        heure_debut: validatedInput.heure_debut,
      }),
      ...(validatedInput.heure_fin && { heure_fin: validatedInput.heure_fin }),
    },
  });

  console.log("✅ [ModifierCours] Cours modifié avec succès:", coursId);

  return {
    success: true,
    message: "Cours modifié avec succès",
    cours_recurrent_id: coursId,
  };
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

  try {
    // Soft delete - marquer comme inactif
    await prisma.cours_recurrent.update({
      where: { id: coursId },
      data: { active: false },
    });

    console.log("✅ [SupprimerJourCours] Cours supprimé:", coursId);

    return {
      success: true,
      message: "Cours supprimé avec succès",
      cours_id: coursId,
    };
  } catch (error: any) {
    console.error("❌ [SupprimerJourCours] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de la suppression du cours",
      error,
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
  const validatedInput = validateInput(
    inscrireUtilisateurInputSchema,
    input as any,
  );

  console.log("📝 [InscrireUtilisateur] Inscription:", validatedInput);

  try {
    // Trouver l'utilisateur par nom et prénom
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        first_name: validatedInput.utilisateur_prenom,
        last_name: validatedInput.utilisateur_nom,
      },
      select: { id: true },
    });

    if (!utilisateur) {
      throw new NotFoundError("Utilisateur non trouvé");
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const inscriptionExistante = await prisma.inscriptions.findFirst({
      where: {
        utilisateur_id: utilisateur.id,
        cours_id: validatedInput.cours_id,
      },
    });

    if (inscriptionExistante) {
      throw new ConflictError("Utilisateur déjà inscrit à ce cours");
    }

    // Créer l'inscription
    const result = await prisma.inscriptions.create({
      data: {
        utilisateur_id: utilisateur.id,
        cours_id: validatedInput.cours_id,
        date_inscription: new Date(),
        status_id: false,
      },
    });

    console.log("✅ [InscrireUtilisateur] Inscription réussie:", result.id);

    return {
      success: true,
      message: "Inscription réussie",
      inscription_id: result.id,
      utilisateur_id: utilisateur.id,
      cours_id: validatedInput.cours_id,
    };
  } catch (error: any) {
    console.error("❌ [InscrireUtilisateur] Erreur:", error);

    if (error instanceof ConflictError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError("Erreur lors de l'inscription", error);
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
  const validatedInput = validateInput(
    desinscrireUtilisateurInputSchema,
    input as any,
  );

  // Vérifier que l'utilisateur connecté est celui demandé ou admin
  if (
    context.user?.id !== validatedInput.utilisateur_id &&
    context.user?.status_id !== 1 // 1 = admin
  ) {
    throw new ValidationError("Non autorisé à désinscrire cet utilisateur", [
      { field: "utilisateur_id", message: "Accès refusé" },
    ]);
  }

  console.log("❌ [DesinscrireUtilisateur] Désinscription:", validatedInput);

  try {
    const result = await prisma.inscriptions.deleteMany({
      where: {
        utilisateur_id: validatedInput.utilisateur_id,
        cours_id: validatedInput.cours_id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Inscription non trouvée");
    }

    console.log("✅ [DesinscrireUtilisateur] Désinscription réussie");

    return {
      success: true,
      message: "Désinscription réussie",
      inscription_id: validatedInput.cours_id,
    };
  } catch (error: any) {
    console.error("❌ [DesinscrireUtilisateur] Erreur:", error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError("Erreur lors de la désinscription", error);
  }
};

/**
 * Valider la présence d'un utilisateur
 */
const validerPresenceResolver = async (
  _parent: unknown,
  args: { input: PresenceInput },
  _context: unknown,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(presenceInputSchema, input as any);

  console.log("✅ [ValiderPresence] Validation présence:", validatedInput);

  try {
    const result = await prisma.inscriptions.updateMany({
      where: {
        utilisateur_id: validatedInput.utilisateur_id,
        cours_id: validatedInput.cours_id,
      },
      data: {
        status_id: true,
      },
    });

    console.log("✅ [ValiderPresence] Présence validée:", validatedInput);

    return {
      success: true,
      message: "Présence validée avec succès",
      inscription_id: validatedInput.cours_id,
      presence_validee: true,
    };
  } catch (error: any) {
    console.error("❌ [MarquerPresence] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors du marquage de la présence",
      error,
    );
  }
};

/**
 * Annuler la présence d'un utilisateur
 */
const annulerPresenceResolver = async (
  _parent: unknown,
  args: { input: PresenceInput },
  _context: unknown,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(presenceInputSchema, input as any);

  console.log("❌ [AnnulerPresence] Annulation présence:", validatedInput);

  try {
    const result = await prisma.inscriptions.updateMany({
      where: {
        utilisateur_id: validatedInput.utilisateur_id,
        cours_id: validatedInput.cours_id,
      },
      data: {
        status_id: false,
      },
    });

    console.log("✅ [AnnulerPresence] Présence annulée:", validatedInput);

    return {
      success: true,
      message: "Présence annulée avec succès",
      inscription_id: validatedInput.cours_id,
      presence_validee: false,
    };
  } catch (error: any) {
    console.error("❌ [AnnulerReservation] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors de l'annulation de la réservation",
      error,
    );
  }
};

/**
 * Retirer un professeur d'un cours
 */
const retirerProfesseurResolver = async (
  _parent: unknown,
  args: { input: RetirerProfesseurInput },
  _context: unknown,
) => {
  const { input } = args;

  // Validation Zod
  const validatedInput = validateInput(
    retirerProfesseurInputSchema,
    input as any,
  );

  console.log("👨‍🏫 [RetirerProfesseur] Retrait professeur:", validatedInput);

  try {
    await prisma.cours_recurrent_professeur.deleteMany({
      where: {
        cours_recurrent_id: validatedInput.cours_recurrent_id,
        professeur_id: validatedInput.professeur_id,
      },
    });

    console.log("✅ [RetirerProfesseur] Professeur retiré:", validatedInput);

    return {
      success: true,
      message: "Professeur retiré avec succès",
      cours_recurrent_id: validatedInput.cours_recurrent_id,
    };
  } catch (error: any) {
    console.error("❌ [RetirerProfesseur] Erreur:", error);
    throw new InternalServerError(
      "Erreur lors du retrait du professeur",
      error,
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
      withSentry,
    )(tousLesCoursResolver),

    planningCours: combineMiddlewares(
      requireAuth,
      withSentry,
    )(planningCoursResolver),

    coursUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(coursUtilisateurResolver),

    participantsCours: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry,
    )(participantsCoursResolver),

    inscriptionsUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(inscriptionsUtilisateurResolver),

    statistiquesCours: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry,
    )(statistiquesCoursResolver),
  },

  Mutation: {
    ajouterCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(ajouterCoursResolver),

    modifierCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(modifierCoursResolver),

    supprimerJourCours: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(supprimerJourCoursResolver),

    inscrireUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(inscrireUtilisateurResolver),

    desinscrireUtilisateur: combineMiddlewares(
      requireAuth,
      withSentry,
    )(desinscrireUtilisateurResolver),

    validerPresence: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry,
    )(validerPresenceResolver),

    annulerPresence: combineMiddlewares(
      requireAuth,
      requireStaff,
      withSentry,
    )(annulerPresenceResolver),

    retirerProfesseur: combineMiddlewares(
      requireAuth,
      requireAdmin,
      withSentry,
    )(retirerProfesseurResolver),
  },
};
