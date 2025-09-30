import React from 'react';
import { Radio, Stack, Button, Title, Alert } from '@patternfly/react-core';
import { CreditCardIcon, PaypalIcon, BitcoinIcon } from '@patternfly/react-icons';
import StripeForm from './stripeForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCreerPaiement } from '../../../hooks/usePaiements';
import { apiUrl } from '../../../pages/apiUrl';
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
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('bancontact');
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [stripeOptions, setStripeOptions] = React.useState<any | null>(null);

  // Utilisation du hook usePaiements
  const creerPaiement = useCreerPaiement();

  console.log('Commande reçue dans PaymentForm:', commande);
  console.log('Total amount:', totalAmount);

  const onPayement = async () => {
    // Modifier la condition pour être plus spécifique
    if (!paymentMethod) {
      alert('Veuillez sélectionner une méthode de paiement.');
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      alert('Le montant du panier est invalide.');
      return;
    }

    // Vérifier que nous avons un utilisateur_id
    if (!commande.utilisateur_id) {
      alert('Erreur: utilisateur non identifié. Veuillez vous reconnecter.');
      return;
    }

    // Debug - Afficher les valeurs pour diagnostiquer
    console.log('PaymentMethod:', paymentMethod);
    console.log('TotalAmount:', totalAmount);
    console.log('Commande:', commande);

    const amountInCents = totalAmount * 100;

    try {
      // ✅ 1. Créer le paiement avec le hook
      let paiementData: any;

      switch (paymentMethod) {
        case 'bancontact':
          paiementData = {
            amount: amountInCents,
            currency: 'eur',
            payment_method: 'bancontact',
            commande: commande,
            utilisateur_id: commande.utilisateur_id // S'assurer que l'utilisateur_id est inclus
          };
          break;
        case 'paypal':
          paiementData = {
            totalAmount: amountInCents,
            payment_method: 'paypal',
            userId: commande.utilisateur_id,
            commande: commande,
            utilisateur_id: commande.utilisateur_id
          };
          break;
        case 'bitcoin':
          paiementData = {
            sats: amountInCents / 100000000,
            payment_method: 'bitcoin',
            commande: commande,
            utilisateur_id: commande.utilisateur_id
          };
          break;
        default:
          alert('Méthode de paiement non reconnue.');
          return;
      }

      console.log('Données de paiement à envoyer:', paiementData);

      // Utiliser le hook pour créer le paiement
      const response = await creerPaiement.mutateAsync(paiementData);
      console.log('Réponse du serveur :', response);

      if (response.clientSecret) {
        setClientSecret(response.clientSecret);
        setStripeOptions({
          clientSecret: response.clientSecret,
          appearance: { theme: 'stripe' },
        });
      } else if (response.url) {
        window.location.href = response.url;
      } else {
        console.error("Réponse inattendue du serveur :", response);
        alert("Aucune information de paiement reçue.");
      }
    } catch (error: any) {
      console.error('Erreur lors du paiement :', error);
      alert(`Erreur lors du paiement : ${error.message}`);
    }
  };

  console.log(clientSecret)

  const handlePaymentMethodChange = (method: PaymentMethod) => {
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

      {/* Affichage des erreurs du hook */}
      {creerPaiement.isError && (
        <Alert 
          variant="danger" 
          title="Erreur de paiement" 
          isInline 
          style={{ marginBottom: '20px' }}
        >
          {creerPaiement.error?.message || 'Erreur lors du traitement du paiement'}
        </Alert>
      )}

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
          onClick={onPayement}
          isLoading={creerPaiement.isPending}
          isDisabled={creerPaiement.isPending}
        >
          {creerPaiement.isPending ? 'Traitement...' : 'Payer'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;
