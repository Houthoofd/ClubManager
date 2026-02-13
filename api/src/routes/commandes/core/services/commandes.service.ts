/**
 * Service Commandes - Logique métier
 * Gère les opérations sur les commandes
 *
 * @module commandes.service
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "@/shared/config/sentry.config.js";
import { commandes_statut } from "@prisma/client";

/**
 * Interface pour les données de commande
 */
export interface CommandeData {
  id: number;
  unique_id?: string | null;
  numero_commande?: string | null;
  utilisateur_id: number;
  total: number;
  date_commande: Date;
  statut?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  commande_articles?: any[];
}

/**
 * Interface pour les statistiques
 */
export interface StatistiquesCommandes {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_validees: number;
  commandes_annulees: number;
  montant_total: number;
  montant_moyen: number;
}

/**
 * Récupère toutes les commandes
 */
export async function obtenirToutesCommandes(): Promise<CommandeData[]> {
  try {
    addSentryBreadcrumb(
      "Récupération toutes les commandes",
      "service.commandes",
      "info",
    );

    console.log("📦 [CommandesService] Récupération toutes les commandes");

    const commandes = await prisma.commandes.findMany({
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: true,
          },
        },
      },
      orderBy: {
        date_commande: "desc",
      },
    });

    console.log(
      `✅ [CommandesService] ${commandes.length} commandes récupérées`,
    );

    return commandes.map((commande) => ({
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
      commande_articles: commande.commande_articles,
    }));
  } catch (error: any) {
    console.error(
      "❌ [CommandesService] Erreur récupération commandes:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "obtenirToutesCommandes",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des commandes: ${error.message}`,
    );
  }
}

/**
 * Récupère une commande par son ID
 */
export async function obtenirCommandeParId(
  commandeId: number,
): Promise<CommandeData | null> {
  try {
    if (!commandeId || isNaN(commandeId) || commandeId <= 0) {
      throw new Error("ID commande invalide");
    }

    addSentryBreadcrumb(
      `Récupération commande ${commandeId}`,
      "service.commandes",
      "info",
      { commandeId },
    );

    console.log(`📦 [CommandesService] Récupération commande ${commandeId}`);

    const commande = await prisma.commandes.findUnique({
      where: { id: commandeId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: true,
          },
        },
      },
    });

    if (!commande) {
      console.log(`❌ [CommandesService] Commande ${commandeId} non trouvée`);
      return null;
    }

    console.log(`✅ [CommandesService] Commande ${commandeId} trouvée`);

    return {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
      commande_articles: commande.commande_articles,
    };
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur récupération commande ${commandeId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "obtenirCommandeParId",
      },
      extra: { commandeId },
    });

    throw new Error(
      `Erreur lors de la récupération de la commande: ${error.message}`,
    );
  }
}

/**
 * Récupère les commandes d'un utilisateur
 */
export async function obtenirCommandesUtilisateur(
  utilisateurId: number,
): Promise<CommandeData[]> {
  try {
    if (!utilisateurId || isNaN(utilisateurId) || utilisateurId <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    addSentryBreadcrumb(
      `Récupération commandes utilisateur ${utilisateurId}`,
      "service.commandes",
      "info",
      { utilisateurId },
    );

    console.log(
      `📦 [CommandesService] Récupération commandes utilisateur ${utilisateurId}`,
    );

    const commandes = await prisma.commandes.findMany({
      where: {
        utilisateur_id: utilisateurId,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: true,
          },
        },
      },
      orderBy: {
        date_commande: "desc",
      },
    });

    console.log(
      `✅ [CommandesService] ${commandes.length} commandes pour utilisateur ${utilisateurId}`,
    );

    return commandes.map((commande) => ({
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
      commande_articles: commande.commande_articles,
    }));
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur récupération commandes utilisateur ${utilisateurId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "obtenirCommandesUtilisateur",
      },
      extra: { utilisateurId },
    });

    throw new Error(
      `Erreur lors de la récupération des commandes de l'utilisateur: ${error.message}`,
    );
  }
}

/**
 * Récupère les commandes par statut
 */
export async function obtenirCommandesParStatut(
  statut: string,
): Promise<CommandeData[]> {
  try {
    if (!statut) {
      throw new Error("Statut invalide");
    }

    addSentryBreadcrumb(
      `Récupération commandes par statut ${statut}`,
      "service.commandes",
      "info",
      { statut },
    );

    console.log(
      `📦 [CommandesService] Récupération commandes par statut ${statut}`,
    );

    const commandes = await prisma.commandes.findMany({
      where: {
        statut: statut as commandes_statut,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: true,
          },
        },
      },
      orderBy: {
        date_commande: "desc",
      },
    });

    console.log(
      `✅ [CommandesService] ${commandes.length} commandes avec statut ${statut}`,
    );

    return commandes.map((commande) => ({
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
      commande_articles: commande.commande_articles,
    }));
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur récupération commandes par statut:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "obtenirCommandesParStatut",
      },
      extra: { statut },
    });

    throw new Error(
      `Erreur lors de la récupération des commandes par statut: ${error.message}`,
    );
  }
}

/**
 * Recherche des commandes selon des critères
 */
