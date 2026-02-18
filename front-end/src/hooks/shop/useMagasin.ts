import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "../pages/apiUrl";
import type {
  Products,
  ProductsInsert,
  ProductCategories,
} from "@clubmanager/types";
import { useToast } from "./useToast";

type ArticlesByCategory = {
  [categoryName: string]: Products[];
};

type TaillesResponse = {
  tailles: Array<{
    id: number;
    taille_name: string;
  }>;
};

type CommandeData = {
  utilisateur_id: number;
  total: number;
  articles: Array<{
    article_id: number;
    taille_id?: number;
    quantite: number;
    prix: number;
  }>;
};

type CommandeResponse = {
  success: boolean;
  commande: {
    id: number;
    numero_commande: string;
    total: number;
  };
  isDuplicate?: boolean;
  message?: string;
};

// Hook pour récupérer les articles par catégorie
export const useArticlesParCategorie = () => {
  return useQuery<ArticlesByCategory>({
    queryKey: ["articlesParCategorie"],
    queryFn: async () => {
      const response = await fetch(apiUrl("magasin/articles"), {
        credentials: "include",
      });
      if (!response.ok)
        throw new Error("Erreur lors du chargement des articles");
      return response.json();
    },
  });
};

// Hook pour récupérer les catégories
export const useCategoriesMagasin = () => {
  return useQuery<ProductCategories[]>({
    queryKey: ["categoriesMagasin"],
    queryFn: async () => {
      const response = await fetch(apiUrl("magasin/articles/categories"), {
        credentials: "include",
      });
      if (!response.ok)
        throw new Error("Erreur lors du chargement des catégories");
      return response.json();
    },
  });
};

// Hook pour récupérer les tailles disponibles depuis l'API
export const useTaillesMagasin = () => {
  return useQuery<TaillesResponse["tailles"]>({
    queryKey: ["taillesMagasin"],
    queryFn: async () => {
      const response = await fetch(apiUrl("magasin/tailles"), {
        credentials: "include",
      });
      if (!response.ok)
        throw new Error("Erreur lors du chargement des tailles");
      const data: TaillesResponse = await response.json();
      return data.tailles;
    },
  });
};

// Hook pour ajouter un article
export const useAjouterArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation<Products, Error, ProductsInsert>({
    mutationFn: async (article: ProductsInsert) => {
      const response = await fetch(apiUrl("magasin/articles/ajouter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erreur lors de l'ajout de l'article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articlesParCategorie"] });
    },
  });
};

// Hook pour modifier un article
export const useModifierArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation<Products, Error, { id: number; article: ProductsInsert }>({
    mutationFn: async ({
      id,
      article,
    }: {
      id: number;
      article: ProductsInsert;
    }) => {
      const response = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(article),
        credentials: "include",
      });
      if (!response.ok)
        throw new Error("Erreur lors de la modification de l'article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articlesParCategorie"] });
    },
  });
};

// Hook pour supprimer un article
export const useSupprimerArticleMagasin = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, number>({
    mutationFn: async (id: number) => {
      const response = await fetch(apiUrl(`magasin/articles/${id}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok)
        throw new Error("Erreur lors de la suppression de l'article");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articlesParCategorie"] });
    },
  });
};

// Cache pour empêcher les soumissions multiples côté client
const soumissionsEnCours = new Map<string, Promise<CommandeResponse>>();

export const useCreerCommande = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<CommandeResponse, Error, CommandeData>({
    mutationFn: async (commandeData: CommandeData) => {
      // Créer une clé unique pour cette commande
      const cacheKey = `${commandeData.utilisateur_id}-${commandeData.total}-${JSON.stringify(commandeData.articles)}`;

      // Vérifier si une soumission identique est en cours
      if (soumissionsEnCours.has(cacheKey)) {
        console.log("⚠️ [Hook] Soumission identique en cours, attente...");
        const existingPromise = soumissionsEnCours.get(cacheKey);
        if (existingPromise) {
          return await existingPromise;
        }
      }

      console.log("🔄 [Hook] Création commande avec protection doublon");

      // Créer la promesse et la stocker
      const promesse = (async () => {
        try {
          const response = await fetch(apiUrl("magasin/commandes/ajouter"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            credentials: "include",
            body: JSON.stringify(commandeData),
          });

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Erreur réseau" }));
            throw new Error(errorData.message || `Erreur ${response.status}`);
          }

          const result: CommandeResponse = await response.json();

          if (result.isDuplicate) {
            console.log(
              "ℹ️ [Hook] Doublon détecté côté serveur, commande existante retournée",
            );
          }

          return result;
        } finally {
          // Nettoyer le cache après 3 secondes
          setTimeout(() => {
            soumissionsEnCours.delete(cacheKey);
          }, 3000);
        }
      })();

      // Stocker la promesse
      soumissionsEnCours.set(cacheKey, promesse);

      return await promesse;
    },
    onSuccess: (data) => {
      console.log("✅ [Hook] Commande créée/récupérée:", {
        isDuplicate: data.isDuplicate,
        numero: data.commande?.numero_commande,
      });

      if (data.isDuplicate) {
        showToast("Commande déjà existante - doublon évité", "info");
      } else {
        showToast("Commande créée avec succès", "success");
      }

      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
    onError: (error: Error, variables) => {
      console.error("❌ [Hook] Erreur création commande:", error);

      // Nettoyer le cache en cas d'erreur
      const cacheKey = `${variables.utilisateur_id}-${variables.total}-${JSON.stringify(variables.articles)}`;
      soumissionsEnCours.delete(cacheKey);

      showToast(
        error.message || "Erreur lors de la création de la commande",
        "danger",
      );
    },
    // Options pour empêcher les retry automatiques
    retry: false,
  });
};
