import { Magasin } from "../../../../db/clients/magasin/magasin.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../clients/emailClient.js";
import Stripe from "stripe";
import crypto from "crypto";

/**
 * Service de gestion du magasin
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
  created_at?: string;
  updated_at?: string;
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
  date: string;
  created_at?: string;
  updated_at?: string;
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
export async function generateSequentialCommandeNumber(
  paiementsClient?: Paiements,
): Promise<string> {
  try {
    const paiements = paiementsClient || new Paiements();

    // Récupérer le dernier numéro de commande
    const lastCommandeQuery = `
      SELECT numero_commande
      FROM commandes
      WHERE numero_commande LIKE 'CMD-%'
      ORDER BY id DESC
      LIMIT 1
    `;

    const results = await paiements.queryAsync(lastCommandeQuery, []);

    let nextNumber = 1;
    if (results.length > 0 && results[0].numero_commande) {
      // Extraire le numéro séquentiel de la dernière commande
      const lastNumber = results[0].numero_commande.split("-")[1];
      nextNumber = parseInt(lastNumber) + 1;
    }

    // Format: CMD-000001, CMD-000002, etc.
    return `CMD-${nextNumber.toString().padStart(6, "0")}`;
  } catch (error) {
    console.error("❌ Erreur génération numéro commande:", error);
    // Fallback vers timestamp en cas d'erreur
    return `CMD-${Date.now()}`;
  }
}

/**
 * Récupérer tous les articles par catégories
 */
export async function obtenirArticlesParCategories(
  magasinClient?: Magasin,
): Promise<any> {
  const client = magasinClient || new Magasin();

  console.log("🔍 [Service Magasin] Récupération des articles par catégories");

  try {
    const articles = await client.obtenirArticlesParCategories();

    console.log(`✅ [Service Magasin] Articles récupérés avec succès`);

    return articles;
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur récupération articles:", error);
    throw new Error("Impossible de récupérer les articles");
  }
}

/**
 * Récupérer toutes les catégories
 */
export async function obtenirLesCategories(
  magasinClient?: Magasin,
): Promise<any> {
  const client = magasinClient || new Magasin();

  console.log("🔍 [Service Magasin] Récupération des catégories");

  try {
    const categories = await client.obtenirLesCategories();

    console.log(
      `✅ [Service Magasin] ${categories.length} catégories récupérées`,
    );

    return categories;
  } catch (error) {
    console.error(
      "❌ [Service Magasin] Erreur récupération catégories:",
      error,
    );
    throw new Error("Impossible de récupérer les catégories");
  }
}

/**
 * Ajouter un nouvel article
 */
export async function ajouterArticle(
  articleData: any,
  magasinClient?: Magasin,
): Promise<any> {
  const client = magasinClient || new Magasin();

  console.log(
    "📝 [Service Magasin] Ajout d'un nouvel article:",
    articleData.nom,
  );

  try {
    const result = await client.ajouterArticle(articleData);

    if (result.isConfirm) {
      console.log("✅ [Service Magasin] Article ajouté avec succès");
      return result;
    } else {
      console.error(
        "❌ [Service Magasin] Erreur lors de l'ajout:",
        result.message,
      );
      throw new Error(result.message || "Erreur lors de l'ajout de l'article");
    }
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur ajout article:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de l'ajout de l'article");
  }
}

/**
 * Modifier un article existant
 */
export async function modifierArticle(
  articleId: number,
  articleData: any,
  magasinClient?: Magasin,
): Promise<any> {
  const client = magasinClient || new Magasin();

  console.log(`📝 [Service Magasin] Modification de l'article ${articleId}`);

  try {
    const result = await client.modifierArticle(articleId, articleData);

    if (result.isConfirm) {
      console.log("✅ [Service Magasin] Article modifié avec succès");
      return result;
    } else {
      console.error(
        "❌ [Service Magasin] Erreur lors de la modification:",
        result.message,
      );
      throw new Error(
        result.message || "Erreur lors de la modification de l'article",
      );
    }
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur modification article:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de la modification de l'article");
  }
}

/**
 * Supprimer un article
 */
