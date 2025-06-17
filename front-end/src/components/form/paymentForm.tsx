import React from 'react';
import { Radio, Stack, Button, Title } from '@patternfly/react-core';
import { CreditCardIcon, PaypalIcon, BitcoinIcon } from '@patternfly/react-icons';
import StripeForm from './stripeForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Commande } from '@clubmanager/types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);




// Composant pour le formulaire PayPal
const PayPalForm = () => (
  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
    <h3>Formulaire PayPal</h3>
    <p>Formulaire spécifique pour PayPal</p>
    {/* Ajoutez ici le contenu spécifique pour PayPal */}
  </div>
);

// Composant pour le formulaire Bitcoin
const BitcoinForm = () => (
  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
    <h3>Formulaire Bitcoin</h3>
    <p>Formulaire spécifique pour Bitcoin</p>
    {/* Ajoutez ici le contenu spécifique pour Bitcoin */}
  </div>
);


type PaymentFormProps = {
  totalAmount: number;
  onClose: () => void;
  commande: Commande;
};

type PaymentMethod = 'bancontact' | 'paypal' | 'bitcoin';

const PaymentForm = ({ totalAmount, onClose, commande }: PaymentFormProps) => {
  const [paymentMethod, setPaymentMethod] = React.useState('bancontact');
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [stripeOptions, setStripeOptions] = React.useState<any | null>(null);


  console.log(totalAmount)

  const paymentEndpoints = {
    bancontact: 'http://localhost:3000/paiements/bancontact',
    paypal: 'http://localhost:3000/paiements/paypal',
    bitcoin: 'http://localhost:3000/paiements/bitcoin',
  };


  const onPayement = async () => {
    if (!paymentMethod || !totalAmount) {
      alert('Veuillez sélectionner une méthode de paiement et entrer un montant.');
      return;
    }

    const amountInCents = totalAmount * 100;

    let body: any;

    switch (paymentMethod) {
      case 'bancontact':
        body = { amount: amountInCents, currency: 'eur' };
        break;
      case 'paypal':
        body = { totalAmount: amountInCents, userId: commande };
        break;
      case 'bitcoin':
        body = { sats: amountInCents / 100000000 };
        break;
      default:
        alert('Méthode de paiement non reconnue.');
        return;
    }

    const endpoint = paymentEndpoints[paymentMethod];

    try {
      // ✅ 1. Envoyer la commande (contenant déjà userId)
      const commandeResponse = await fetch('http://localhost:3000/magasin/commandes/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commande),
      });

      if (!commandeResponse.ok) {
        throw new Error("Échec lors de l'enregistrement de la commande");
      }

      // ✅ 2. Effectuer le paiement
      const paiementResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await paiementResponse.json();
      console.log('Réponse du serveur :', data);

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStripeOptions({
          clientSecret: data.clientSecret,
          appearance: { theme: 'stripe' },
        });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Réponse inattendue du serveur :", data);
        alert("Aucune information de paiement reçue.");
      }
    } catch (error) {
      console.error('Erreur lors du paiement :', error);
      alert('Erreur lors du paiement.');
    }
  };


  console.log(clientSecret)



  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: 'auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Title headingLevel="h2" style={{ marginBottom: '30px', textAlign: 'center', color: '#333' }}>
        Choisissez votre moyen de paiement
      </Title>

      <Stack hasGutter>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'bancontact'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('bancontact')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <CreditCardIcon style={{ marginRight: '15px', color: '#0066cc' }} />
                Bancontact
              </div>
            }
            id="bancontact"
          />
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'paypal'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('paypal')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <PaypalIcon style={{ marginRight: '15px', color: '#009cde' }} />
                PayPal
              </div>
            }
            id="paypal"
          />
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'bitcoin'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('bitcoin')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <BitcoinIcon style={{ marginRight: '15px', color: '#f7931a' }} />
                Bitcoin
              </div>
            }
            id="bitcoin"
          />
        </div>
      </Stack>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        {paymentMethod === 'bancontact' && clientSecret && stripeOptions && (
  <Elements stripe={stripePromise} options={stripeOptions}>
    <StripeForm clientSecret={clientSecret} onClose={onClose} totalAmount={totalAmount} />
  </Elements>
)}
        {paymentMethod === 'paypal' && <PayPalForm />}
        {paymentMethod === 'bitcoin' && <BitcoinForm />}

        <Button
          variant="primary"
          style={{
            padding: '12px 24px',
            backgroundColor: '#0066cc',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginTop: '20px'
          }}
          onClick={() => onPayement()}
        >
          Payer
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;
