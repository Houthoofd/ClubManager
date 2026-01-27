/**
 * Mutations des alertes (créer, résoudre, ignorer)
 */

import { prisma as defaultPrisma } from "../../../../infrastructure/database/prisma-client.js";
import type {
  AlerteUtilisateur,
  CreateAlerteInput,
  ResoudreAlerteInput,
  IgnorerAlerteInput,
  AlerteResult,
} from "@clubmanager/types";

/**
 * Résout une alerte
 */
export async function resoudreAlerte(
  input: ResoudreAlerteInput,
  prisma = defaultPrisma,
): Promise<AlerteResult> {
  console.log(`✅ [AlertesMutations] Résolution alerte ${input.alerteId}`);

  // Validations
  if (!input.alerteId || input.alerteId <= 0) {
    throw new Error("L'ID de l'alerte est requis et doit être positif");
  }

  if (!input.effectuePar || input.effectuePar <= 0) {
    throw new Error(
      "L'ID de l'utilisateur effectuant la résolution est requis",
    );
  }

  // Vérifier que l'alerte existe
  const alerteExiste = await prisma.alertes_utilisateurs.findFirst({
    where: { id: input.alerteId },
  });

  if (!alerteExiste) {
    throw new Error("Alerte inexistante");
  }

  // Vérifier que l'alerte n'est pas déjà résolue
  if (alerteExiste.statut !== "active") {
    throw new Error("Cette alerte n'est pas active");
  }

  await prisma.$transaction(async (tx: any) => {
    // Mettre à jour l'alerte
    await tx.alertes_utilisateurs.update({
      where: { id: input.alerteId },
      data: {
        statut: "resolue",
        notes: input.notes,
        date_resolution: new Date(),
        resolu_par: input.effectuePar,
      },
    });

    // Enregistrer l'action
    await tx.alertes_actions.create({
      data: {
        alerte_id: input.alerteId,
        action_type: "autre",
        description: `Alerte résolue: ${input.notes}`,
        effectue_par: input.effectuePar,
      },
    });
  });

  return {
    success: true,
    message: "Alerte résolue avec succès",
  };
}

/**
 * Ignore une alerte
 */
export async function ignorerAlerte(
  input: IgnorerAlerteInput,
  prisma = defaultPrisma,
): Promise<AlerteResult> {
  console.log(`🚫 [AlertesMutations] Ignore alerte ${input.alerteId}`);

  // Validations
  if (!input.alerteId || input.alerteId <= 0) {
    throw new Error("L'ID de l'alerte est requis et doit être positif");
  }

  // Vérifier que l'alerte existe
  const alerteExiste = await prisma.alertes_utilisateurs.findFirst({
    where: { id: input.alerteId },
  });

  if (!alerteExiste) {
    throw new Error("Alerte inexistante");
  }

  // Vérifier que l'alerte est active
  if (alerteExiste.statut !== "active") {
    throw new Error("Cette alerte n'est pas active");
  }

  await prisma.alertes_utilisateurs.update({
    where: { id: input.alerteId },
    data: {
      statut: "ignoree",
      notes: input.notes,
      date_resolution: new Date(),
      resolu_par: input.effectuePar,
    },
  });

  return {
    success: true,
    message: "Alerte ignorée avec succès",
  };
}

/**
 * Crée une nouvelle alerte manuellement
 */
export async function creerAlerte(
  input: CreateAlerteInput,
  prisma = defaultPrisma,
): Promise<AlerteUtilisateur> {
  console.log(
    `➕ [AlertesMutations] Création alerte utilisateur ${input.utilisateurId}`,
  );
  // Validations
  if (!input.utilisateurId || input.utilisateurId <= 0) {
    throw new Error("L'ID utilisateur est requis et doit être positif");
  }

  if (!input.typeAlerteId || input.typeAlerteId <= 0) {
    throw new Error("Le type d'alerte est requis");
  }

  const alerte = await prisma.alertes_utilisateurs.create({
    data: {
      utilisateur_id: input.utilisateurId,
      alerte_type_id: input.typeAlerteId,
      donnees_contexte: input.contexte || {},
      statut: "active",
    },
    include: {
      alertes_types: true,
      utilisateurs: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          status_id: true,
        },
      },
    },
  });

  return {
    id: alerte.id,
    utilisateurId: alerte.utilisateur_id,
    typeAlerte: alerte.alertes_types.nom,
    code: alerte.alertes_types.code,
    description: alerte.alertes_types.description || "",
    priorite: alerte.alertes_types.priorite as
      | "basse"
      | "normale"
      | "haute"
      | "critique",
    statut: alerte.statut as "active",
    donneesContexte: alerte.donnees_contexte,
    dateDetection: alerte.date_detection || new Date(),
    nomUtilisateur: `${alerte.utilisateurs.first_name} ${alerte.utilisateurs.last_name}`,
    email: alerte.utilisateurs.email,
    statusId: alerte.utilisateurs.status_id,
  };
}
