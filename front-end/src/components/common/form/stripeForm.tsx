import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@patternfly/react-core';

type StripeFormProps = {
  onClose: () => void;
  totalAmount?: number;
  clientSecret: string; // obligatoire ici
};

const StripeForm = ({ totalAmount, clientSecret }: StripeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  console.log("stripeForm rendered")
  console.log(clientSecret)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // Étape 1 : submit les éléments pour valider le formulaire
    const submitResult = await elements.submit();
    if (submitResult.error) {
      setMessage(submitResult.error.message || 'Erreur lors de la validation du formulaire.');
      setIsProcessing(false);
      return;
    }

    // Étape 2 : confirmer le paiement
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret, // clé secrète venant du serveur
      confirmParams: {
        return_url: window.location.origin + '/success',
      },
    });

    if (error) {
      setMessage(error.message || 'Erreur lors du paiement.');
    }

    setIsProcessing(false);
  };


  return (
  <>
    {totalAmount !== undefined && (
      <div style={{ marginBottom: 20, fontWeight: 'bold', fontSize: 18 }}>
        Montant à payer : {totalAmount.toFixed(2)} €
      </div>
    )}

    {/* Ne pas afficher tant que le clientSecret n'est pas prêt */}
    {clientSecret && (
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <PaymentElement />
        <Button
          type="submit"
          isDisabled={isProcessing || !stripe || !elements}
          variant="primary"
          style={{ marginTop: 20 }}
        >
          {isProcessing ? 'Traitement...' : 'Payer'}
        </Button>
        {message && <div style={{ color: 'red', marginTop: '10px' }}>{message}</div>}
      </form>
    )}
  </>
);

};

export default StripeForm;

