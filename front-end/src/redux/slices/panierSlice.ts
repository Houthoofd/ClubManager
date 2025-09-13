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
      state.articles.push(action.payload);
    },
    supprimerArticle: (state, action: PayloadAction<number>) => {
      state.articles = state.articles.filter((_, index) => index !== action.payload);
    },
    modifierTaille: (state, action: PayloadAction<{ index: number; taille: string }>) => {
      const { index, taille } = action.payload;
      if (state.articles[index]) {
        state.articles[index].taille = taille;
      }
    },
    modifierQuantite: (state, action: PayloadAction<{ index: number; quantite: number }>) => {
      const { index, quantite } = action.payload;
      if (state.articles[index]) {
        state.articles[index].quantite = quantite;
      }
    },
    ouvrirPanier: (state) => {
      state.isOpen = true;
    },
    fermerPanier: (state) => {
      state.isOpen = false;
    },
    viderPanier: (state) => {
      state.articles = [];
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
  viderPanier,
} = panierSlice.actions;

export default panierSlice.reducer;
