import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js';
import {
  Button,
  Alert,
  Spinner,
  Card,
  CardBody,
  Title,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { CreditCardIcon, ExclamationTriangleIcon, InfoCircleIcon } from '@patternfly/react-icons';

interface PaymentFormProps {
  clientSecret: string;
  amount?: number;
  description?: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  echeanceId?: string;
  commandeId?: string;
  userId?: string;
  returnUrl?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  description,
  onSuccess,
  onError,
  echeanceId,
  commandeId,
  userId,
  returnUrl
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      setMessage('Configuration de paiement manquante');
      return;
    }

    // Vérifier le statut du PaymentIntent
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage('Paiement réussi !');
            onSuccess({ paymentIntent });
            break;
          case 'processing':
            setMessage('Paiement en cours de traitement...');
            break;
          case 'requires_payment_method':
            setMessage('Prêt pour le paiement');
            setIsLoaded(true);
            break;
          default:
            setMessage('Une erreur est survenue');
            break;
        }
      } else {
        setMessage('Configuration de paiement invalide');
      }
    });
  }, [stripe, clientSecret, onSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setMessage('Stripe n\'est pas encore chargé. Veuillez patienter.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/pages/paiement/success`,
          payment_method_data: {
            billing_details: {
              name: 'Client Club Manager',
            },
          },
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ [PaymentForm] Erreur Stripe:', error);
        
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(`Erreur: ${error.message}`);
        } else {
          setMessage('Erreur inattendue lors du paiement.');
        }
        
        onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ [PaymentForm] Paiement réussi:', paymentIntent.id);
        setMessage('Paiement réussi !');
        onSuccess({ paymentIntent });
      } else {
        console.log('⏳ [PaymentForm] Paiement en attente:', paymentIntent?.status);
        setMessage('Paiement en cours de vérification...');
      }
    } catch (error: any) {
      console.error('❌ [PaymentForm] Erreur lors du traitement:', error);
      setMessage('Erreur lors du traitement du paiement.');
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Affichage pendant le chargement de Stripe
  if (!stripe || !elements) {
    return (
      <Card>
        <CardBody>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <div style={{ marginTop: '1rem' }}>
              Chargement du formulaire de paiement sécurisé...
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
              Initialisation de Stripe en cours
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Affichage si le clientSecret n'est pas disponible
  if (!clientSecret) {
    return (
      <Card>
        <CardBody>
          <Alert variant="danger" title="Erreur de configuration">
            <p>La configuration de paiement n'est pas disponible.</p>
            <p>Veuillez rafraîchir la page ou contacter le support.</p>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div style={{ marginBottom: '1.5rem' }}>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: '0.5rem' }}>
            <CreditCardIcon style={{ marginRight: '0.5rem' }} />
            Informations de paiement
          </Title>
          
          {amount && (
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Montant à payer : {formatAmount(amount)}
                </div>
              </FlexItem>
            </Flex>
          )}
          
          {description && (
            <div style={{ color: '#666', marginTop: '0.5rem' }}>
              {description}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Élément de paiement Stripe */}
          <div style={{ marginBottom: '1.5rem' }}>
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'bancontact', 'sepa_debit']
              }}
            />
          </div>

          {/* Adresse de facturation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Title headingLevel="h4" size="md" style={{ marginBottom: '0.5rem' }}>
              Adresse de facturation
            </Title>
            <AddressElement 
              options={{
                mode: 'billing',
                allowedCountries: ['FR', 'BE', 'CH', 'LU']
              }}
            />
          </div>

          {/* Messages d'erreur ou d'information */}
          {message && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert 
                variant={message.includes('Erreur') || message.includes('erreur') ? 'danger' : 'info'}
                title={message.includes('Erreur') || message.includes('erreur') ? 'Erreur' : 'Information'}
                isInline
              >
                {message}
              </Alert>
            </div>
          )}

          {/* Informations de sécurité */}
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px'
          }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <InfoCircleIcon style={{ color: '#0ea5e9' }} />
              </FlexItem>
              <FlexItem>
                <div style={{ fontSize: '14px', color: '#0369a1' }}>
                  <strong>Paiement 100% sécurisé</strong> - Vos données sont protégées par le chiffrement SSL et Stripe
                </div>
              </FlexItem>
            </Flex>
          </div>

          {/* Bouton de paiement */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isDisabled={!stripe || !isLoaded || isProcessing}
            isLoading={isProcessing}
            style={{ 
              width: '100%',
              padding: '1rem',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" style={{ marginRight: '0.5rem' }} />
                Traitement en cours...
              </>
            ) : (
              <>
                <CreditCardIcon style={{ marginRight: '0.5rem' }} />
                Payer {formatAmount(amount)}
              </>
            )}
          </Button>

          {/* Informations légales */}
          <div style={{ 
            marginTop: '1rem',
            padding: '0.75rem',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
            borderTop: '1px solid #e5e7eb'
          }}>
            En cliquant sur "Payer", vous acceptez nos conditions générales de vente.
            <br />
            Aucune donnée de carte bancaire n'est stockée sur nos serveurs.
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default PaymentForm;
