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
  Form,
  FormGroup,
  Card,
  CardBody,
  Title,
  Flex,
  FlexItem,
  Checkbox,
  Badge,
  Progress,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import { CreditCardIcon, ShieldAltIcon, CheckCircleIcon, ExclamationTriangleIcon, InProgressIcon } from '@patternfly/react-icons';

// NOUVEAU: Types pour le statut de paiement
type PaymentStatus = 
  | 'idle' 
  | 'validating' 
  | 'processing' 
  | 'redirecting' 
  | 'confirming' 
  | 'succeeded' 
  | 'failed';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  description?: string;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
  echeanceId: string;
  userId: string;
  returnUrl?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  description,
  onSuccess,
  onError,
  echeanceId,
  userId,
  returnUrl // AJOUTÉ
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showBillingAddress, setShowBillingAddress] = useState(false);
  
  // NOUVEAU: État du statut de paiement
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);

  // NOUVEAU: Fonction pour mettre à jour le statut
  const updatePaymentStatus = (status: PaymentStatus, message: string, progress: number = 0) => {
    setPaymentStatus(status);
    setStatusMessage(message);
    setProgressValue(progress);
    console.log(`📊 [PaymentForm] Statut: ${status} - ${message} (${progress}%)`);
  };

  // NOUVEAU: Composant de statut visuel
  const PaymentStatusIndicator = () => {
    const getStatusColor = (status: PaymentStatus) => {
      switch (status) {
        case 'idle': return 'blue';
        case 'validating': return 'cyan';
        case 'processing': return 'purple';
        case 'redirecting': return 'orange';
        case 'confirming': return 'blue';
        case 'succeeded': return 'green';
        case 'failed': return 'red';
        default: return 'grey';
      }
    };

    const getStatusIcon = (status: PaymentStatus) => {
      switch (status) {
        case 'succeeded': return <CheckCircleIcon style={{ color: '#28a745' }} />;
        case 'failed': return <ExclamationTriangleIcon style={{ color: '#dc3545' }} />;
        case 'idle': return <CreditCardIcon style={{ color: '#0570de' }} />;
        default: return <InProgressIcon style={{ color: '#6f42c1' }} />;
      }
    };

    const isActive = paymentStatus !== 'idle';

    if (!isActive) return null;

    return (
      <Card style={{ marginBottom: '1rem', border: `2px solid ${getStatusColor(paymentStatus) === 'green' ? '#28a745' : '#6f42c1'}` }}>
        <CardBody>
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              {getStatusIcon(paymentStatus)}
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                <Badge variant="outline" color={getStatusColor(paymentStatus)}>
                  {paymentStatus.toUpperCase()}
                </Badge>
                <span style={{ marginLeft: '0.5rem' }}>{statusMessage}</span>
              </div>
              {(paymentStatus === 'processing' || paymentStatus === 'validating' || paymentStatus === 'confirming') && (
                <Progress 
                  value={progressValue} 
                  measureLocation={ProgressMeasureLocation.outside}
                  variant={paymentStatus === 'succeeded' ? 'success' : undefined}
                />
              )}
            </FlexItem>
            {(paymentStatus === 'processing' || paymentStatus === 'validating' || paymentStatus === 'confirming') && (
              <FlexItem>
                <Spinner size="md" />
              </FlexItem>
            )}
          </Flex>
        </CardBody>
      </Card>
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe n\'est pas encore chargé. Veuillez patienter.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // NOUVEAU: Phase 1 - Validation
      updatePaymentStatus('validating', 'Validation des informations de paiement...', 10);

      console.log('🚀 [PaymentForm] Début du processus de paiement:', {
        echeanceId,
        userId,
        amount,
        clientSecret: clientSecret.substring(0, 20) + '...'
      });

      // Simulation d'un délai pour montrer la validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // NOUVEAU: Phase 2 - Traitement
      updatePaymentStatus('processing', 'Traitement du paiement en cours...', 30);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/pages/compte?tab=paiements&success=true`,
          payment_method_data: {
            billing_details: {
              name: 'Membre du club',
            },
          },
        },
        redirect: 'if_required',
      });

      // NOUVEAU: Phase 3 - Analyse du résultat
      updatePaymentStatus('confirming', 'Confirmation du paiement...', 70);

      console.log('📊 [PaymentForm] Résultat confirmPayment:', {
        error,
        paymentIntent: paymentIntent ? {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount
        } : null
      });

      if (error) {
        // NOUVEAU: Statut d'échec
        updatePaymentStatus('failed', `Échec du paiement: ${error.message}`, 0);
        
        console.error('❌ [PaymentForm] Erreur confirmation:', error);
        
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message || 'Erreur de paiement');
        } else {
          setErrorMessage('Une erreur inattendue s\'est produite.');
        }
        
        onError(error);
      } else if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            // NOUVEAU: Statut de succès
            updatePaymentStatus('succeeded', 'Paiement réussi ! Redirection en cours...', 100);
            console.log('✅ [PaymentForm] Paiement réussi immédiatement');
            
            // Délai pour montrer le succès
            setTimeout(() => {
              onSuccess({ paymentIntent });
            }, 1500);
            break;
          
          case 'processing':
            // NOUVEAU: Statut de traitement
            updatePaymentStatus('processing', 'Paiement en cours de traitement...', 80);
            console.log('⏳ [PaymentForm] Paiement en cours de traitement');
            setErrorMessage('Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.');
            break;
          
          case 'requires_payment_method':
            // NOUVEAU: Statut d'échec - méthode requise
            updatePaymentStatus('failed', 'Méthode de paiement requise', 0);
            console.log('❌ [PaymentForm] Paiement nécessite une autre méthode');
            setErrorMessage('Le paiement a échoué. Veuillez réessayer avec une autre méthode de paiement.');
            onError({ type: 'payment_method_required', message: 'Méthode de paiement requise' });
            break;
          
          case 'requires_action':
            // NOUVEAU: Statut de redirection
            updatePaymentStatus('redirecting', 'Redirection vers votre banque...', 50);
            console.log('🔄 [PaymentForm] Action requise - redirection en cours');
            break;
          
          default:
            // NOUVEAU: Statut inconnu
            updatePaymentStatus('failed', `Statut inattendu: ${paymentIntent.status}`, 0);
            console.log('⚠️ [PaymentForm] Statut de paiement inattendu:', paymentIntent.status);
            setErrorMessage(`Statut de paiement: ${paymentIntent.status}`);
        }
      } else {
        // NOUVEAU: Redirection en cours
        updatePaymentStatus('redirecting', 'Redirection en cours pour finaliser le paiement...', 60);
        console.log('🔄 [PaymentForm] Redirection en cours pour action de paiement (ex: Bancontact)');
      }
    } catch (unexpectedError: any) {
      // NOUVEAU: Erreur inattendue
      updatePaymentStatus('failed', 'Erreur inattendue lors du paiement', 0);
      console.error('❌ [PaymentForm] Erreur inattendue:', unexpectedError);
      setErrorMessage('Une erreur inattendue s\'est produite.');
      onError(unexpectedError);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* NOUVEAU: Indicateur de statut de paiement */}
      <PaymentStatusIndicator />

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
                  {formatAmount(amount)}
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
          
          <PaymentElement options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'bancontact'],
          }} />
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
      {errorMessage && (
        <Alert 
          variant="danger" 
          title="Erreur de paiement" 
          style={{ marginBottom: '1rem' }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* MODIFIÉ: Bouton de paiement avec statut */}
      <Flex justifyContent={{ default: 'justifyContentCenter' }}>
        <FlexItem>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={paymentStatus === 'succeeded' ? <CheckCircleIcon /> : <CreditCardIcon />}
            isLoading={isProcessing}
            isDisabled={!stripe || !elements || isProcessing || !acceptTerms}
            style={{ 
              minWidth: '200px',
              fontSize: '16px',
              padding: '12px 24px',
              backgroundColor: paymentStatus === 'succeeded' ? '#28a745' : undefined
            }}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" style={{ marginRight: '8px' }} />
                {statusMessage || 'Traitement en cours...'}
              </>
            ) : paymentStatus === 'succeeded' ? (
              'Paiement réussi ✅'
            ) : (
              `Payer ${formatAmount(amount)}`
            )}
          </Button>
        </FlexItem>
      </Flex>

      {/* NOUVEAU: Statut détaillé en bas */}
      {paymentStatus !== 'idle' && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: paymentStatus === 'succeeded' ? '#d4edda' : paymentStatus === 'failed' ? '#f8d7da' : '#e7f3ff',
          borderRadius: '8px',
          border: `1px solid ${paymentStatus === 'succeeded' ? '#c3e6cb' : paymentStatus === 'failed' ? '#f5c6cb' : '#bee5eb'}`,
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {paymentStatus === 'succeeded' && '🎉 Paiement réussi !'}
            {paymentStatus === 'failed' && '❌ Paiement échoué'}
            {paymentStatus === 'processing' && '⏳ Traitement en cours'}
            {paymentStatus === 'redirecting' && '🔄 Redirection en cours'}
            {paymentStatus === 'validating' && '🔍 Validation en cours'}
            {paymentStatus === 'confirming' && '✅ Confirmation en cours'}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            {statusMessage}
          </div>
        </div>
      )}

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
    </Form>
  );
};

export default PaymentForm;