export async function rechercherCommandes(args: any): Promise<CommandeData[]> {
  try {
    addSentryBreadcrumb("Recherche de commandes", "service.commandes", "info", {
      args,
    });

    console.log("🔍 [CommandesService] Recherche de commandes", args);

    const where: any = {};

    if (args.utilisateurId) {
      where.utilisateur_id = args.utilisateurId;
    }

    if (args.statut) {
      where.statut = args.statut;
    }

    if (args.dateDebut || args.dateFin) {
      where.date_commande = {};
      if (args.dateDebut) {
        where.date_commande.gte = new Date(args.dateDebut);
      }
      if (args.dateFin) {
        where.date_commande.lte = new Date(args.dateFin);
      }
    }

    if (args.numeroCommande) {
      where.numero_commande = {
        contains: args.numeroCommande,
      };
    }

    const commandes = await prisma.commandes.findMany({
      where,
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: true,
          },
        },
      },
      orderBy: {
        date_commande: "desc",
      },
      take: args.limit || 100,
      skip: args.offset || 0,
    });

    console.log(`✅ [CommandesService] ${commandes.length} commandes trouvées`);

    return commandes.map((commande) => ({
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
      commande_articles: commande.commande_articles,
    }));
  } catch (error: any) {
    console.error("❌ [CommandesService] Erreur recherche commandes:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "rechercherCommandes",
      },
      extra: { args },
    });

    throw new Error(
      `Erreur lors de la recherche de commandes: ${error.message}`,
    );
  }
}

/**
 * Obtenir les statistiques des commandes
 */
export async function obtenirStatistiques(): Promise<StatistiquesCommandes> {
  try {
    addSentryBreadcrumb(
      "Récupération statistiques commandes",
      "service.commandes",
      "info",
    );

    console.log("📊 [CommandesService] Récupération statistiques");

    const [
      totalCommandes,
      commandesEnAttente,
      commandesValidees,
      commandesAnnulees,
      aggregation,
    ] = await Promise.all([
      prisma.commandes.count(),
      prisma.commandes.count({ where: { statut: "en_attente" } }),
      prisma.commandes.count({ where: { statut: "validee" } }),
      prisma.commandes.count({ where: { statut: "annulee" } }),
      prisma.commandes.aggregate({
        _sum: {
          total: true,
        },
        _avg: {
          total: true,
        },
      }),
    ]);

    const montantTotal = Number(aggregation._sum.total || 0);
    const montantMoyen = Number(aggregation._avg.total || 0);

    console.log("✅ [CommandesService] Statistiques calculées");

    return {
      total_commandes: totalCommandes,
      commandes_en_attente: commandesEnAttente,
      commandes_validees: commandesValidees,
      commandes_annulees: commandesAnnulees,
      montant_total: montantTotal,
      montant_moyen: montantMoyen,
    };
  } catch (error: any) {
    console.error(
      "❌ [CommandesService] Erreur récupération statistiques:",
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "obtenirStatistiques",
      },
    });

    throw new Error(
      `Erreur lors de la récupération des statistiques: ${error.message}`,
    );
  }
}

/**
 * Compter les commandes par statut
 */
export async function compterParStatut(): Promise<Record<string, number>> {
  try {
    addSentryBreadcrumb(
      "Comptage commandes par statut",
      "service.commandes",
      "info",
    );

    console.log("🔢 [CommandesService] Comptage par statut");

    const statuts = ["en_attente", "validee", "annulee", "en_cours", "livree"];
    const counts: Record<string, number> = {};

    await Promise.all(
      statuts.map(async (statut) => {
        const count = await prisma.commandes.count({
          where: { statut: statut as commandes_statut },
        });
        counts[statut] = count;
      }),
    );

    console.log("✅ [CommandesService] Comptage terminé");

    return counts;
  } catch (error: any) {
    console.error("❌ [CommandesService] Erreur comptage par statut:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "compterParStatut",
      },
    });

    throw new Error(
      `Erreur lors du comptage des commandes par statut: ${error.message}`,
    );
  }
}

/**
 * Créer une nouvelle commande
 */
export async function creerCommande(data: any): Promise<CommandeData> {
  try {
    addSentryBreadcrumb(
      "Création nouvelle commande",
      "service.commandes",
      "info",
      { data },
    );

    console.log("➕ [CommandesService] Création commande", data);

    // Générer un numéro de commande unique
    const numeroCommande = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const commande = await prisma.commandes.create({
      data: {
        numero_commande: numeroCommande,
        utilisateur_id: data.utilisateur_id,
        total: data.total || 0,
        statut: data.statut || "en_attente",
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ [CommandesService] Commande créée: ${commande.id}`);

    return {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
    };
  } catch (error: any) {
    console.error("❌ [CommandesService] Erreur création commande:", error);

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "creerCommande",
      },
      extra: { data },
    });

    throw new Error(
      `Erreur lors de la création de la commande: ${error.message}`,
    );
  }
}

/**
 * Modifier une commande
 */
export async function modifierCommande(
  commandeId: number,
  data: any,
): Promise<CommandeData | null> {
  try {
    if (!commandeId || isNaN(commandeId) || commandeId <= 0) {
      throw new Error("ID commande invalide");
    }

    addSentryBreadcrumb(
      `Modification commande ${commandeId}`,
      "service.commandes",
      "info",
      { commandeId, data },
    );

    console.log(`✏️ [CommandesService] Modification commande ${commandeId}`);

    const commande = await prisma.commandes.update({
      where: { id: commandeId },
      data: {
        total: data.total !== undefined ? data.total : undefined,
        statut: data.statut || undefined,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ [CommandesService] Commande ${commandeId} modifiée`);

    return {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
    };
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur modification commande ${commandeId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "modifierCommande",
      },
      extra: { commandeId, data },
    });

    if (error.code === "P2025") {
      return null;
    }

    throw new Error(
      `Erreur lors de la modification de la commande: ${error.message}`,
    );
  }
}

