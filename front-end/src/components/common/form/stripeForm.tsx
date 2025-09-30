import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@patternfly/react-core';

type StripeFormProps = {
  onClose: () => void;
  totalAmount?: number;
  clientSecret: string; // obligatoire ici
};

const StripeForm = ({ clientSecret, onClose, totalAmount }: StripeFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pages/magasin/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Erreur de paiement:', error);
        setPaymentStatus(`Erreur: ${error.message}`);
      } else if (paymentIntent) {
        console.log('PaymentIntent confirmé:', paymentIntent);
        
        if (paymentIntent.status === 'succeeded') {
          setPaymentStatus('Paiement réussi ! Traitement de la commande en cours...');
          
          try {
            await fetch('/api/paiements/test/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
              credentials: 'include',
            });
            
            setPaymentStatus('Paiement et commande traités avec succès !');
            setTimeout(() => onClose(), 2000);
          } catch (error) {
            console.error('Erreur lors du traitement de la commande:', error);
            setPaymentStatus('Paiement réussi, mais erreur lors du traitement de la commande');
          }
        } else if (paymentIntent.status === 'requires_action') {
          setPaymentStatus('Redirection vers votre banque...');
        } else {
          setPaymentStatus(`Statut du paiement: ${paymentIntent.status}`);
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      setPaymentStatus('Erreur inattendue lors du paiement');
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
        {paymentStatus && <div style={{ color: 'red', marginTop: '10px' }}>{paymentStatus}</div>}
      </form>
    )}
  </>
);

};

export default StripeForm;

