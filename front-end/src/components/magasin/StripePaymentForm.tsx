import React, { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Button,
  Alert,
  Card,
  CardBody,
  Title
} from '@patternfly/react-core';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  customerInfo: any;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  customerInfo
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Erreur lors du chargement du formulaire de paiement');
      setIsProcessing(false);
      return;
    }

    try {
      // Créer un PaymentIntent côté serveur
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe utilise les centimes
          currency: 'eur',
          customer_info: customerInfo,
        }),
      });

      const { client_secret } = await response.json();

      // Confirmer le paiement
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerInfo.prenom} ${customerInfo.nom}`,
            email: customerInfo.email,
            address: {
              line1: customerInfo.adresse,
              city: customerInfo.ville,
              postal_code: customerInfo.codePostal,
              country: customerInfo.pays === 'Belgique' ? 'BE' : 'FR',
            },
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Erreur lors du paiement');
        onError(result.error.message || 'Erreur lors du paiement');
      } else {
        onSuccess(result.paymentIntent);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du traitement du paiement');
      onError(err.message || 'Erreur lors du traitement du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'RedHatDisplay, system-ui, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <Card>
      <CardBody>
        <Title headingLevel="h3" size="md" style={{ marginBottom: '1.5rem' }}>
          Informations de paiement
        </Title>

        {error && (
          <Alert variant="danger" title="Erreur de paiement" isInline style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            padding: '1rem',
            border: '1px solid #d2d2d2',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            backgroundColor: '#fafafa'
          }}>
            <CardElement options={cardElementOptions} />
          </div>

          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            <p>💳 Cartes acceptées : Visa, Mastercard, American Express</p>
            <p>🔒 Paiement sécurisé par Stripe</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isProcessing}
            isDisabled={!stripe || isProcessing}
            style={{ width: '100%' }}
          >
            {isProcessing ? 'Traitement du paiement...' : `Payer ${amount.toFixed(2)}€`}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};

export default StripePaymentForm;
