import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Article {
  id: number;
  nom: string;
  prix: number;
  taille: string;
  quantite: number;
  images?: string[];
}

interface PanierState {
  articles: Article[];
  isOpen: boolean;
}

const initialState: PanierState = {
  articles: [],
  isOpen: false,
};

const panierSlice = createSlice({
  name: 'panier',
  initialState,
  reducers: {
    ajouterArticle: (state, action: PayloadAction<Article>) => {
      console.log('🛒 [Redux] ajouterArticle - Avant:', state.articles);
      console.log('🛒 [Redux] ajouterArticle - Article à ajouter:', action.payload);
      state.articles.push(action.payload);
      console.log('🛒 [Redux] ajouterArticle - Après:', state.articles);
      
      // NOUVEAU: Sauvegarder automatiquement dans userData ET localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.panierAutoSave = {
          articles: state.articles,
          timestamp: new Date().toISOString(),
          action: 'ajouterArticle'
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        localStorage.setItem('panierBackup', JSON.stringify({
          articles: state.articles,
          timestamp: new Date().toISOString(),
          action: 'ajouterArticle'
        }));
        
        console.log('💾 [Redux] Auto-sauvegarde après ajout article');
      } catch (error) {
        console.warn('⚠️ [Redux] Erreur auto-sauvegarde:', error);
      }
    },
    supprimerArticle: (state, action: PayloadAction<number>) => {
      console.log('🛒 [Redux] supprimerArticle - Index:', action.payload);
      console.log('🛒 [Redux] supprimerArticle - Avant:', state.articles);
      state.articles = state.articles.filter((_, index) => index !== action.payload);
      console.log('🛒 [Redux] supprimerArticle - Après:', state.articles);
    },
    modifierTaille: (state, action: PayloadAction<{ index: number; taille: string }>) => {
      const { index, taille } = action.payload;
      console.log('🛒 [Redux] modifierTaille:', { index, taille });
      console.log('🛒 [Redux] modifierTaille - Avant:', state.articles[index]);
      if (state.articles[index]) {
        state.articles[index].taille = taille;
      }
      console.log('🛒 [Redux] modifierTaille - Après:', state.articles[index]);
    },
    modifierQuantite: (state, action: PayloadAction<{ index: number; quantite: number }>) => {
      const { index, quantite } = action.payload;
      console.log('🛒 [Redux] modifierQuantite:', { index, quantite });
      console.log('🛒 [Redux] modifierQuantite - Avant:', state.articles[index]);
      if (state.articles[index]) {
        state.articles[index].quantite = quantite;
      }
      console.log('🛒 [Redux] modifierQuantite - Après:', state.articles[index]);
    },
    ouvrirPanier: (state) => {
      console.log('🛒 [Redux] ouvrirPanier');
      state.isOpen = true;
    },
    fermerPanier: (state) => {
      console.log('🛒 [Redux] fermerPanier');
      state.isOpen = false;
    },
    viderPanier: (state) => {
      console.log('🛒 [Redux] viderPanier - Avant:', state.articles);
      
      // NOUVEAU: Sauvegarder avant de vider pour récupération possible
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Sauvegarder les articles avant vidage
        userData.panierAvantVidage = {
          articles: [...state.articles],
          timestamp: new Date().toISOString(),
          action: 'viderPanier'
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('💾 [Redux] Articles sauvegardés avant vidage:', state.articles.length);
      } catch (error) {
        console.warn('⚠️ [Redux] Erreur sauvegarde avant vidage:', error);
      }
      
      state.articles = [];
      state.isOpen = false;
      console.log('🛒 [Redux] viderPanier - Après:', state.articles);
      
      // NOUVEAU: Nettoyer les sauvegardes
      try {
        localStorage.removeItem('panierBackup');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        delete userData.panierTemp;
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('🧹 [Redux] Sauvegardes nettoyées après vidage panier');
      } catch (error) {
        console.warn('⚠️ [Redux] Erreur nettoyage sauvegardes:', error);
      }
    },
    synchroniserArticle: (state, action: PayloadAction<{ index: number; articleMisAJour: Article }>) => {
      const { index, articleMisAJour } = action.payload;
      console.log('🛒 [Redux] synchroniserArticle:', { index, articleMisAJour });
      console.log('🛒 [Redux] synchroniserArticle - Avant:', state.articles[index]);
      if (index >= 0 && index < state.articles.length) {
        state.articles[index] = { ...articleMisAJour, taille: state.articles[index].taille, quantite: state.articles[index].quantite };
      }
      console.log('🛒 [Redux] synchroniserArticle - Après:', state.articles[index]);
    },
    // AJOUTÉ: Action pour debug complet du panier
    debugPanier: (state) => {
      console.log('🔍 [Redux Debug] État complet du panier:');
      console.log('🔍 [Redux Debug] - Nombre d\'articles:', state.articles.length);
      console.log('🔍 [Redux Debug] - Panier ouvert:', state.isOpen);
      console.log('🔍 [Redux Debug] - Articles détaillés:', state.articles.map((article, index) => ({
        index,
        id: article.id,
        nom: article.nom,
        prix: article.prix,
        taille: article.taille,
        quantite: article.quantite,
        hasImages: !!article.images,
        imagesCount: article.images?.length || 0,
        hasStocks: !!article.stocks,
        stocksCount: article.stocks?.length || 0,
        stocks: article.stocks?.map(s => ({ taille: s.taille, quantite: s.quantite }))
      })));
      console.log('🔍 [Redux Debug] - Total calculé:', state.articles.reduce((total, article) => 
        total + (article.prix * (article.quantite || 1)), 0
      ));
    },
    // NOUVEAU: Action pour restaurer depuis localStorage
    restaurerDepuisLocalStorage: (state) => {
      try {
        const backup = localStorage.getItem('panierBackup');
        if (backup) {
          const panierBackup = JSON.parse(backup);
          if (panierBackup.articles && Array.isArray(panierBackup.articles)) {
            state.articles = panierBackup.articles;
            console.log('🔄 [Redux] Panier restauré depuis localStorage:', state.articles.length);
          }
        }
      } catch (error) {
        console.error('❌ [Redux] Erreur restauration localStorage:', error);
      }
    },
    // NOUVEAU: Action pour restaurer depuis userData
    restaurerDepuisUserData: (state) => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Essayer plusieurs sources de récupération
        let articlesRecuperes = null;
        
        if (userData.panierCommande?.articles?.length > 0) {
          articlesRecuperes = userData.panierCommande.articles;
          console.log('🔄 [Redux] Restauration depuis panierCommande');
        } else if (userData.panierAvantVidage?.articles?.length > 0) {
          articlesRecuperes = userData.panierAvantVidage.articles;
          console.log('🔄 [Redux] Restauration depuis panierAvantVidage');
        } else if (userData.panierAutoSave?.articles?.length > 0) {
          articlesRecuperes = userData.panierAutoSave.articles;
          console.log('🔄 [Redux] Restauration depuis panierAutoSave');
        } else if (userData.lastArticles?.length > 0) {
          articlesRecuperes = userData.lastArticles;
          console.log('🔄 [Redux] Restauration depuis lastArticles');
        }
        
        if (articlesRecuperes && Array.isArray(articlesRecuperes)) {
          state.articles = articlesRecuperes;
          console.log('✅ [Redux] Panier restauré depuis userData:', state.articles.length, 'articles');
        } else {
          console.log('ℹ️ [Redux] Aucun article à restaurer dans userData');
        }
      } catch (error) {
        console.error('❌ [Redux] Erreur restauration depuis userData:', error);
      }
    },
  },
});

export const {
  ajouterArticle,
  supprimerArticle,
  modifierTaille,
  modifierQuantite,
  ouvrirPanier,
  fermerPanier,
  synchroniserArticle,
  viderPanier,
  debugPanier,
  restaurerDepuisLocalStorage,
  restaurerDepuisUserData, // NOUVEAU: Export de l'action de restauration depuis userData
} = panierSlice.actions;

export default panierSlice.reducer;
