import { PrismaClient } from "@prisma/client";
import {
  captureException,
  addSentryBreadcrumb,
} from '@/shared/config/sentry.config.js';
import { EmailClient } from '@/infrastructure/external-services/emailClient.js';
import Stripe from "stripe";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Service de gestion du magasin (migré vers Prisma + Sentry)
 * Contient la logique métier pour les opérations sur les articles et commandes
 */

/**
 * Interface pour un article
 */
export interface Article {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  stock: number;
  categorie_id: number;
  image_url?: string;
  actif: boolean;
  tailles_disponibles?: string[];
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface pour une commande
 */
export interface Commande {
  id: number;
  utilisateur_id: number;
  unique_id: string;
  numero_commande: string;
  total: number;
  statut: "en attente" | "validé" | "préparé" | "livré" | "annulé";
  date: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface pour une commande avec détails
 */
export interface CommandeAvecDetails extends Commande {
  articles: ArticleCommande[];
  utilisateur?: {
    nom: string;
    prenom: string;
    email: string;
  };
}

/**
 * Interface pour un article dans une commande
 */
export interface ArticleCommande {
  article_id: number;
  nom?: string;
  quantite: number;
  taille: string;
  prix?: number;
}

/**
 * Interface pour les statistiques du magasin
 */
export interface StatistiquesMagasin {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_validees: number;
  commandes_livrees: number;
  commandes_annulees: number;
  chiffre_affaires_total: number;
  article_le_plus_vendu?: {
    id: number;
    nom: string;
    quantite_vendue: number;
  };
}

/**
 * Cache pour empêcher les doublons de commandes
 */
const commandesEnCours = new Map<
  string,
  { timestamp: number; promesse: Promise<any> }
>();

/**
 * Fonction pour nettoyer le cache des commandes anciennes
 */
export const nettoyerCacheCommandes = (): void => {
  const maintenant = Date.now();
  const EXPIRATION = 5 * 60 * 1000; // 5 minutes

  for (const [key, value] of commandesEnCours.entries()) {
    if (maintenant - value.timestamp > EXPIRATION) {
      commandesEnCours.delete(key);
    }
  }
};

// Nettoyer le cache toutes les minutes
setInterval(nettoyerCacheCommandes, 60 * 1000);

/**
 * Générer un ID unique de commande
 */
export function generateUniqueCommandeId(userId: number): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  const userPrefix = userId.toString().padStart(3, "0");

