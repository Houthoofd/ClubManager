import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageSection, Title, Alert, Spinner } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    if (paymentIntentId) {
      // Confirmer le paiement après redirection
      fetch("/api/paiements/test/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
        credentials: "include",
      }).then(() => {
        setTimeout(() => {
          navigate("/pages/magasin");
        }, 3000);
      });
    }
  }, [paymentIntentId, navigate]);

  return (
    <div>
      <PageHeader
        title="Paiement confirmé"
        subtitle="Votre commande a été traitée avec succès"
        variant="success"
      />
      <PageSection>
        <Alert variant="success" title="Paiement réussi !">
          Votre paiement a été confirmé. Redirection vers le magasin dans
          quelques secondes...
        </Alert>
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Spinner size="lg" />
        </div>
      </PageSection>
    </div>
  );
};

export default PaymentSuccessPage;
