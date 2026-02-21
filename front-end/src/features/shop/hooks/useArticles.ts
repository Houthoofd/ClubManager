import {
  useGetProductsQuery,
  useGetProductQuery,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetProductsQuery,
  GetProductQuery,
  GetProductsQueryVariables,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Product = NonNullable<GetProductsQuery["products"]>[number];
type ProductDetail = NonNullable<GetProductQuery["product"]>;

type UseProductsReturn = {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseProductByIdReturn = {
  product: ProductDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all products with optional pagination
 *
 * @param take - Number of products to fetch
 * @param skip - Number of products to skip
 * @returns Products list with loading state
 *
 * @example
 * ```tsx
 * const { products, isLoading } = useProducts(10, 0);
 * ```
 */
export const useProducts = (
  take?: number,
  skip?: number,
): UseProductsReturn => {
  const variables: GetProductsQueryVariables = {};

  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetProductsQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    products: data?.products ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch a single product by ID
 *
 * @param id - Product ID
 * @returns Product details with loading state
 *
 * @example
 * ```tsx
 * const { product, isLoading } = useProductById(123);
 * ```
 */
export const useProductById = (
  id: number | undefined,
): UseProductByIdReturn => {
  const { data, loading, error, refetch } = useGetProductQuery({
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    product: data?.product ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch products by category
 *
 * @param categoryId - Category ID
 * @returns Filtered products
 *
 * @example
 * ```tsx
 * const { products, isLoading } = useProductsByCategory(5);
 * ```
 */
export const useProductsByCategory = (
  categoryId: number | undefined,
): UseProductsReturn => {
  const { data, loading, error, refetch } = useGetProductsQuery({
    fetchPolicy: "cache-and-network",
  });

  // Filter products by category on client side
  const filteredProducts =
    data?.products.filter(
      (product: Product) => product.category_id === categoryId,
    ) ?? [];

  return {
    products: categoryId ? filteredProducts : (data?.products ?? []),
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};