  // Format: CMD-{userId}-{timestamp}-{random}
  // Exemple: CMD-154-1704123456789-A1B2
  return `CMD-${userPrefix}-${timestamp}-${randomBytes}`;
}

/**
 * Générer un numéro de commande séquentiel
 */
export async function generateSequentialCommandeNumber(): Promise<string> {
  try {
    addSentryBreadcrumb(
      "Génération numéro de commande séquentiel",
      "magasin",
      "info",
    );

    // Récupérer la dernière commande avec un numéro de commande
    const lastCommande = await prisma.commandes.findFirst({
      where: {
        numero_commande: {
          startsWith: "CMD-",
        },
      },
      orderBy: {
        id: "desc",
      },
      select: {
        numero_commande: true,
      },
    });

    let nextNumber = 1;
    if (lastCommande?.numero_commande) {
      // Extraire le numéro séquentiel de la dernière commande
      const parts = lastCommande.numero_commande.split("-");
      if (parts.length >= 2) {
        const lastNumber = parseInt(parts[1]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    // Format: CMD-000001, CMD-000002, etc.
    const numeroCommande = `CMD-${nextNumber.toString().padStart(6, "0")}`;
    console.log(
      "✅ [Magasin Service] Numéro de commande généré:",
      numeroCommande,
    );

    return numeroCommande;
  } catch (error) {
    console.error(
      "❌ [Magasin Service] Erreur génération numéro commande:",
      error,
    );
    captureException(error as Error, {
      tags: { context: "generateSequentialCommandeNumber" },
    });
    // Fallback vers timestamp en cas d'erreur
    return `CMD-${Date.now()}`;
  }
}

/**
 * Récupérer tous les articles par catégories
 */
export async function obtenirArticlesParCategories(): Promise<any> {
  try {
    addSentryBreadcrumb(
      "Récupération des articles par catégories",
      "magasin",
      "info",
    );

    console.log(
      "🔍 [Magasin Service] Récupération des articles par catégories",
    );

    const categories = await prisma.categories.findMany({
      include: {
        articles: {
          include: {
            stocks: true,
          },
        },
      },
      orderBy: {
        nom: "asc",
      },
    });

    const articlesParCategories = categories.map((categorie) => ({
      id: categorie.id,
      nom: categorie.nom,
      description: categorie.description,
      articles: categorie.articles.map((article: any) => ({
        id: article.id,
        nom: article.nom,
        description: article.description,
        prix: Number(article.prix),
        stock: article.stocks.reduce(
          (total: number, stock: any) => total + stock.quantite,
          0,
        ),
        categorie_id: article.categorie_id,
        image_url: article.image_url,
        created_at: article.created_at,
      })),
    }));

    console.log(
      `✅ [Magasin Service] ${categories.length} catégories récupérées avec articles`,
    );

    return articlesParCategories;
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur récupération articles:", error);
    captureException(error as Error, {
      tags: { context: "obtenirArticlesParCategories" },
    });
    throw new Error("Impossible de récupérer les articles");
  }
}

/**
 * Récupérer toutes les catégories
 */
export async function obtenirLesCategories(): Promise<any> {
  try {
    addSentryBreadcrumb("Récupération des catégories", "magasin", "info");

    console.log("🔍 [Magasin Service] Récupération des catégories");

    const categories = await prisma.categories.findMany({
      orderBy: {
        nom: "asc",
      },
    });

    console.log(
      `✅ [Magasin Service] ${categories.length} catégories récupérées`,
    );

    return categories;
  } catch (error) {
    console.error(
      "❌ [Magasin Service] Erreur récupération catégories:",
      error,
    );
    captureException(error as Error, {
      tags: { context: "obtenirLesCategories" },
    });
    throw new Error("Impossible de récupérer les catégories");
  }
}

/**
 * Ajouter un nouvel article
 */
export async function ajouterArticle(articleData: any): Promise<any> {
  try {
    addSentryBreadcrumb(
      `Ajout d'un nouvel article: ${articleData.nom}`,
      "magasin",
      "info",
      { articleNom: articleData.nom },
    );

    console.log(
      "📝 [Magasin Service] Ajout d'un nouvel article:",
      articleData.nom,
    );

    const article = await prisma.articles.create({
      data: {
        nom: articleData.nom,
        description: articleData.description,
        prix: articleData.prix,
        categorie_id: articleData.categorie_id,
        image_url: articleData.image_url,
      },
    });

    // Si des stocks sont fournis, les créer
    if (articleData.stocks && Array.isArray(articleData.stocks)) {
      for (const stock of articleData.stocks) {
        await prisma.stocks.create({
          data: {
            article_id: article.id,
            taille_id: stock.taille_id,
            quantite: stock.quantite,
          },
        });
      }
    }

    console.log(
      "✅ [Magasin Service] Article ajouté avec succès, ID:",
      article.id,
    );

    return {
      isConfirm: true,
      message: "Article ajouté avec succès",
      data: article,
    };
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur ajout article:", error);
    captureException(error as Error, {
      tags: { context: "ajouterArticle" },
      extra: { articleData },
    });
    throw new Error("Erreur lors de l'ajout de l'article");
  }
}

/**
 * Modifier un article existant
 */
export async function modifierArticle(
  articleId: number,
  articleData: any,
): Promise<any> {
  try {
    addSentryBreadcrumb(
      `Modification de l'article ${articleId}`,
      "magasin",
      "info",
      { articleId },
    );

    console.log(`📝 [Magasin Service] Modification de l'article ${articleId}`);

    const article = await prisma.articles.update({
      where: { id: articleId },
      data: {
        nom: articleData.nom,
        description: articleData.description,
        prix: articleData.prix,
        categorie_id: articleData.categorie_id,
        image_url: articleData.image_url,
      },
    });

    console.log("✅ [Magasin Service] Article modifié avec succès");

    return {
      isConfirm: true,
      message: "Article modifié avec succès",
      data: article,
    };
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur modification article:", error);
    captureException(error as Error, {
      tags: { context: "modifierArticle" },
      extra: { articleId, articleData },
    });
    throw new Error("Erreur lors de la modification de l'article");
  }
}

/**
 * Supprimer un article
 */
export async function supprimerArticle(articleId: number): Promise<any> {
  try {
    addSentryBreadcrumb(
      `Suppression de l'article ${articleId}`,
      "magasin",
      "info",
      { articleId },
    );

    console.log(`🗑️ [Magasin Service] Suppression de l'article ${articleId}`);

    // Vérifier si l'article existe
    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error(`Article avec l'ID ${articleId} non trouvé`);
    }

    // Supprimer les stocks associés d'abord
    await prisma.stocks.deleteMany({
      where: { article_id: articleId },
    });

    // Supprimer l'article
    await prisma.articles.delete({
      where: { id: articleId },
    });

    console.log("✅ [Magasin Service] Article supprimé avec succès");

    return {
      isConfirm: true,
      message: "Article supprimé avec succès",
    };
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur suppression article:", error);
    captureException(error as Error, {
      tags: { context: "supprimerArticle" },
      extra: { articleId },
    });

    // Propager l'erreur originale si elle contient un message métier important
    if (error instanceof Error) {
      const messageStr = error.message.toLowerCase();
      if (
        messageStr.includes("non trouvé") ||
        messageStr.includes("non trouve") ||
        messageStr.includes("introuvable") ||
        messageStr.includes("not found")
      ) {
        throw error;
      }
    }

    throw new Error("Impossible de supprimer l'article");
  }
}

/**
 * Créer une nouvelle commande avec protection contre les doublons
 */
export async function creerCommande(commandeData: any): Promise<any> {
  const { utilisateur_id, articles, total } = commandeData;

  try {
    // Créer une clé de cache pour détecter les doublons
    const cacheKey = `${utilisateur_id}-${total}-${JSON.stringify(
      articles.map((a: any) => ({
        id: a.article_id,
        taille: a.taille,
        quantite: a.quantite,
      })),
    )}`;
    const maintenant = Date.now();

    addSentryBreadcrumb("Création d'une nouvelle commande", "magasin", "info", {
      utilisateur_id,
      total,
      nbArticles: articles.length,
    });

    console.log("🔍 [Magasin Service] Vérification doublon commande:", {
      utilisateur_id,
      total,
      nbArticles: articles.length,
    });

    // Vérifier si une commande identique est déjà en cours
    const commandeEnCours = commandesEnCours.get(cacheKey);
    if (commandeEnCours) {
      const delaiDepuisCommande = maintenant - commandeEnCours.timestamp;

      if (delaiDepuisCommande < 30000) {
        // 30 secondes
        console.log(
          "⚠️ [Magasin Service] Commande identique détectée, attente...",
          {
            delaiDepuisCommande: `${delaiDepuisCommande}ms`,
          },
        );

        try {
          // Attendre que la première commande se termine
          const resultatPremiere = await commandeEnCours.promesse;
          console.log(
            "✅ [Magasin Service] Première commande terminée, retour du même résultat",
          );

          return {
            ...resultatPremiere,
            isDuplicate: true,
          };
        } catch (error) {
          console.log(
            "❌ [Magasin Service] Première commande a échoué, on continue",
          );
          commandesEnCours.delete(cacheKey);
        }
      } else {
        // Commande trop ancienne, on la supprime du cache
        commandesEnCours.delete(cacheKey);
      }
    }

    // Générer les IDs de manière robuste
    const uniqueCommandeId = generateUniqueCommandeId(utilisateur_id);
    const numeroCommande = await generateSequentialCommandeNumber();

    console.log("🆔 [Magasin Service] IDs générés:", {
      uniqueCommandeId,
      numeroCommande,
      utilisateur_id,
    });

    // Créer une promesse pour cette commande et la stocker
    const promesseCommande = (async () => {
      try {
        // Créer la commande avec Prisma
        const commande = await prisma.commandes.create({
          data: {
            utilisateur_id,
            unique_id: uniqueCommandeId,
            numero_commande: numeroCommande,
            total: parseFloat(total),
            statut: commandeData.statut || "en_attente",
            date_commande: new Date(),
          },
        });

        // Créer les articles de la commande
        for (const article of articles) {
          await prisma.commande_articles.create({
            data: {
              commande_id: commande.id,
              article_id: article.article_id,
              quantite: article.quantite,
              taille_id: article.taille_id || null,
              prix: parseFloat(article.prix || 0),
            },
          });

          // Mettre à jour le stock si nécessaire
          if (article.taille_id) {
            const stock = await prisma.stocks.findFirst({
              where: {
                article_id: article.article_id,
                taille_id: article.taille_id,
              },
            });

            if (stock && stock.quantite >= article.quantite) {
              await prisma.stocks.update({
                where: { id: stock.id },
                data: {
                  quantite: stock.quantite - article.quantite,
                },
              });
            }
          }
        }

        // Envoyer l'email de confirmation après succès
        try {
          const utilisateur = await prisma.utilisateurs.findUnique({
            where: { id: utilisateur_id },
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          });

          if (utilisateur) {
            const commandeDataWithIds = {
              ...commandeData,
              unique_id: uniqueCommandeId,
              numero_commande: numeroCommande,
              created_at: commande.date_commande,
            };

            await envoyerEmailConfirmationCommande(
              commandeDataWithIds,
              utilisateur.email,
              `${utilisateur.first_name || ""} ${utilisateur.last_name || ""}`.trim() ||
                "Membre",
            );
          } else {
            console.warn(
              "⚠️ [Magasin Service] Impossible d'envoyer l'email - utilisateur non trouvé",
            );
          }
        } catch (emailError) {
          console.error("❌ [Magasin Service] Erreur envoi email:", emailError);
          captureException(emailError as Error, {
            tags: { context: "creerCommande.envoyerEmail" },
          });
        }

        console.log(
          "✅ [Magasin Service] Commande créée avec succès, ID:",
          commande.id,
        );

        return {
          isConfirm: true,
          message: "Commande créée avec succès",
          data: {
            id: commande.id,
            unique_id: commande.unique_id,
            numero_commande: commande.numero_commande,
            total: Number(commande.total),
            statut: commande.statut,
            date: commande.date_commande,
          },
        };
      } finally {
        // Nettoyer le cache après traitement
        setTimeout(() => {
          commandesEnCours.delete(cacheKey);
        }, 5000); // Garder 5 secondes pour les requêtes très rapprochées
      }
    })();

    // Stocker la promesse dans le cache
    commandesEnCours.set(cacheKey, {
      timestamp: maintenant,
      promesse: promesseCommande,
    });

    // Attendre le résultat
    const resultatCommande = await promesseCommande;

    console.log(
      "✅ [Magasin Service] Commande créée avec protection doublon:",
      {
        unique_id: uniqueCommandeId,
        numero_commande: numeroCommande,
      },
    );

    return {
      ...resultatCommande,
      isDuplicate: false,
    };
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur création commande:", error);
    captureException(error as Error, {
      tags: { context: "creerCommande" },
      extra: { utilisateur_id, total, nbArticles: articles?.length },
    });
    throw new Error("Erreur lors de la création de la commande");
  }
}

/**
 * Récupérer toutes les commandes
 */
export async function obtenirLesCommandes(): Promise<any[]> {
  try {
    addSentryBreadcrumb(
      "Récupération de toutes les commandes",
      "magasin",
      "info",
    );

    console.log("🔍 [Magasin Service] Récupération de toutes les commandes");

    const commandes = await prisma.commandes.findMany({
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        commande_articles: {
          include: {
            articles: {
              select: {
                id: true,
                nom: true,
                prix: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_commande: "desc",
      },
    });

    const commandesFormatted = commandes.map((commande: any) => ({
      id: commande.id,
      utilisateur_id: commande.utilisateur_id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
      total: Number(commande.total),
      statut: commande.statut,
      date: commande.date_commande,
      created_at: commande.created_at,
      utilisateur: commande.users
        ? {
            id: commande.users.id,
            nom: commande.users.last_name,
            prenom: commande.users.first_name,
            email: commande.users.email,
          }
        : undefined,
      articles: commande.commande_articles.map((ca: any) => ({
        article_id: ca.article_id,
        nom: ca.articles?.nom,
        quantite: ca.quantite,
        taille: ca.taille,
        prix: Number(ca.prix),
      })),
    }));

    console.log(
      `✅ [Magasin Service] ${commandesFormatted.length} commandes récupérées`,
    );

    return commandesFormatted;
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur récupération commandes:", error);
    captureException(error as Error, {
      tags: { context: "obtenirLesCommandes" },
    });
    throw new Error("Impossible de récupérer les commandes");
  }
}

/**
 * Vérifier l'unicité d'une commande
 */
export async function verifierUniciteCommande(uniqueId: string): Promise<any> {
  try {
    addSentryBreadcrumb(
      `Vérification unicité commande: ${uniqueId}`,
      "magasin",
      "info",
      { uniqueId },
    );

    console.log(
      "🔍 [Magasin Service] Vérification unicité commande:",
      uniqueId,
    );

    const commande = await prisma.commandes.findFirst({
      where: {
        OR: [{ unique_id: uniqueId }, { numero_commande: uniqueId }],
      },
      select: {
        id: true,
        unique_id: true,
        numero_commande: true,
        statut: true,
        total: true,
        utilisateur_id: true,
        date_commande: true,
      },
    });

    if (!commande) {
      return {
        exists: false,
        message: "Commande non trouvée",
      };
    }

    console.log("✅ [Magasin Service] Commande trouvée:", commande.unique_id);

    return {
      exists: true,
      commande: {
        id: commande.id,
        unique_id: commande.unique_id,
        numero_commande: commande.numero_commande,
        statut: commande.statut,
        total: Number(commande.total),
        utilisateur_id: commande.utilisateur_id,
        date: commande.date_commande,
      },
    };
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur vérification unicité:", error);
    captureException(error as Error, {
      tags: { context: "verifierUniciteCommande" },
      extra: { uniqueId },
    });
    throw new Error("Erreur lors de la vérification de l'unicité");
  }
}

/**
 * Récupérer les tailles disponibles
 */
export async function obtenirTailles(): Promise<any[]> {
  try {
    addSentryBreadcrumb(
      "Récupération de toutes les tailles",
      "magasin",
      "info",
    );

    console.log("🔍 [Magasin Service] Récupération de toutes les tailles");

    const tailles = await prisma.tailles.findMany({
      orderBy: {
        nom: "asc",
      },
    });

    console.log(`✅ [Magasin Service] ${tailles.length} tailles récupérées`);

    return tailles;
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur récupération tailles:", error);
    captureException(error as Error, {
      tags: { context: "obtenirTailles" },
    });
    throw new Error("Impossible de récupérer les tailles");
  }
}

/**
 * Récupérer le PaymentIntent d'une commande
 */
export async function obtenirPaymentIntentCommande(
  commandeId: string,
  userId: number,
): Promise<any> {
  try {
    addSentryBreadcrumb(
      `Récupération PaymentIntent pour commande: ${commandeId}`,
      "magasin",
      "info",
      { commandeId, userId },
    );

    console.log(
      "🔍 [Magasin Service] Récupération PaymentIntent pour commande:",
      {
        commandeId,
        userId,
      },
    );

    // Vérifier la commande par ID numérique OU unique_id
    const commande = await prisma.commandes.findFirst({
      where: {
        AND: [
          {
            OR: [
              { id: parseInt(commandeId) || 0 },
              { unique_id: commandeId },
              { numero_commande: commandeId },
            ],
          },
          { utilisateur_id: userId },
        ],
      },
      select: {
        id: true,
        utilisateur_id: true,
        statut: true,
        unique_id: true,
        numero_commande: true,
      },
    });

    if (!commande) {
      throw new Error("Commande non trouvée ou ne vous appartient pas");
    }

    console.log("✅ [Magasin Service] Commande trouvée:", {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
    });

    // Rechercher le paiement par l'ID réel de la commande
    const payment = await prisma.paiements.findFirst({
      where: {
        commande_id: commande.id,
        utilisateur_id: userId,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        stripe_payment_intent_id: true,
        statut: true,
        montant: true,
      },
    });

    if (!payment) {
      throw new Error("Aucun paiement trouvé pour cette commande");
    }

    console.log("🔍 [Magasin Service] PaymentIntent trouvé dans DB:", {
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      statut: payment.statut,
      montant: Number(payment.montant),
    });

    // Récupérer les détails du PaymentIntent depuis Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("Clé Stripe non configurée");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-01-28.clover",
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id!,
    );

    console.log("✅ [Magasin Service] PaymentIntent récupéré depuis Stripe:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      statut: payment.statut,
      montant: Number(payment.montant),
      metadata: paymentIntent.metadata || {},
    };
  } catch (error: any) {
    console.error(
      "❌ [Magasin Service] Erreur récupération PaymentIntent:",
      error,
    );
    captureException(error as Error, {
      tags: { context: "obtenirPaymentIntentCommande" },
      extra: { commandeId, userId },
    });

    // Préserver les messages d'erreur métier spécifiques
    if (
      error instanceof Error &&
      (error.message.includes("non trouvée") ||
        error.message.includes("appartient pas") ||
        error.message.includes("Aucun paiement") ||
        error.message.includes("Clé Stripe"))
    ) {
      throw error;
    }
    throw new Error("Erreur lors de la récupération du PaymentIntent");
  }
}

/**
 * Envoyer un email de confirmation de commande
 */
async function envoyerEmailConfirmationCommande(
  commandeData: any,
  utilisateurEmail: string,
  utilisateurNom: string,
): Promise<void> {
  try {
    addSentryBreadcrumb(
      `Envoi email confirmation commande: ${commandeData.numero_commande}`,
      "magasin",
      "info",
      { numeroCommande: commandeData.numero_commande },
    );

    const emailClient = new EmailClient();

    // Générer la liste des articles pour le template
    const articlesFormatted = commandeData.articles.map((article: any) => ({
      nom: article.nom || "Article",
      quantite: article.quantite || 1,
      taille: article.taille || "N/A",
      prixUnitaire: (article.prix || 0).toFixed(2),
      prixTotal: ((article.prix || 0) * (article.quantite || 1)).toFixed(2),
    }));

    // Préparer les variables pour le template
    const templateVariables = {
      userName: utilisateurNom,
      numeroCommande: commandeData.numero_commande,
      uniqueId: commandeData.unique_id,
      dateCommande: new Date(commandeData.created_at).toLocaleDateString(
        "fr-FR",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ),
      statutCommande: commandeData.statut || "En attente",
      totalCommande: commandeData.total.toFixed(2),
      nbArticles: commandeData.articles.length.toString(),
      articlesJson: JSON.stringify(articlesFormatted),
      article1Nom: articlesFormatted[0]?.nom || "",
      article1Quantite: articlesFormatted[0]?.quantite || "",
      article1Taille: articlesFormatted[0]?.taille || "",
      article1Prix: articlesFormatted[0]?.prixTotal || "",
      delaiPreparation: "2-3 jours ouvrables",
      lieuRetrait: "Accueil du club",
      horaires: "Lundi-Vendredi 9h-18h, Samedi 9h-12h",
      conservation: "30 jours",
      emailContact: "magasin@clubmanager.com",
      telephoneContact: "+32 XXX XX XX XX",
      anneeActuelle: new Date().getFullYear().toString(),
    };

    console.log("📧 [Magasin Service] Envoi email confirmation commande:", {
      destinataire: utilisateurEmail,
      numeroCommande: commandeData.numero_commande,
    });

    const result = await emailClient.sendEmail({
      to: utilisateurEmail,
      subject: "Confirmation de commande",
      message: "",
      templateTitle: "confirmation-commande",
      variables: templateVariables,
      saveToDb: true,
      utilisateurId: commandeData.utilisateur_id,
    });

    if (result.success) {
      console.log(
        "✅ [Magasin Service] Email de confirmation envoyé avec succès",
      );
    } else {
      console.error("❌ [Magasin Service] Échec envoi email:", result.error);
    }
  } catch (error) {
    console.error(
      "❌ [Magasin Service] Erreur envoi email confirmation:",
      error,
    );
    captureException(error as Error, {
      tags: { context: "envoyerEmailConfirmationCommande" },
      extra: { numeroCommande: commandeData.numero_commande },
    });
    // Ne pas faire échouer la commande si l'email échoue
  }
}

/**
 * Calculer les statistiques du magasin
 */
export async function calculerStatistiquesMagasin(
  dateDebut?: string,
  dateFin?: string,
): Promise<StatistiquesMagasin> {
  try {
    addSentryBreadcrumb(
      "Calcul des statistiques du magasin",
      "magasin",
      "info",
      { dateDebut, dateFin },
    );

    console.log("📊 [Magasin Service] Calcul des statistiques");

    const whereClause: any = {};
    if (dateDebut && dateFin) {
      whereClause.date_commande = {
        gte: new Date(dateDebut),
        lte: new Date(dateFin),
      };
    }

    // Récupérer toutes les commandes dans la période
    const commandes = await prisma.commandes.findMany({
      where: whereClause,
      select: {
        statut: true,
        total: true,
      },
    });

    const stats = {
      total_commandes: commandes.length,
      commandes_en_attente: commandes.filter(
        (c: any) => c.statut === "en_attente",
      ).length,
      commandes_validees: commandes.filter(
        (c: any) => c.statut === "validé" || c.statut === "valide",
      ).length,
      commandes_livrees: commandes.filter(
        (c: any) => c.statut === "livré" || c.statut === "livre",
      ).length,
      commandes_annulees: commandes.filter(
        (c: any) => c.statut === "annulé" || c.statut === "annule",
      ).length,
      chiffre_affaires_total: commandes.reduce(
        (sum: number, c: any) => sum + Number(c.total),
        0,
      ),
    };

    console.log("✅ [Magasin Service] Statistiques calculées:", stats);

    return stats;
  } catch (error) {
    console.error("❌ [Magasin Service] Erreur calcul statistiques:", error);
    captureException(error as Error, {
      tags: { context: "calculerStatistiquesMagasin" },
      extra: { dateDebut, dateFin },
    });
    throw new Error("Impossible de calculer les statistiques");
  }
}
