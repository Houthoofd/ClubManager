import {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useProcessPaymentMutation,
} from "@/lib/apollo/generated/graphql";
import type {
  GetPaymentsQuery,
  GetPaymentQuery,
  CreatePaymentInput,
} from "@/lib/apollo/generated/graphql";

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
export const usePayments = (
  userId?: number,
  take?: number,
  skip?: number,
): UsePaymentsReturn => {
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
export const usePaymentById = (
  id: number | undefined,
): UsePaymentByIdReturn => {
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
  const [createPaymentMutation, { loading, error }] =
    useCreatePaymentMutation();

  const createPayment = async (
    input: CreatePaymentInput,
  ): Promise<PaymentDetail> => {
    console.log("📝 [useCreatePayment] Creating payment:", input);

    const result = await createPaymentMutation({
      variables: { input },
      refetchQueries: ["GetPayments", "GetOrders"],
    });

    if (!result.data?.createPayment) {
      throw new Error("Payment creation failed");
    }

    console.log(
      "✅ [useCreatePayment] Payment created:",
      result.data.createPayment.id,
    );

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
  const [processPaymentMutation, { loading, error }] =
    useProcessPaymentMutation();

  const processPayment = async (
    paymentId: number,
  ): Promise<ProcessPaymentResult> => {
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
      payment: processResult.payment
        ? (processResult.payment as PaymentDetail)
        : undefined,
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
export const usePaymentsByStatus = (
  status: string | undefined,
): UsePaymentsReturn => {
  const { data, loading, error, refetch } = useGetPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });

  const filteredPayments =
    data?.payments.filter((payment) => payment.status === status) ?? [];

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
export const useOrderPayments = (
  orderId: number | undefined,
): UsePaymentsReturn => {
  const { data, loading, error, refetch } = useGetPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });

  const orderPayments =
    data?.payments.filter((payment) => payment.order_id === orderId) ?? [];

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
 * Legacy alias for useProcessPayment
 * @deprecated Use useProcessPayment instead
 */
export const useProcesserPaiement = useProcessPayment;