/**
 * Modifier le statut d'une commande
 */
export async function modifierStatutCommande(
  commandeId: number,
  statut: string,
): Promise<CommandeData | null> {
  try {
    if (!commandeId || isNaN(commandeId) || commandeId <= 0) {
      throw new Error("ID commande invalide");
    }

    addSentryBreadcrumb(
      `Modification statut commande ${commandeId} vers ${statut}`,
      "service.commandes",
      "info",
      { commandeId, statut },
    );

    console.log(
      `🔄 [CommandesService] Modification statut commande ${commandeId} vers ${statut}`,
    );

    // Récupérer l'ancien statut
    const commandeActuelle = await prisma.commandes.findUnique({
      where: { id: commandeId },
      select: { statut: true },
    });

    if (!commandeActuelle) {
      return null;
    }

    // Mettre à jour le statut
    const commande = await prisma.commandes.update({
      where: { id: commandeId },
      data: {
        statut: statut as commandes_statut,
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Créer une entrée dans l'historique
    if (commandeActuelle.statut && commandeActuelle.statut !== statut) {
      await prisma.historique_statuts_commande.create({
        data: {
          commande_id: commandeId,
          ancien_statut: commandeActuelle.statut,
          nouveau_statut: statut as commandes_statut,
        },
      });
    }

    console.log(
      `✅ [CommandesService] Statut commande ${commandeId} modifié vers ${statut}`,
    );

    return {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      utilisateur_id: commande.utilisateur_id,
      total: Number(commande.total),
      date_commande: commande.date_commande,
      statut: commande.statut,
      ip_address: commande.ip_address,
      user_agent: commande.user_agent,
      created_at: commande.created_at,
      users: commande.users,
    };
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur modification statut commande ${commandeId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "modifierStatutCommande",
      },
      extra: { commandeId, statut },
    });

    if (error.code === "P2025") {
      return null;
    }

    throw new Error(
      `Erreur lors de la modification du statut de la commande: ${error.message}`,
    );
  }
}

/**
 * Supprimer une commande
 */
export async function supprimerCommande(commandeId: number): Promise<boolean> {
  try {
    if (!commandeId || isNaN(commandeId) || commandeId <= 0) {
      throw new Error("ID commande invalide");
    }

    addSentryBreadcrumb(
      `Suppression commande ${commandeId}`,
      "service.commandes",
      "warning",
      { commandeId },
    );

    console.log(`🗑️ [CommandesService] Suppression commande ${commandeId}`);

    await prisma.commandes.delete({
      where: { id: commandeId },
    });

    console.log(`✅ [CommandesService] Commande ${commandeId} supprimée`);

    return true;
  } catch (error: any) {
    console.error(
      `❌ [CommandesService] Erreur suppression commande ${commandeId}:`,
      error,
    );

    captureException(error, {
      level: "error",
      tags: {
        service: "commandes",
        operation: "supprimerCommande",
      },
      extra: { commandeId },
    });

    if (error.code === "P2025") {
      return false;
    }

    throw new Error(
      `Erreur lors de la suppression de la commande: ${error.message}`,
    );
  }
}

/**
 * Classe CommandesService
 */
export class CommandesService {
  async obtenirToutesCommandes() {
    return obtenirToutesCommandes();
  }

  async obtenirCommandeParId(commandeId: number) {
    return obtenirCommandeParId(commandeId);
  }

  async obtenirCommandesUtilisateur(utilisateurId: number) {
    return obtenirCommandesUtilisateur(utilisateurId);
  }

  async obtenirCommandesParStatut(statut: string) {
    return obtenirCommandesParStatut(statut);
  }

  async rechercherCommandes(args: any) {
    return rechercherCommandes(args);
  }

  async obtenirStatistiques() {
    return obtenirStatistiques();
  }

  async compterParStatut() {
    return compterParStatut();
  }

  async creerCommande(data: any) {
    return creerCommande(data);
  }

  async modifierCommande(commandeId: number, data: any) {
    return modifierCommande(commandeId, data);
  }

  async modifierStatutCommande(commandeId: number, statut: string) {
    return modifierStatutCommande(commandeId, statut);
  }

  async supprimerCommande(commandeId: number) {
    return supprimerCommande(commandeId);
  }
}

// Instance singleton
export const commandesService = new CommandesService();