export async function supprimerArticle(
  articleId: number,
  magasinClient?: Magasin,
): Promise<any> {
  const client = magasinClient || new Magasin();

  console.log(`🗑️ [Service Magasin] Suppression de l'article ${articleId}`);

  try {
    const result = await client.supprimerArticle(articleId);

    console.log("✅ [Service Magasin] Article supprimé avec succès");

    return result;
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur suppression article:", error);

    // Propager l'erreur originale si elle contient un message métier important
    const errorMessage = error instanceof Error ? error.message : String(error);
    const messageStr = errorMessage.toLowerCase();

    if (
      messageStr.includes("non trouvé") ||
      messageStr.includes("non trouve") ||
      messageStr.includes("introuvable") ||
      messageStr.includes("not found")
    ) {
      throw error; // Propager l'erreur 404 originale
    }

    throw new Error("Impossible de supprimer l'article");
  }
}

/**
 * Créer une nouvelle commande avec protection contre les doublons
 */
export async function creerCommande(
  commandeData: any,
  magasinClient?: Magasin,
  paiementsClient?: Paiements,
): Promise<any> {
  const client = magasinClient || new Magasin();
  const paiements = paiementsClient || new Paiements();

  const { utilisateur_id, articles, total } = commandeData;

  // Créer une clé de cache pour détecter les doublons
  const cacheKey = `${utilisateur_id}-${total}-${JSON.stringify(
    articles.map((a: any) => ({
      id: a.article_id,
      taille: a.taille,
      quantite: a.quantite,
    })),
  )}`;
  const maintenant = Date.now();

  console.log("🔍 [Service Magasin] Vérification doublon commande:", {
    cacheKey: cacheKey.substring(0, 50) + "...",
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
        "⚠️ [Service Magasin] Commande identique détectée, attente...",
        {
          delaiDepuisCommande: `${delaiDepuisCommande}ms`,
        },
      );

      try {
        // Attendre que la première commande se termine
        const resultatPremiere = await commandeEnCours.promesse;
        console.log(
          "✅ [Service Magasin] Première commande terminée, retour du même résultat",
        );

        return {
          ...resultatPremiere,
          isDuplicate: true,
        };
      } catch (error) {
        console.log(
          "❌ [Service Magasin] Première commande a échoué, on continue",
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
  const numeroCommande = await generateSequentialCommandeNumber(paiements);

  console.log("🆔 [Service Magasin] IDs générés:", {
    uniqueCommandeId,
    numeroCommande,
    utilisateur_id,
  });

  // Créer une promesse pour cette commande et la stocker
  const promesseCommande = (async () => {
    try {
      const finalCommandeData = {
        ...commandeData,
        unique_id: uniqueCommandeId,
        numero_commande: numeroCommande,
        created_at: new Date().toISOString(),
      };

      const result = await client.ajouterCommande(finalCommandeData);

      // Envoyer l'email de confirmation après succès
      try {
        const userData = await recupererDonneesUtilisateur(
          utilisateur_id,
          paiements,
        );
        if (userData) {
          await envoyerEmailConfirmationCommande(
            finalCommandeData,
            userData.email,
            userData.nom,
          );
        } else {
          console.warn(
            "⚠️ [Service Magasin] Impossible d'envoyer l'email - utilisateur non trouvé",
          );
        }
      } catch (emailError) {
        console.error("❌ [Service Magasin] Erreur envoi email:", emailError);
      }

      return {
        ...result,
        unique_id: uniqueCommandeId,
        numero_commande: numeroCommande,
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

  console.log("✅ [Service Magasin] Commande créée avec protection doublon:", {
    unique_id: uniqueCommandeId,
    numero_commande: numeroCommande,
  });

  return {
    ...resultatCommande,
    isDuplicate: false,
  };
}

/**
 * Récupérer toutes les commandes
 */
export async function obtenirLesCommandes(
  magasinClient?: Magasin,
): Promise<any[]> {
  const client = magasinClient || new Magasin();

  console.log("🔍 [Service Magasin] Récupération de toutes les commandes");

  try {
    const commandes = await client.obtenirLesCommandes();

    console.log(
      `✅ [Service Magasin] ${commandes.length} commandes récupérées`,
    );

    return commandes;
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur récupération commandes:", error);
    throw new Error("Impossible de récupérer les commandes");
  }
}

/**
 * Vérifier l'unicité d'une commande
 */
export async function verifierUniciteCommande(
  uniqueId: string,
  paiementsClient?: Paiements,
): Promise<any> {
  const paiements = paiementsClient || new Paiements();

  console.log("🔍 [Service Magasin] Vérification unicité commande:", uniqueId);

  try {
    const verifyQuery = `
      SELECT id, unique_id, numero_commande, statut, total, utilisateur_id, date
      FROM commandes
      WHERE unique_id = ? OR numero_commande = ?
    `;

    const results = await paiements.queryAsync(verifyQuery, [
      uniqueId,
      uniqueId,
    ]);

    if (results.length === 0) {
      return {
        exists: false,
        message: "Commande non trouvée",
      };
    }

    const commande = results[0];
    return {
      exists: true,
      commande: {
        id: commande.id,
        unique_id: commande.unique_id,
        numero_commande: commande.numero_commande,
        statut: commande.statut,
        total: commande.total,
        utilisateur_id: commande.utilisateur_id,
        date: commande.date,
      },
    };
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur vérification unicité:", error);
    throw new Error("Erreur lors de la vérification de l'unicité");
  }
}

/**
 * Récupérer les tailles disponibles
 */
export async function obtenirTailles(
  paiementsClient?: Paiements,
): Promise<any[]> {
  const { default: MysqlConnector } =
    await import("../../../../db/connector/mysqlconnector.js");
  const mysqlConnector = MysqlConnector.getInstance();

  console.log("🔍 [Service Magasin] Récupération de toutes les tailles");

  try {
    const taillesQuery = `
      SELECT id, nom
      FROM tailles
      ORDER BY nom ASC
    `;

    const tailles = await new Promise((resolve, reject) => {
      mysqlConnector.query(taillesQuery, [], (error: any, results: any) => {
        if (error) {
          console.error("❌ [Service Magasin] Erreur SELECT tailles:", error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    console.log(
      `✅ [Service Magasin] ${(tailles as any[]).length} tailles récupérées`,
    );

    return tailles as any[];
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur récupération tailles:", error);
    throw new Error("Impossible de récupérer les tailles");
  }
}

/**
 * Récupérer le PaymentIntent d'une commande
 */
export async function obtenirPaymentIntentCommande(
  commandeId: string,
  userId: number,
  paiementsClient?: Paiements,
): Promise<any> {
  const paiements = paiementsClient || new Paiements();

  console.log(
    "🔍 [Service Magasin] Récupération PaymentIntent pour commande:",
    {
      commandeId,
      userId,
    },
  );

  try {
    // Vérifier la commande par ID numérique OU unique_id
    const commandeQuery = `
      SELECT id, utilisateur_id, statut, unique_id, numero_commande
      FROM commandes
      WHERE (id = ? OR unique_id = ? OR numero_commande = ?) AND utilisateur_id = ?
    `;
    const commandeResults = await paiements.queryAsync(commandeQuery, [
      parseInt(commandeId) || 0,
      commandeId,
      commandeId,
      userId,
    ]);

    if (commandeResults.length === 0) {
      throw new Error("Commande non trouvée ou ne vous appartient pas");
    }

    const commande = commandeResults[0];
    console.log("✅ [Service Magasin] Commande trouvée:", {
      id: commande.id,
      unique_id: commande.unique_id,
      numero_commande: commande.numero_commande,
    });

    // Rechercher le paiement par l'ID réel de la commande
    const paymentQuery = `
      SELECT stripe_payment_intent_id, statut, montant
      FROM paiements
      WHERE commande_id = ? AND utilisateur_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;
    const paymentResults = await paiements.queryAsync(paymentQuery, [
      commande.id,
      userId,
    ]);

    if (paymentResults.length === 0) {
      throw new Error("Aucun paiement trouvé pour cette commande");
    }

    const payment = paymentResults[0];

    console.log("🔍 [Service Magasin] PaymentIntent trouvé dans DB:", {
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      statut: payment.statut,
      montant: payment.montant,
    });

    // Récupérer les détails du PaymentIntent depuis Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("Clé Stripe non configurée");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id,
    );

    console.log("✅ [Service Magasin] PaymentIntent récupéré depuis Stripe:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      statut: payment.statut,
      montant: payment.montant,
      metadata: paymentIntent.metadata || {},
    };
  } catch (error: any) {
    console.error(
      "❌ [Service Magasin] Erreur récupération PaymentIntent:",
      error,
    );
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

    console.log("📧 [Service Magasin] Envoi email confirmation commande:", {
      destinataire: utilisateurEmail,
      numeroCommande: commandeData.numero_commande,
    });

    const result = await emailClient.sendTemplatedEmail({
      to: utilisateurEmail,
      templateTitle: "confirmation-commande",
      variables: templateVariables,
      utilisateurId: commandeData.utilisateur_id,
    });

    if (result.success) {
      console.log(
        "✅ [Service Magasin] Email de confirmation envoyé avec succès",
      );
    } else {
      console.error("❌ [Service Magasin] Échec envoi email:", result.error);
    }
  } catch (error) {
    console.error(
      "❌ [Service Magasin] Erreur envoi email confirmation:",
      error,
    );
    // Ne pas faire échouer la commande si l'email échoue
  }
}

/**
 * Récupérer les données d'un utilisateur
 */
async function recupererDonneesUtilisateur(
  utilisateurId: number,
  paiementsClient?: Paiements,
): Promise<{ email: string; nom: string } | null> {
  try {
    const paiements = paiementsClient || new Paiements();

    const userQuery = `
      SELECT email, nom, prenom
      FROM utilisateurs
      WHERE id = ?
    `;

    const results = await paiements.queryAsync(userQuery, [utilisateurId]);

    if (results.length === 0) {
      console.error(
        "❌ [Service Magasin] Utilisateur non trouvé:",
        utilisateurId,
      );
      return null;
    }

    const user = results[0];
    return {
      email: user.email,
      nom: `${user.prenom || ""} ${user.nom || ""}`.trim() || "Membre",
    };
  } catch (error) {
    console.error(
      "❌ [Service Magasin] Erreur récupération utilisateur:",
      error,
    );
    return null;
  }
}

/**
 * Calculer les statistiques du magasin
 */
export async function calculerStatistiquesMagasin(
  dateDebut?: string,
  dateFin?: string,
  paiementsClient?: Paiements,
): Promise<StatistiquesMagasin> {
  const paiements = paiementsClient || new Paiements();

  console.log("📊 [Service Magasin] Calcul des statistiques");

  try {
    let whereClause = "";
    const params: any[] = [];

    if (dateDebut && dateFin) {
      whereClause = "WHERE date BETWEEN ? AND ?";
      params.push(dateDebut, dateFin);
    }

    // Statistiques de commandes
    const statsQuery = `
      SELECT
        COUNT(*) as total_commandes,
        SUM(CASE WHEN statut = 'en attente' THEN 1 ELSE 0 END) as commandes_en_attente,
        SUM(CASE WHEN statut = 'validé' THEN 1 ELSE 0 END) as commandes_validees,
        SUM(CASE WHEN statut = 'livré' THEN 1 ELSE 0 END) as commandes_livrees,
        SUM(CASE WHEN statut = 'annulé' THEN 1 ELSE 0 END) as commandes_annulees,
        SUM(total) as chiffre_affaires_total
      FROM commandes
      ${whereClause}
    `;

    const statsResults = await paiements.queryAsync(statsQuery, params);
    const stats = statsResults[0] || {};

    return {
      total_commandes: stats.total_commandes || 0,
      commandes_en_attente: stats.commandes_en_attente || 0,
      commandes_validees: stats.commandes_validees || 0,
      commandes_livrees: stats.commandes_livrees || 0,
      commandes_annulees: stats.commandes_annulees || 0,
      chiffre_affaires_total: stats.chiffre_affaires_total || 0,
    };
  } catch (error) {
    console.error("❌ [Service Magasin] Erreur calcul statistiques:", error);
    throw new Error("Impossible de calculer les statistiques");
  }
}
