import {
  useGetProductsQuery,
  useGetProductCategoriesQuery,
  useGetStockSizesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateOrderMutation,
} from "@/lib/apollo/generated/graphql";
import type {
  Products,
  ProductsInsert,
  ProductCategories,
} from "@clubmanager/types";
import { apolloClient } from "@/lib/apollo/apollo-client";
import { useToast } from "../utils/useToast";

type ArticlesByCategory = {
  [categoryName: string]: Products[];
};

type TaillesResponse = {
  id: number;
  name: string;
  code: string;
}[];

type CommandeData = {
  user_id: number;
  items: Array<{
    product_id: number;
    size_id?: number;
    quantity: number;
    price: number;
  }>;
  delivery_address?: string;
  notes?: string;
};

type CommandeResponse = {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook pour récupérer les articles par catégorie
 * Transforme les données GraphQL en format attendu par l'UI
 */
export const useArticlesParCategorie = () => {
  const { data, loading, error, refetch } = useGetProductsQuery({
    fetchPolicy: "cache-and-network",
  });

  const { data: categoriesData } = useGetProductCategoriesQuery({
    fetchPolicy: "cache-first",
  });

  // Transformer les produits en structure groupée par catégorie
  const articlesByCategory: ArticlesByCategory = {};

  if (data?.products && categoriesData?.productCategories) {
    // Créer un map des catégories pour lookup rapide
    const categoriesMap = new Map(
      categoriesData.productCategories.map((cat: any) => [cat.id, cat.name]),
    );

    // Grouper les articles par nom de catégorie
    data.products.forEach((product: any) => {
      const categoryName =
        categoriesMap.get(product.category_id) || "Non catégorisé";
      if (!articlesByCategory[categoryName as string]) {
        articlesByCategory[categoryName as string] = [];
      }
      articlesByCategory[categoryName as string].push(product as Products);
    });
  }

  return {
    data: articlesByCategory,
    isLoading: loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les catégories
 */
export const useCategoriesMagasin = () => {
  const { data, loading, error, refetch } = useGetProductCategoriesQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    data: (data?.productCategories || []) as ProductCategories[],
    isLoading: loading,
    error,
    refetch,
  };
};

/**
 * Hook pour récupérer les tailles disponibles
 */
export const useTaillesMagasin = () => {
  const { data, loading, error, refetch } = useGetStockSizesQuery({
    fetchPolicy: "cache-and-network",
  });

  return {
    data: (data?.stockSizes || []) as TaillesResponse,
    isLoading: loading,
    error,
    refetch,
  };
};

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook pour ajouter un article
 */
export const useAjouterArticleMagasin = () => {
  const { showToast } = useToast();

  const [createProduct, { loading, error }] = useCreateProductMutation({
    onCompleted: () => {
      showToast("Article ajouté avec succès", "success");
      // Invalider le cache pour forcer un refetch
      apolloClient.refetchQueries({
        include: ["GetProducts", "GetProductCategories"],
      });
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de l'ajout de l'article:", error);
      showToast(
        error.message || "Erreur lors de l'ajout de l'article",
        "danger",
      );
    },
  });

  const mutate = async (article: ProductsInsert): Promise<Products | null> => {
    try {
      const result = await createProduct({
        variables: {
          input: {
            name: article.name,
            description: article.description,
            price: article.price,
            category_id: article.category_id,
            image_url: article.image_url,
            active: article.active ?? true,
          },
        },
      });

      return result.data?.createProduct as Products | null;
    } catch (err) {
      console.error("❌ Mutation error:", err);
      return null;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    error,
  };
};

/**
 * Hook pour modifier un article
 */
export const useModifierArticleMagasin = () => {
  const { showToast } = useToast();

  const [updateProduct, { loading, error }] = useUpdateProductMutation({
    onCompleted: () => {
      showToast("Article modifié avec succès", "success");
      apolloClient.refetchQueries({
        include: ["GetProducts"],
      });
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de la modification:", error);
      showToast(
        error.message || "Erreur lors de la modification de l'article",
        "danger",
      );
    },
  });

  const mutate = async ({
    id,
    article,
  }: {
    id: number;
    article: ProductsInsert;
  }): Promise<Products | null> => {
    try {
      const result = await updateProduct({
        variables: {
          id,
          input: {
            name: article.name,
            description: article.description,
            price: article.price,
            category_id: article.category_id,
            image_url: article.image_url,
            active: article.active,
          },
        },
      });

      return result.data?.updateProduct as Products | null;
    } catch (err) {
      console.error("❌ Mutation error:", err);
      return null;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    error,
  };
};

/**
 * Hook pour supprimer un article
 */
export const useSupprimerArticleMagasin = () => {
  const { showToast } = useToast();

  const [deleteProduct, { loading, error }] = useDeleteProductMutation({
    onCompleted: (data: any) => {
      if (data.deleteProduct.success) {
        showToast(data.deleteProduct.message || "Article supprimé", "success");
        apolloClient.refetchQueries({
          include: ["GetProducts"],
        });
      } else {
        showToast(data.deleteProduct.message || "Erreur", "danger");
      }
    },
    onError: (error: any) => {
      console.error("❌ Erreur lors de la suppression:", error);
      showToast(
        error.message || "Erreur lors de la suppression de l'article",
        "danger",
      );
    },
  });

  const mutate = async (id: number): Promise<boolean> => {
    try {
      const result = await deleteProduct({
        variables: { id },
      });
      return result.data?.deleteProduct.success ?? false;
    } catch (err) {
      console.error("❌ Mutation error:", err);
      return false;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    error,
  };
};

/**
 * Hook pour créer une commande
 * Cache côté client pour éviter les doublons
 */
const soumissionsEnCours = new Map<string, Promise<CommandeResponse | null>>();

export const useCreerCommande = () => {
  const { showToast } = useToast();

  const [createOrder, { loading, error }] = useCreateOrderMutation({
    onCompleted: () => {
      showToast("Commande créée avec succès", "success");
      apolloClient.refetchQueries({
        include: ["GetOrders", "GetProductStocks"],
      });
    },
    onError: (error: any) => {
      console.error("❌ Erreur création commande:", error);
      showToast(
        error.message || "Erreur lors de la création de la commande",
        "danger",
      );
    },
  });

  const mutate = async (
    commandeData: CommandeData,
  ): Promise<CommandeResponse | null> => {
    // Créer une clé unique pour cette commande (protection doublon côté client)
    const cacheKey = `${commandeData.user_id}-${JSON.stringify(commandeData.items)}`;

    // Vérifier si une soumission identique est en cours
    if (soumissionsEnCours.has(cacheKey)) {
      console.log(
        "⚠️ [Hook GraphQL] Soumission identique en cours, attente...",
      );
      const existingPromise = soumissionsEnCours.get(cacheKey);
      if (existingPromise) {
        return await existingPromise;
      }
    }

    console.log("🔄 [Hook GraphQL] Création commande");

    // Créer la promesse et la stocker
    const promesse = (async () => {
      try {
        const result = await createOrder({
          variables: {
            input: {
              user_id: commandeData.user_id,
              items: commandeData.items.map((item) => ({
                product_id: item.product_id,
                size_id: item.size_id,
                quantity: item.quantity,
                price: item.price,
              })),
              delivery_address: commandeData.delivery_address,
              notes: commandeData.notes,
            },
          },
        });

        if (result.data?.createOrder) {
          console.log(
            "✅ [Hook GraphQL] Commande créée:",
            result.data.createOrder,
          );
          return result.data.createOrder as CommandeResponse;
        }

        return null;
      } catch (err) {
        console.error("❌ [Hook GraphQL] Erreur:", err);
        throw err;
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
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: loading,
    error,
  };
};
