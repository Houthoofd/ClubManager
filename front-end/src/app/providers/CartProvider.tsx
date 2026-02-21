import React, { createContext, useContext, useState, ReactNode } from "react";

// Types
export type CartArticle = {
  id: number;
  nom: string;
  prix: number;
  taille?: {
    id: number;
    taille_name: string;
  };
  quantite: number;
  image_url?: string;
};

type CartContextType = {
  articles: CartArticle[];
  isOpen: boolean;
  addArticle: (article: CartArticle) => void;
  removeArticle: (articleId: number, tailleId?: number) => void;
  updateQuantite: (
    articleId: number,
    tailleId: number | undefined,
    quantite: number,
  ) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  count: number;
};

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [articles, setArticles] = useState<CartArticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addArticle = (article: CartArticle) => {
    setArticles((prev) => {
      // Chercher si l'article existe déjà (même id + même taille)
      const existingIndex = prev.findIndex(
        (a) => a.id === article.id && a.taille?.id === article.taille?.id,
      );

      if (existingIndex > -1) {
        // Article existe, augmenter la quantité
        const updated = [...prev];
        updated[existingIndex].quantite += article.quantite;
        return updated;
      }

      // Nouvel article
      return [...prev, article];
    });
  };

  const removeArticle = (articleId: number, tailleId?: number) => {
    setArticles((prev) =>
      prev.filter((a) => {
        if (tailleId !== undefined) {
          // Si une taille est spécifiée, supprimer uniquement cet article avec cette taille
          return !(a.id === articleId && a.taille?.id === tailleId);
        }
        // Sinon, supprimer tous les articles avec cet id
        return a.id !== articleId;
      }),
    );
  };

  const updateQuantite = (
    articleId: number,
    tailleId: number | undefined,
    quantite: number,
  ) => {
    if (quantite <= 0) {
      removeArticle(articleId, tailleId);
      return;
    }

    setArticles((prev) =>
      prev.map((a) => {
        if (tailleId !== undefined) {
          // Mettre à jour uniquement l'article avec cette taille
          if (a.id === articleId && a.taille?.id === tailleId) {
            return { ...a, quantite };
          }
        } else {
          // Mettre à jour l'article sans taille spécifique
          if (a.id === articleId) {
            return { ...a, quantite };
          }
        }
        return a;
      }),
    );
  };

  const clearCart = () => {
    setArticles([]);
  };

  const openCart = () => {
    setIsOpen(true);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  // Calculer le total
  const total = articles.reduce(
    (sum, article) => sum + article.prix * article.quantite,
    0,
  );

  // Compter le nombre d'articles (somme des quantités)
  const count = articles.reduce((sum, article) => sum + article.quantite, 0);

  return (
    <CartContext.Provider
      value={{
        articles,
        isOpen,
        addArticle,
        removeArticle,
        updateQuantite,
        clearCart,
        openCart,
        closeCart,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
