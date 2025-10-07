import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import {
  Button,
  Alert,
  Spinner,
  Card,
  CardBody,
  Title,
  Flex,
  FlexItem,
  Checkbox,
} from '@patternfly/react-core';
import { CreditCardIcon, ShieldAltIcon } from '@patternfly/react-icons';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  description: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  echeanceId?: string | null;
  userId?: string | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  description,
  onSuccess,
  onError,
  echeanceId,
  userId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showBillingAddress, setShowBillingAddress] = useState(false);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !acceptTerms) {
      if (!acceptTerms) {
        setMessage('Veuillez accepter les conditions générales pour continuer.');
      }
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pages/compte?tab=paiements&success=true`,
          payment_method_data: {
            billing_details: {
              name: 'Membre Club Manager',
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Erreur Stripe:', error);
        setMessage(error.message || 'Une erreur est survenue lors du paiement.');
        onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('🎉 Paiement réussi:', paymentIntent);
        setMessage('Paiement réussi ! Redirection en cours...');
        onSuccess({ paymentIntent });
      } else {
        setMessage('Le paiement nécessite une action supplémentaire.');
      }
    } catch (err: any) {
      console.error('Erreur lors du paiement:', err);
      setMessage('Une erreur inattendue est survenue.');
      onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
    business: { name: 'Club Manager' },
    fields: {
      billingDetails: {
        name: 'auto' as const,
        email: 'auto' as const,
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Résumé du paiement */}
      <Card style={{ marginBottom: '2rem', border: '2px solid #e7f3ff' }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
            <ShieldAltIcon style={{ marginRight: '8px', color: '#0570de' }} />
            Résumé du paiement
          </Title>
          
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>Description :</FlexItem>
                <FlexItem style={{ fontWeight: 'bold' }}>{description}</FlexItem>
              </Flex>
            </FlexItem>
            
            {echeanceId && (
              <FlexItem>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>Référence :</FlexItem>
                  <FlexItem style={{ fontWeight: 'bold' }}>#{echeanceId}</FlexItem>
                </Flex>
              </FlexItem>
            )}
            
            <FlexItem style={{ borderTop: '1px solid #dee2e6', paddingTop: '0.5rem' }}>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  Total à payer :
                </FlexItem>
                <FlexItem style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
                  {formatMontant(amount)}
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>

      {/* Élément de paiement Stripe */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
            💳 Informations de paiement
          </Title>
          
          <PaymentElement options={paymentElementOptions} />
        </CardBody>
      </Card>

      {/* Option pour l'adresse de facturation - OPTIONNELLE */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardBody>
          <Checkbox
            id="show-billing"
            name="showBilling"
            label="Ajouter une adresse de facturation (optionnel)"
            isChecked={showBillingAddress}
            onChange={setShowBillingAddress}
            style={{ marginBottom: showBillingAddress ? '1rem' : '0' }}
          />
          
          {showBillingAddress && (
            <div style={{ marginTop: '1rem' }}>
              <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>
                📍 Adresse de facturation
              </Title>
              
              <AddressElement 
                options={{
                  mode: 'billing',
                  fields: {
                    phone: 'never',
                  },
                }}
              />
              
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '14px', 
                color: '#6c757d' 
              }}>
                ℹ️ Cette adresse sera utilisée pour la facturation uniquement
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Conditions générales */}
      <div style={{ marginBottom: '2rem' }}>
        <Checkbox
          id="accept-terms"
          name="acceptTerms"
          label={
            <span>
              J'accepte les{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                conditions générales
              </a>{' '}
              et la{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                politique de confidentialité
              </a>
            </span>
          }
          isChecked={acceptTerms}
          onChange={setAcceptTerms}
          isRequired
        />
      </div>

      {/* Messages d'erreur/succès */}
      {message && (
        <Alert 
          variant={message.includes('réussi') ? 'success' : 'danger'} 
          title={message.includes('réussi') ? 'Succès' : 'Erreur'}
          style={{ marginBottom: '2rem' }}
        >
          {message}
        </Alert>
      )}

      {/* Bouton de paiement */}
      <Flex justifyContent={{ default: 'justifyContentCenter' }}>
        <FlexItem>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<CreditCardIcon />}
            isLoading={isLoading}
            isDisabled={!stripe || !elements || isLoading || !acceptTerms}
            style={{ 
              minWidth: '200px',
              fontSize: '16px',
              padding: '12px 24px'
            }}
          >
            {isLoading ? 'Traitement...' : `Payer ${formatMontant(amount)}`}
          </Button>
        </FlexItem>
      </Flex>

      {/* Sécurité Stripe */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1rem', 
        color: '#6c757d', 
        fontSize: '14px' 
      }}>
        <p>
          🔒 Paiement sécurisé par{' '}
          <a 
            href="https://stripe.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#635bff', textDecoration: 'none' }}
          >
            Stripe
          </a>
        </p>
      </div>
    </form>
  );
};

export default PaymentForm;
