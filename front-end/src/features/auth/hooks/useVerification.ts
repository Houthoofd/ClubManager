import {
  useCheckEmailLazyQuery,
  useCheckProductByNameLazyQuery,
  useCheckProductByNameAndCategoryLazyQuery,
  useCheckCourseScheduleLazyQuery,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// GRAPHQL-BASED VERIFICATION (Fully Migrated)
// ============================================================================

/**
 * Hook pour vérifier l'unicité de l'email via GraphQL
 * ✅ MIGRATED TO GRAPHQL
 */
export function useCheckEmail() {
  const [checkEmailQuery] = useCheckEmailLazyQuery();

  return async (email: string): Promise<boolean> => {
    if (!email) {
      console.log("🔍 useCheckEmail: Email vide, retour false");
      return false;
    }

    try {
      console.log(
        "🔍 useCheckEmail (GraphQL): Vérification de l'email:",
        email,
      );

      const { data, error } = await checkEmailQuery({
        variables: { email },
        fetchPolicy: "network-only", // Toujours vérifier côté serveur
      });

      if (error) {
        console.error("❌ useCheckEmail (GraphQL): Erreur:", error);
        throw error;
      }

      const emailExists = data?.checkEmail?.exists ?? false;
      console.log("📧 useCheckEmail (GraphQL): Email existe?", emailExists);

      return emailExists;
    } catch (error) {
      console.error(
        "❌ useCheckEmail (GraphQL): Erreur lors de la vérification:",
        error,
      );
      throw error;
    }
  };
}

/**
 * Hook pour vérifier si un article existe dans une catégorie
 * ✅ MIGRATED TO GRAPHQL
 */
export function useCheckArticleByNomAndCategorie() {
  const [checkProductQuery] = useCheckProductByNameAndCategoryLazyQuery();

  return async (nom: string, categorieId: string | null): Promise<boolean> => {
    if (!nom || !categorieId) return false;

    console.log(
      "🔍 useCheckArticleByNomAndCategorie (GraphQL): Vérification article:",
      { nom, categorieId },
    );

    try {
      const { data, error } = await checkProductQuery({
        variables: {
          name: nom,
          categoryId: parseInt(categorieId, 10),
        },
        fetchPolicy: "network-only",
      });

      if (error) {
        console.error(
          "❌ useCheckArticleByNomAndCategorie (GraphQL): Erreur:",
          error,
        );
        throw error;
      }

      const exists = data?.checkProductByNameAndCategory?.exists ?? false;
      console.log(
        "📦 useCheckArticleByNomAndCategorie (GraphQL): Article existe?",
        exists,
      );

      return exists;
    } catch (error) {
      console.error(
        "❌ useCheckArticleByNomAndCategorie (GraphQL): Erreur:",
        error,
      );
      throw error;
    }
  };
}

/**
 * Hook pour vérifier si un article existe par nom
 * ✅ MIGRATED TO GRAPHQL
 */
export function useCheckArticleByNom() {
  const [checkProductQuery] = useCheckProductByNameLazyQuery();

  return async (nom: string): Promise<boolean> => {
    if (!nom) return false;

    console.log(
      "🔍 useCheckArticleByNom (GraphQL): Vérification article:",
      nom,
    );

    try {
      const { data, error } = await checkProductQuery({
        variables: { name: nom },
        fetchPolicy: "network-only",
      });

      if (error) {
        console.error("❌ useCheckArticleByNom (GraphQL): Erreur:", error);
        throw error;
      }

      const exists = data?.checkProductByName?.exists ?? false;
      console.log("📦 useCheckArticleByNom (GraphQL): Article existe?", exists);

      return exists;
    } catch (error) {
      console.error("❌ useCheckArticleByNom (GraphQL): Erreur:", error);
      throw error;
    }
  };
}

/**
 * Hook pour vérifier si un cours existe déjà dans le planning
 * ✅ MIGRATED TO GRAPHQL
 */
export function useCheckCoursPlanning() {
  const [checkCourseQuery] = useCheckCourseScheduleLazyQuery();

  return async (
    jour: string,
    heure_debut: string,
    heure_fin: string,
    type_cours: string = "",
    options?: {
      excludeOriginal?: boolean;
      originalJour?: string;
      originalType?: string;
      originalHeureDebut?: string;
      originalHeureFin?: string;
    },
  ): Promise<boolean> => {
    if (!jour || !heure_debut || !heure_fin) return false;

    console.log("🔍 useCheckCoursPlanning (GraphQL): Vérification planning:", {
      jour,
      heure_debut,
      heure_fin,
      type_cours,
      options,
    });

    try {
      const { data, error } = await checkCourseQuery({
        variables: {
          input: {
            day: jour,
            startTime: heure_debut,
            endTime: heure_fin,
            courseType: type_cours || "ANY",
            excludeOriginal: options?.excludeOriginal || false,
            originalDay: options?.originalJour || null,
            originalType: options?.originalType || null,
            originalStartTime: options?.originalHeureDebut || null,
            originalEndTime: options?.originalHeureFin || null,
          },
        },
        fetchPolicy: "network-only",
      });

      if (error) {
        console.error("❌ useCheckCoursPlanning (GraphQL): Erreur:", error);
        throw error;
      }

      const exists = data?.checkCourseSchedule?.exists ?? false;
      console.log(
        "📅 useCheckCoursPlanning (GraphQL): Conflit existe?",
        exists,
      );

      if (exists && data?.checkCourseSchedule?.conflictingCourses) {
        console.log(
          "⚠️ Cours en conflit:",
          data.checkCourseSchedule.conflictingCourses,
        );
      }

      return exists;
    } catch (error) {
      console.error("❌ useCheckCoursPlanning (GraphQL): Erreur:", error);
      throw error;
    }
  };
}
