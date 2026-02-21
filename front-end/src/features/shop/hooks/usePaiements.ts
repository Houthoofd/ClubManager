import {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useProcessPaymentMutation,
  useCreatePaymentIntentForOrderMutation,
  useConfirmOrderPaymentMutation,
} from "@/core/api/apollo/generated/graphql";
import type {
  GetPaymentsQuery,
  GetPaymentQuery,
  CreatePaymentInput,
  CreatePaymentIntentForOrderInput,
  ConfirmOrderPaymentInput,
} from "@/core/api/apollo/generated/graphql";
import { useAuthStore } from "@/store/authStore";

// ============================================================================
// Types
// ============================================================================

type Payment = NonNullable<GetPaymentsQuery["payments"]>[number];
type PaymentDetail = NonNullable<GetPaymentQuery["payment"]>;

type UsePaymentsReturn = {
  payments: Payment[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UsePaymentByIdReturn = {
  payment: PaymentDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

type UseCreatePaymentReturn = {
  createPayment: (input: CreatePaymentInput) => Promise<PaymentDetail>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type UseProcessPaymentReturn = {
  processPayment: (paymentId: number) => Promise<ProcessPaymentResult>;
  isLoading: boolean;
  error: Error | null;
  success: boolean;
};

type ProcessPaymentResult = {
  success: boolean;
  message: string;
  payment?: PaymentDetail;
  clientSecret?: string;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch all payments with optional filters
 *
 * @param userId - Filter by user ID (optional)
 * @param take - Number of payments to fetch
 * @param skip - Number of payments to skip
 * @returns Payments list with loading state
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = usePayments(undefined, 10, 0);
 * ```
 */
export const usePayments = (userId?: number, take?: number, skip?: number): UsePaymentsReturn => {
  const variables: { userId?: number; take?: number; skip?: number } = {};

  if (userId !== undefined) variables.userId = userId;
  if (take !== undefined) variables.take = take;
  if (skip !== undefined) variables.skip = skip;

  const { data, loading, error, refetch } = useGetPaymentsQuery({
    variables,
    fetchPolicy: "cache-and-network",
  });

  return {
    payments: data?.payments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch payments for a specific user
 *
 * @param userId - User ID
 * @param take - Number of payments to fetch
 * @param skip - Number of payments to skip
 * @returns User's payments with loading state
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = useUserPayments(123, 10, 0);
 * ```
 */
export const useUserPayments = (
  userId: number | undefined,
  take?: number,
  skip?: number,
): UsePaymentsReturn => {
  const { data, loading, error, refetch } = useGetPaymentsQuery({
    variables: { userId: userId!, take, skip },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  return {
    payments: data?.payments ?? [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to fetch a single payment by ID
 *
 * @param id - Payment ID
 * @returns Payment details with loading state
 *
 * @example
 * ```tsx
 * const { payment, isLoading } = usePaymentById(123);
 * ```
 */
export const usePaymentById = (id: number | undefined): UsePaymentByIdReturn => {
  const { data, loading, error, refetch } = useGetPaymentQuery({
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    payment: data?.payment ?? null,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to create a new payment
 *
 * @returns Create function with loading state
 *
 * @example
 * ```tsx
 * const { createPayment, isLoading, success } = useCreatePayment();
 *
 * const payment = await createPayment({
 *   user_id: 123,
 *   order_id: 456,
 *   amount: 99.99,
 *   payment_method: 'stripe',
 *   stripe_payment_intent_id: 'pi_xxxxx'
 * });
 * ```
 */
export const useCreatePayment = (): UseCreatePaymentReturn => {
  const [createPaymentMutation, { loading, error }] = useCreatePaymentMutation();

  const createPayment = async (input: CreatePaymentInput): Promise<PaymentDetail> => {
    console.log("📝 [useCreatePayment] Creating payment:", input);

    const result = await createPaymentMutation({
      variables: { input },
      refetchQueries: ["GetPayments", "GetOrders"],
    });

    if (!result.data?.createPayment) {
      throw new Error("Payment creation failed");
    }

    console.log("✅ [useCreatePayment] Payment created:", result.data.createPayment.id);

    return result.data.createPayment as PaymentDetail;
  };

  return {
    createPayment,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to process a payment (e.g., with Stripe)
 *
 * @returns Process function with loading state
 *
 * @example
 * ```tsx
 * const { processPayment, isLoading } = useProcessPayment();
 *
 * const result = await processPayment(123);
 * if (result.success) {
 *   console.log('Payment processed!');
 *   if (result.clientSecret) {
 *     // Use clientSecret with Stripe
 *   }
 * }
 * ```
 */
export const useProcessPayment = (): UseProcessPaymentReturn => {
  const [processPaymentMutation, { loading, error }] = useProcessPaymentMutation();

  const processPayment = async (paymentId: number): Promise<ProcessPaymentResult> => {
    console.log("💳 [useProcessPayment] Processing payment:", paymentId);

    const result = await processPaymentMutation({
      variables: { paymentId },
      refetchQueries: ["GetPayments", "GetPayment", "GetOrders"],
    });

    if (!result.data?.processPayment) {
      throw new Error("Payment processing failed");
    }

    const processResult = result.data.processPayment;

    console.log("✅ [useProcessPayment] Payment processed:", {
      success: processResult.success,
      hasClientSecret: !!processResult.clientSecret,
    });

    return {
      success: processResult.success,
      message: processResult.message || "",
      payment: processResult.payment ? (processResult.payment as PaymentDetail) : undefined,
      clientSecret: processResult.clientSecret || undefined,
    };
  };

  return {
    processPayment,
    isLoading: loading,
    error: error ?? null,
    success: !loading && !error,
  };
};

/**
 * Hook to get payments by status
 *
 * @param status - Payment status filter
 * @returns Filtered payments
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = usePaymentsByStatus('completed');
 * ```
 */
export const usePaymentsByStatus = (status: string | undefined): UsePaymentsReturn => {
  const { data, loading, error, refetch } = useGetPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });

  const filteredPayments =
    data?.payments.filter((payment: Payment) => payment.status === status) ?? [];

  return {
    payments: status ? filteredPayments : (data?.payments ?? []),
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to get pending payments
 *
 * @returns Pending payments
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = usePendingPayments();
 * ```
 */
export const usePendingPayments = (): UsePaymentsReturn => {
  return usePaymentsByStatus("pending");
};

/**
 * Hook to get completed payments
 *
 * @returns Completed payments
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = useCompletedPayments();
 * ```
 */
export const useCompletedPayments = (): UsePaymentsReturn => {
  return usePaymentsByStatus("completed");
};

/**
 * Hook to get failed payments
 *
 * @returns Failed payments
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = useFailedPayments();
 * ```
 */
export const useFailedPayments = (): UsePaymentsReturn => {
  return usePaymentsByStatus("failed");
};

/**
 * Hook to get payments for an order
 *
 * @param orderId - Order ID
 * @returns Payments for the order
 *
 * @example
 * ```tsx
 * const { payments, isLoading } = useOrderPayments(456);
 * ```
 */
export const useOrderPayments = (orderId: number | undefined): UsePaymentsReturn => {
  const { data, loading, error, refetch } = useGetPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });

  const orderPayments =
    data?.payments.filter((payment: Payment) => payment.order_id === orderId) ?? [];

  return {
    payments: orderId ? orderPayments : [],
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
};

/**
 * Hook to calculate total payments for a user
 *
 * @param userId - User ID
 * @returns Total amount and count
 *
 * @example
 * ```tsx
 * const { total, count, isLoading } = useUserPaymentsTotal(123);
 * ```
 */
export const useUserPaymentsTotal = (
  userId: number | undefined,
): {
  total: number;
  count: number;
  isLoading: boolean;
} => {
  const { payments, isLoading } = useUserPayments(userId);

  const total = payments.reduce((sum, payment) => {
    if (payment.status === "completed") {
      return sum + (payment.amount || 0);
    }
    return sum;
  }, 0);

  return {
    total,
    count: payments.length,
    isLoading,
  };
};

/**
 * Legacy alias for usePayments
 * @deprecated Use usePayments instead
 */
export const usePaiements = usePayments;

/**
 * Legacy alias for useUserPayments
 * @deprecated Use useUserPayments instead
 */
export const usePaiementsUtilisateur = useUserPayments;

/**
 * Legacy alias for usePaymentById
 * @deprecated Use usePaymentById instead
 */
export const usePaiementById = usePaymentById;

/**
 * Legacy alias for useCreatePayment
 * @deprecated Use useCreatePayment instead
 */
export const useCreerPaiement = useCreatePayment;

/**
 * @deprecated Use useProcessPayment instead
 */
export const useProcesserPaiement = useProcessPayment;

// ============================================================================
// Payment Due / Échéance Hooks
// ============================================================================

/**
 * Hook to get payment due details
 *
 * WORKAROUND: Uses payment details until proper "échéance" schema is added
 *
 * @param echeanceId - Payment/Due ID
 * @returns Payment due details with loading state
 *
 * @example
 * ```tsx
 * const { echeance, isLoading } = useEcheanceDetails(123);
 * ```
 */
export const useEcheanceDetails = (echeanceId?: number) => {
  // WORKAROUND: Use payment query as "échéance" details
  const { payment, isLoading, error } = usePaymentById(echeanceId);

  console.log("📋 [useEcheanceDetails] Payment due details (workaround):", {
    echeanceId,
    found: !!payment,
  });

  return {
    echeance: payment,
    isLoading,
    error,
  };
};

/**
 * Hook to create a secure payment intent for an order
 *
 * @returns Create intent function with loading state
 *
 * @example
 * ```tsx
 * const { createIntent, isLoading } = useCreatePaymentIntentSecurise();
 *
 * const result = await createIntent(99.99, 123, 456);
 * if (result.success) {
 *   // Use clientSecret with Stripe
 *   stripe.confirmCardPayment(result.clientSecret);
 * }
 * ```
 */
export const useCreatePaymentIntentSecurise = () => {
  const [createPaymentIntentMutation, { loading, error }] =
    useCreatePaymentIntentForOrderMutation();

  const createIntent = async (
    amount: number,
    userId: number,
    orderId: number,
  ): Promise<{
    success: boolean;
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    message: string;
  }> => {
    console.log("💳 [useCreatePaymentIntentSecurise] Creating payment intent:", {
      amount,
      userId,
      orderId,
    });

    const input: CreatePaymentIntentForOrderInput = {
      userId,
      amount,
      orderId,
    };

    const result = await createPaymentIntentMutation({
      variables: { input },
    });

    if (!result.data?.createPaymentIntentForOrder) {
      throw new Error("Payment intent creation failed");
    }

    const intentResult = result.data.createPaymentIntentForOrder;

    console.log("✅ [useCreatePaymentIntentSecurise] Payment intent created:", {
      success: intentResult.success,
      paymentIntentId: intentResult.paymentIntentId,
    });

    return {
      success: intentResult.success,
      clientSecret: intentResult.clientSecret || "",
      paymentIntentId: intentResult.paymentIntentId || "",
      amount: intentResult.amount || amount,
      message: intentResult.message || "",
    };
  };

  return {
    createIntent,
    isLoading: loading,
    error: error ?? null,
  };
};

/**
 * Hook to confirm a payment after Stripe authorization
 *
 * @returns Confirm payment function with loading state
 *
 * @example
 * ```tsx
 * const { confirmPayment, isLoading } = useConfirmPayment();
 *
 * const result = await confirmPayment({
 *   orderId: 456,
 *   paymentIntentId: 'pi_xxxxx',
 *   paymentMethod: 'card',
 *   userId: 123
 * });
 *
 * if (result.success) {
 *   console.log('Payment confirmed!', result.payment);
 * }
 * ```
 */
export const useConfirmPayment = () => {
  const [confirmOrderPaymentMutation, { loading, error }] = useConfirmOrderPaymentMutation();

  const confirmPayment = async (input: ConfirmOrderPaymentInput) => {
    console.log("💳 [useConfirmPayment] Confirming payment:", {
      orderId: input.orderId,
      paymentIntentId: input.paymentIntentId,
    });

    const result = await confirmOrderPaymentMutation({
      variables: { input },
      refetchQueries: ["GetPayments", "GetOrders", "GetPayment", "GetOrder"],
    });

    if (!result.data?.confirmOrderPayment) {
      throw new Error("Payment confirmation failed");
    }

    const confirmResult = result.data.confirmOrderPayment;

    console.log("✅ [useConfirmPayment] Payment confirmed:", {
      success: confirmResult.success,
      paymentId: confirmResult.payment?.id,
    });

    return {
      success: confirmResult.success,
      message: confirmResult.message || "",
      payment: confirmResult.payment,
      order: confirmResult.order,
      paymentId: confirmResult.payment?.id || null,
    };
  };

  return {
    confirmPayment,
    isLoading: loading,
    error: error ?? null,
  };
};

/**
 * Helper to get current user ID from Zustand auth store
 *
 * @returns User ID or null if not authenticated
 *
 * @example
 * ```tsx
 * const userId = obtenirIdUtilisateur();
 * if (userId) {
 *   // User is authenticated
 * }
 * ```
 */
export const obtenirIdUtilisateur = (): number | null => {
  return useAuthStore.getState().getUserId();
};

/**
 * Hook to get payment dues (echeances) by user ID
 *
 * WORKAROUND: Uses pending payments as "échéances" until proper schema is added
 *
 * @param userId - User ID
 * @returns Payment dues (pending payments) with loading state
 *
 * @example
 * ```tsx
 * const { echeances, isLoading } = useEcheancesByUserId(123);
 * ```
 */
export const useEcheancesByUserId = (userId?: number) => {
  const { payments, isLoading, error, refetch } = useUserPayments(userId);

  // WORKAROUND: Filter pending/unpaid payments as "échéances"
  const echeances = payments.filter(
    (payment) => payment.status === "pending" || payment.status === "unpaid",
  );

  console.log("📋 [useEcheancesByUserId] Payment dues (workaround):", {
    userId,
    totalPayments: payments.length,
    pendingCount: echeances.length,
  });

  return {
    echeances,
    isLoading,
    error,
    refetch,
  };
};
