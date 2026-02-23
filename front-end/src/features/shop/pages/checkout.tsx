import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageSection, Stepper, Step, StepperStep, Button, Alert } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { CheckoutForm, StripePaymentForm } from "../components";
import type { CheckoutFormData } from "../components/CheckoutForm";
import { useCartItems, useCartStore } from "@/store/cartStore";
import { StripeProvider } from "@/app/providers/StripeProvider.lazy";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  // Optimisation: utiliser les hooks de convenience
  const panier = useCartItems();
  const clearCart = useCartStore((state) => state.clearCart);

  const [currentStep, setCurrentStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState<CheckoutFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const calculerTotal = () => {
    return panier.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCustomerInfoSubmit = (formData: CheckoutFormData) => {
    setCustomerInfo(formData);
    setCurrentStep(2);
    setError(null);
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsLoading(true);

      // Créer la commande côté serveur
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          customer_info: customerInfo,
          items: panier,
          total: calculerTotal(),
        }),
      });

      if (response.ok) {
        clearCart();
        setOrderSuccess(true);
        setCurrentStep(3);
      } else {
        throw new Error("Erreur lors de la création de la commande");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (panier.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page">
        <PageHeader title="Commande" subtitle="Finalisez votre achat" variant="store" />
        <PageSection>
          <Alert variant="warning" title="Panier vide">
            Votre panier est vide. Retournez au magasin pour ajouter des articles.
          </Alert>
          <Button variant="primary" onClick={() => navigate("/pages/magasin/magasin")}>
            Retour au magasin
          </Button>
        </PageSection>
      </div>
    );
  }

  return (
    <StripeProvider>
      <div className="checkout-page">
        <PageHeader
          title="Finaliser la commande"
          subtitle="Quelques étapes pour finaliser votre achat"
          variant="store"
        />

        <PageSection>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Stepper activeStep={currentStep} style={{ marginBottom: "2rem" }}>
              <Step stepNumber={1} isCurrent={currentStep === 1}>
                Informations de livraison
              </Step>
              <Step stepNumber={2} isCurrent={currentStep === 2}>
                Paiement
              </Step>
              <Step stepNumber={3} isCurrent={currentStep === 3}>
                Confirmation
              </Step>
            </Stepper>

            {currentStep === 1 && (
              <CheckoutForm
                onSubmit={handleCustomerInfoSubmit}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentStep === 2 && customerInfo && (
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <Button variant="link" onClick={() => setCurrentStep(1)} style={{ padding: 0 }}>
                    ← Retour aux informations de livraison
                  </Button>
                </div>

                <StripePaymentForm
                  amount={calculerTotal()}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  customerInfo={customerInfo}
                />
              </div>
            )}

            {currentStep === 3 && orderSuccess && (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Alert variant="success" title="Commande confirmée !" isInline>
                  Votre paiement a été traité avec succès. Vous recevrez un email de confirmation.
                </Alert>
                <div style={{ marginTop: "2rem" }}>
                  <Button variant="primary" onClick={() => navigate("/pages/magasin/magasin")}>
                    Retour au magasin
                  </Button>
                </div>
              </div>
            )}

            {error && currentStep !== 1 && (
              <Alert variant="danger" title="Erreur" isInline style={{ marginTop: "1rem" }}>
                {error}
              </Alert>
            )}
          </div>
        </PageSection>
      </div>
    </StripeProvider>
  );
};

export default CheckoutPage;
