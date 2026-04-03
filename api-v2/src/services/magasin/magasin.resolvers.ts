/**
 * Resolvers GraphQL pour le magasin
 */

import { MagasinService } from './magasin.service.js';
import type {
  ArticleCreationData,
  NouvelleCommande,
  StatutCommande
} from '@clubmanager/types';

// Instance du service
const magasinService = new MagasinService();

export const magasinResolvers = {
  Query: {
    // === ARTICLES ===
    
    // Récupérer tous les articles
    articles: async () => {
      return magasinService.obtenirTousLesArticles();
    },

    // Récupérer les articles groupés par catégories  
    articlesParCategories: async () => {
      return magasinService.obtenirArticlesParCategories();
    },

    // Récupérer les articles d'une catégorie
    articlesCategorie: async (_: any, { categorieId }: { categorieId: number }) => {
      return magasinService.obtenirArticlesParCategorie(categorieId);
    },

    // === COMMANDES ===

    // Récupérer toutes les commandes
    commandes: async () => {
      return magasinService.obtenirToutesLesCommandes();
    },

    // Récupérer les commandes d'un utilisateur
    commandesUtilisateur: async (_: any, { utilisateurId }: { utilisateurId: number }) => {
      return magasinService.obtenirCommandesUtilisateur(utilisateurId);
    },

    // === STOCKS ===

    // Récupérer les stocks d'un article
    stocksArticle: async (_: any, { articleId }: { articleId: number }) => {
      return magasinService.obtenirStocksArticle(articleId);
    },

    // Vérifier la disponibilité d'un article
    verifierDisponibilite: async (
      _: any, 
      { articleId, taille, quantite }: { articleId: number; taille: string; quantite: number }
    ) => {
      return magasinService.verifierDisponibilite(articleId, taille, quantite);
    },

    // Récupérer les articles en rupture de stock
    articlesRuptureStock: async (_: any, { seuilMinimum }: { seuilMinimum?: number }) => {
      return magasinService.obtenirArticlesRuptureStock(seuilMinimum);
    },

    // === CATÉGORIES ===

    // Récupérer toutes les catégories
    categories: async () => {
      return magasinService.obtenirToutesLesCategories();
    },

    // Récupérer les catégories avec compteurs
    categoriesAvecCompteurs: async () => {
      return magasinService.obtenirCategoriesAvecCompteurs();
    },
  },

  Mutation: {
    // === ARTICLES ===

    // Créer un nouvel article
    creerArticle: async (_: any, { input }: { input: ArticleCreationData }) => {
      return magasinService.creerArticle(input);
    },

    // === COMMANDES ===

    // Créer une nouvelle commande
    creerCommande: async (_: any, { input }: { input: NouvelleCommande }) => {
      return magasinService.ajouterCommande(input);
    },

    // Modifier le statut d'une commande
    modifierStatutCommande: async (
      _: any,
      { commandeId, statut }: { commandeId: number; statut: StatutCommande }
    ) => {
      return magasinService.modifierStatutCommande(commandeId, statut);
    },

    // Annuler une commande
    annulerCommande: async (_: any, { commandeId }: { commandeId: number }) => {
      return magasinService.annulerCommande(commandeId);
    },

    // === STOCKS ===

    // Mettre à jour le stock d'un article
    mettreAJourStock: async (
      _: any,
      { articleId, taille, quantite }: { articleId: number; taille: string; quantite: number }
    ) => {
      return magasinService.mettreAJourStock(articleId, taille, quantite);
    },

    // === CATÉGORIES ===

    // Créer une nouvelle catégorie
    creerCategorie: async (_: any, { nom }: { nom: string }) => {
      return magasinService.creerCategorie(nom);
    },

    // Modifier une catégorie
    modifierCategorie: async (
      _: any,
      { categorieId, nom }: { categorieId: number; nom: string }
    ) => {
      return magasinService.modifierCategorie(categorieId, nom);
    },

    // Supprimer une catégorie
    supprimerCategorie: async (_: any, { categorieId }: { categorieId: number }) => {
      return magasinService.supprimerCategorie(categorieId);
    },
  },

  // === RESOLVERS DE TYPE ===

  // Résolveur pour le type Article - ajout de champs calculés si nécessaire
  Article: {
    // Calculer si l'article est en stock
    enStock: async (parent: any) => {
      if (!parent.stocks || !Array.isArray(parent.stocks)) {
        return false;
      }
      return parent.stocks.some((stock: any) => stock.quantite > 0);
    },

    // Calculer la quantité totale en stock
    quantiteTotale: async (parent: any) => {
      if (!parent.stocks || !Array.isArray(parent.stocks)) {
        return 0;
      }
      return parent.stocks.reduce((total: number, stock: any) => total + stock.quantite, 0);
    },
  },

  // Résolveur pour le type Commande
  Commande: {
    // Calculer le nombre d'articles dans la commande
    nombreArticles: async (parent: any) => {
      if (!parent.articles || !Array.isArray(parent.articles)) {
        return 0;
      }
      return parent.articles.reduce((total: number, article: any) => total + article.quantite, 0);
    },

    // Vérifier si la commande peut être annulée
    peutEtreAnnulee: async (parent: any) => {
      const statutsAnnulables = ['en_attente', 'confirmee'];
      return statutsAnnulables.includes(parent.statut);
    },
  },

  // Résolveur pour le type Stock
  Stock: {
    // Déterminer le niveau d'alerte du stock
    niveauAlerte: async (parent: any) => {
      const quantite = parent.quantite || 0;
      if (quantite === 0) return 'RUPTURE';
      if (quantite <= 5) return 'FAIBLE';
      if (quantite <= 10) return 'MOYEN';
      return 'NORMAL';
    },
  },

  // Résolveur pour les enums
  StatutCommande: {
    EN_ATTENTE: 'en_attente',
    CONFIRMEE: 'confirmee',
    EXPEDIEE: 'expediee',
    LIVREE: 'livree',
    ANNULEE: 'annulee',
  },
};