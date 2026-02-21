import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  PageSection,
  Alert,
  Card,
  CardBody,
  Title,
  Spinner,
  Button,
  Modal,
  ModalVariant,
  Flex,
  FlexItem,
  Divider,
} from "@patternfly/react-core";
import { CheckCircleIcon, ExclamationCircleIcon, LockIcon } from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useAuthStore } from "@/core/store/authStore";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useCreatePaymentIntentForOrderMutation,
  useConfirmOrderPaymentMutation,
  useGetOrderQuery,
} from "@/core/api/graphql/generated/graphql";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface PaymentFormProps {
  amount: number;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

/**
 * Payment Form Component
 * Handles the Stripe payment element and submission
 */
const PaymentForm = ({ amount, orderId, onSuccess, onError }: PaymentFormProps) => {
  const { t } = useTypedTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pages/paiement/success?orderId=${orderId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || t("payment.error.paymentFailed"));
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(error?.message || t("payment.error.generic"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        variant="primary"
        isBlock
        isDisabled={!stripe || processing}
        isLoading={processing}
        style={{ marginTop: "1.5rem" }}
      >
        {processing
          ? t("payment.form.submitting")
          : t("payment.form.submit", { amount: `${amount.toFixed(2)}€` })}
      </Button>
    </form>
  );
};

/**
 * PaymentPage Component
 *
 * Secure payment page with Stripe integration
 *
 * @architecture
 * - GraphQL: useCreatePaymentIntentForOrderMutation, useConfirmOrderPaymentMutation, useGetOrderQuery
 * - Zustand: authStore (user), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: payment.*
 * - External: Stripe Elements
 *
 * Features:
 * - Secure payment processing with Stripe
 * - User verification (order ownership)
 * - Payment confirmation
 * - Success/error handling
 * - Redirect after payment
 */
const PaymentPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useTracking();

  // Zustand stores
  const user = useAuthStore((state) => state.user);
  const addNotification = useUiStore((state) => state.addNotification);

  // URL parameters
  const orderId = searchParams.get("orderId");
  const echeanceId = searchParams.get("echeanceId");

  // Local state
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // GraphQL queries
  const {
    data: orderData,
    loading: loadingOrder,
    error: orderError,
  } = useGetOrderQuery({
    variables: { id: Number(orderId) },
    skip: !orderId,
    fetchPolicy: "network-only",
  });

  // GraphQL mutations
  const [createPaymentIntent] = useCreatePaymentIntentForOrderMutation();
  const [confirmPayment] = useConfirmOrderPaymentMutation();

  /**
   * Verify user has access to this order
   */
  useEffect(() => {
    if (!orderId || !user?.id) {
      setSecurityError(t("payment.security.unauthorized"));
      setShowSecurityModal(true);
      setLoading(false);
      return;
    }

    // Check if order belongs to user (unless admin)
    if (orderData?.order) {
      const order = orderData.order;
      const orderUserId = (order as any).utilisateur_id;

      if (orderUserId && orderUserId !== user.id && user.status !== "admin") {
        setSecurityError(t("payment.security.userMismatch"));
        setShowSecurityModal(true);
        setLoading(false);

        trackEvent("payment_access_denied", {
          orderId,
          userId: user.id,
          orderUserId,
        });
        return;
      }
    }
  }, [orderId, user, orderData, t, trackEvent]);

  /**
   * Create payment intent
   */
  useEffect(() => {
    const createIntent = async () => {
      if (!orderId || showSecurityModal) {
        return;
      }

      try {
        setLoading(true);

        const result = await createPaymentIntent({
          variables: {
            input: {
              commande: Number(orderId),
              currency: "eur",
              description: `Commande #${orderId}`,
            },
          },
        });

        const intent = result.data?.createPaymentIntentForOrder;
        if (intent?.clientSecret) {
          setClientSecret(intent.clientSecret);

          trackEvent("payment_intent_created", {
            orderId,
            amount: intent.amount,
          });
        } else {
          throw new Error("No client secret returned");
        }
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        setPaymentError(error?.message || t("payment.error.generic"));

        trackEvent("payment_intent_failed", {
          orderId,
          error: error?.message || "unknown",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!clientSecret && !paymentSuccess && !paymentError && !loadingOrder) {
      createIntent();
    }
  }, [orderId, clientSecret, paymentSuccess, paymentError, showSecurityModal, loadingOrder]);

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const amount = (orderData?.order as any)?.total || 0;

      await confirmPayment({
        variables: {
          input: {
            paymentIntentId,
            commandeId: Number(orderId),
            userId: user?.id || 0,
            amount,
          },
        },
      });

      setPaymentSuccess(true);

      addNotification({
        type: "success",
        message: t("payment.success.message", { amount: `${amount.toFixed(2)}€` }),
      });

      trackEvent("payment_succeeded", {
        orderId,
        paymentIntentId,
        amount,
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/pages/commandes");
      }, 3000);
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      setPaymentError(error?.message || t("payment.error.generic"));

      trackEvent("payment_confirmation_failed", {
        orderId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (error: string) => {
    setPaymentError(error);

    addNotification({
      type: "error",
      message: error,
    });

    trackEvent("payment_failed", {
      orderId,
      error,
    });
  };

  /**
   * Format amount
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const order = orderData?.order;
  const amount = (order as any)?.total || 0;

  // Security modal
  if (showSecurityModal) {
    return (
      <div>
        <PageHeader title={t("payment.title")} subtitle={t("payment.security.unauthorized")} />
        <PageSection>
          <Modal
            variant={ModalVariant.small}
            title={t("payment.security.unauthorized")}
            isOpen={showSecurityModal}
            onClose={() => navigate("/pages/commandes")}
            actions={[
              <Button key="back" variant="primary" onClick={() => navigate("/pages/commandes")}>
                {t("payment.security.backToOrders")}
              </Button>,
            ]}
          >
            <Alert variant="danger" isInline title={t("payment.security.userMismatch")}>
              <p>{securityError}</p>
            </Alert>
          </Modal>
        </PageSection>
      </div>
    );
  }

  // Loading state
  if (loading || loadingOrder) {
    return (
      <div>
        <PageHeader title={t("payment.title")} subtitle={t("payment.loading")} />
        <PageSection>
          <Flex justifyContent={{ default: "justifyContentCenter" }} style={{ padding: "3rem" }}>
            <FlexItem>
              <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }}>
                <FlexItem>
                  <Spinner size="xl" />
                </FlexItem>
                <FlexItem style={{ marginTop: "1rem" }}>
                  <Title headingLevel="h3" size="lg">
                    {t("payment.stripe.loading")}
                  </Title>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (orderError || !order) {
    return (
      <div>
        <PageHeader title={t("payment.title")} subtitle={t("payment.error.title")} />
        <PageSection>
          <Alert variant="danger" title={t("payment.stripe.error")}>
            <p>{orderError?.message || t("payment.error.generic")}</p>
            <Button
              variant="primary"
              onClick={() => navigate("/pages/commandes")}
              style={{ marginTop: "1rem" }}
            >
              {t("payment.security.backToOrders")}
            </Button>
          </Alert>
        </PageSection>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div>
        <PageHeader title={t("payment.success.title")} subtitle={t("payment.success.receiptSent")} />
        <PageSection>
          <Flex justifyContent={{ default: "justifyContentCenter" }}>
            <FlexItem style={{ maxWidth: "600px", width: "100%" }}>
              <Card isRounded>
                <CardBody>
                  <Flex
                    direction={{ default: "column" }}
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsLg" }}
                  >
                    <FlexItem>
                      <CheckCircleIcon
                        size="xl"
                        color="green"
                        style={{ fontSize: "64px" }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h2" size="2xl">
                        {t("payment.success.title")}
                      </Title>
                    </FlexItem>
                    <FlexItem style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                        {t("payment.success.message", { amount: formatAmount(amount) })}
                      </p>
                      <p style={{ color: "#6a6e73" }}>
                        {t("payment.success.orderNumber", { number: orderId })}
                      </p>
                    </FlexItem>
                    <Divider />
                    <FlexItem>
                      <p style={{ color: "#6a6e73" }}>{t("payment.success.receiptSent")}</p>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: "spaceItemsSm" }}>
                        <FlexItem>
                          <Button variant="primary" onClick={() => navigate("/pages/magasin")}>
                            {t("payment.success.backToShop")}
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="secondary" onClick={() => navigate("/pages/commandes")}>
                            {t("payment.success.viewOrders")}
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          </Flex>
        </PageSection>
      </div>
    );
  }

  // Payment error state
  if (paymentError) {
    return (
      <div>
        <PageHeader title={t("payment.error.title")} subtitle={t("payment.error.message")} />
        <PageSection>
          <Flex justifyContent={{ default: "justifyContentCenter" }}>
            <FlexItem style={{ maxWidth: "600px", width: "100%" }}>
              <Card isRounded>
                <CardBody>
                  <Flex
                    direction={{ default: "column" }}
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsLg" }}
                  >
                    <FlexItem>
                      <ExclamationCircleIcon
                        size="xl"
                        color="red"
                        style={{ fontSize: "64px" }}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h2" size="2xl">
                        {t("payment.error.title")}
                      </Title>
                    </FlexItem>
                    <FlexItem style={{ textAlign: "center" }}>
                      <Alert variant="danger" isInline title={t("payment.error.paymentFailed")}>
                        <p>{paymentError}</p>
                      </Alert>
                    </FlexItem>
                    <FlexItem>
                      <Flex spaceItems={{ default: "spaceItemsSm" }}>
                        <FlexItem>
                          <Button variant="primary" onClick={() => window.location.reload()}>
                            {t("payment.error.tryAgain")}
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button variant="secondary" onClick={() => navigate("/pages/commandes")}>
                            {t("payment.security.backToOrders")}
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          </Flex>
        </PageSection>
      </div>
    );
  }

  // Payment form
  return (
    <div>
      <PageHeader
        title={t("payment.title")}
        subtitle={t("payment.subtitle")}
      />

      <PageSection>
        <Flex justifyContent={{ default: "justifyContentCenter" }}>
          <FlexItem style={{ maxWidth: "600px", width: "100%" }}>
            <Card isRounded>
              <CardBody>
                <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsLg" }}>
                  {/* Order details */}
                  <FlexItem>
                    <Flex
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <FlexItem>
                        <Title headingLevel="h3" size="lg">
                          {t("payment.details.orderId")}: #{orderId}
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <LockIcon style={{ marginRight: "0.5rem", color: "green" }} />
                        <span style={{ color: "#6a6e73", fontSize: "0.875rem" }}>
                          Paiement sécurisé
                        </span>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Divider />
                  </FlexItem>

                  {/* Amount */}
                  <FlexItem>
                    <Flex
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <FlexItem>
                        <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                          {t("payment.details.total")}
                        </span>
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h2" size="2xl">
                          {formatAmount(amount)}
                        </Title>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Divider />
                  </FlexItem>

                  {/* Stripe payment form */}
                  {clientSecret && (
                    <FlexItem>
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: "stripe",
                          },
                          locale: "fr",
                        }}
                      >
                        <PaymentForm
                          amount={amount}
                          orderId={orderId || ""}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </FlexItem>
                  )}
                </Flex>
              </CardBody>
            </Card>
          </FlexItem>
        </Flex>
      </PageSection>
    </div>
  );
};

// Export with HOCs: Auth, Tracking, Error boundary
export default withAuth(withTracking(withErrorBoundary(PaymentPage), "PaymentPage"));
