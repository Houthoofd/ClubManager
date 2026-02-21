import { useMemo } from "react";
import {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetOrdersQuery,
  GetOrderQuery,
  CreateOrderInput,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

type Order = NonNullable<GetOrdersQuery["orders"]>[number];
type OrderDetail = NonNullable<GetOrderQuery["order"]>;

type UseOrdersReturn = {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseOrderByIdReturn = {
  order: OrderDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseCreateOrderReturn = {
  createOrder: (input: CreateOrderInput) => Promise<OrderDetail>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseUpdateOrderStatusReturn = {
  updateStatus: (orderId: number, status: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all orders with optional filters
 *
 * @param userId - Filter by user ID (optional)
 * @param take - Number of orders to fetch
 * @param skip - Number of orders to skip
 * @returns Orders list with loading state
 *
 * @example
 * ```tsx
 * const { orders, isLoading } = useOrders(undefined, 10, 0);
 * ```
 */
export const useOrders = (userId?: number, take?: number, skip?: number): UseOrdersReturn => {
  const variables: { userId?: number; take?: number; skip?: number } = {};

  if (userId !== undefined) variables.userId = userId;
  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetOrdersQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    orders: data?.orders ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch orders for a specific user
 *
 * @param userId - User ID
 * @param take - Number of orders to fetch
 * @param skip - Number of orders to skip
 * @returns User's orders with loading state
 *
 * @example
 * ```tsx
 * const { orders, isLoading } = useUserOrders(123, 10, 0);
 * ```
 */
export const useUserOrders = (
  userId: number | undefined,
  take?: number,
  skip?: number,
): UseOrdersReturn => {
  const { data, loading, error, refetch } = useGetOrdersQuery({
    variables: { userId: userId!, take, skip },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  return {
    orders: data?.orders ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch a single order by ID
 *
 * @param id - Order ID
 * @returns Order details with loading state
 *
 * @example
 * ```tsx
 * const { order, isLoading } = useOrderById(123);
 * ```
 */
export const useOrderById = (id: number | undefined): UseOrderByIdReturn => {
  const { data, loading, error, refetch } = useGetOrderQuery({
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    order: data?.order ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to create a new order
 *
 * @returns Create function with loading state
 *
 * @example
 * ```tsx
 * const { createOrder, isLoading, success } = useCreateOrder();
 *
 * const order = await createOrder({
 *   user_id: 123,
 *   items: [
 *     { product_id: 1, stock_id: 5, quantity: 2, price: 29.99 },
 *     { product_id: 3, stock_id: null, quantity: 1, price: 49.99 }
 *   ],
 *   delivery_address: '123 Main St, City',
 *   notes: 'Please deliver after 5pm'
 * });
 * ```
 */
export const useCreateOrder = (): UseCreateOrderReturn => {
  const [createOrderMutation, { loading, error }] = useCreateOrderMutation();

  const createOrder = async (input: CreateOrderInput): Promise<OrderDetail> => {
    console.log("📝 [useCreateOrder] Creating order:", input);

    const result = await createOrderMutation({
      variables: { input },
      refetchQueries: ["GetOrders", "GetPayments"],
    });

    if (!result.data?.createOrder) {
      throw new Error("Order creation failed");
    }

    console.log("✅ [useCreateOrder] Order created:", result.data.createOrder.id);

    return result.data.createOrder as OrderDetail;
  };

  return {
    createOrder,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to update order status
 *
 * @returns Update status function with loading state
 *
 * @example
 * ```tsx
 * const { updateStatus, isLoading } = useUpdateOrderStatus();
 *
 * await updateStatus(123, 'shipped');
 * ```
 */
export const useUpdateOrderStatus = (): UseUpdateOrderStatusReturn => {
  const [updateOrderStatusMutation, { loading, error }] = useUpdateOrderStatusMutation();

  const updateStatus = async (orderId: number, status: string): Promise<void> => {
    console.log("📝 [useUpdateOrderStatus] Updating order status:", {
      orderId,
      status,
    });

    const result = await updateOrderStatusMutation({
      variables: { orderId, status },
      refetchQueries: ["GetOrders", "GetOrder"],
    });

    if (!result.data?.updateOrderStatus) {
      throw new Error("Order status update failed");
    }

    console.log("✅ [useUpdateOrderStatus] Status updated:", result.data.updateOrderStatus.id);
  };

  return {
    updateStatus,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to get orders by status
 *
 * @param status - Order status filter
 * @returns Filtered orders
 *
 * @example
 * ```tsx
 * const { orders, isLoading } = useOrdersByStatus('pending');
 * ```
 */
export const useOrdersByStatus = (status: string | undefined): UseOrdersReturn => {
  const { data, loading, error, refetch } = useGetOrdersQuery({
    fetchPolicy: "cache-and-network",
  });

  const filteredOrders = data?.orders.filter((order: Order) => order.status === status) ?? [];

  return {
    orders: status ? filteredOrders : (data?.orders ?? []),
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to get pending orders
 *
 * @returns Pending orders
 *
 * @example
 * ```tsx
 * const { orders, isLoading } = usePendingOrders();
 * ```
 */
export const usePendingOrders = (): UseOrdersReturn => {
  return useOrdersByStatus("pending");
};

/**
 * Hook to get completed orders
 *
 * @returns Completed orders
 *
 * @example
 * ```tsx
 * const { orders, isLoading } = useCompletedOrders();
 * ```
 */
export const useCompletedOrders = (): UseOrdersReturn => {
  return useOrdersByStatus("completed");
};

/**
 * Legacy alias for useOrders
 * @deprecated Use useOrders instead
 */
export const useCommandes = useOrders;

/**
 * Legacy alias for useOrderById
 * @deprecated Use useOrderById instead
 */
export const useCommandeById = useOrderById;

/**
 * Legacy alias for useUserOrders
 * @deprecated Use useUserOrders instead
 */
export const useCommandesUtilisateur = useUserOrders;

/**
 * Legacy alias for useCreateOrder
 * @deprecated Use useCreateOrder instead
 */
export const useCreerCommande = useCreateOrder;

/**
 * Legacy alias for useUpdateOrderStatus
 * @deprecated Use useUpdateOrderStatus instead
 */
export const useModifierStatutCommande = useUpdateOrderStatus;

/**
 * Legacy alias for useUpdateOrderStatus
 * @deprecated Use useUpdateOrderStatus instead
 */
export const useUpdateCommandeStatut = useUpdateOrderStatus;

/**
 * Hook to get order statistics (calculated client-side)
 *
 * @returns Order statistics with loading state
 *
 * @example
 * ```tsx
 * const { totalOrders, completedOrders, totalRevenue, isLoading } = useCommandesStats();
 * ```
 */
export const useCommandesStats = () => {
  const { orders, isLoading } = useOrders();

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const completedOrders = orders.filter((o) => o.status === "completed").length;
    const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue,
    };
  }, [orders]);

  return {
    ...stats,
    isLoading,
    error: null,
  };
};
