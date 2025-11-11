import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  CardElement
} from '@stripe/react-stripe-js';
import {
  Button,
  Alert,
  Spinner,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  TextInput,
  Checkbox
} from '@patternfly/react-core';
import { CreditCardIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';

interface PaymentFormProps {
  clientSecret: string;
  amount?: number;
  description?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
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

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [usePaymentElement, setUsePaymentElement] = useState(true);

  // AJOUTÉ: Debug du client secret et des éléments Stripe
  useEffect(() => {
    console.log('🔧 [PaymentForm] Initialisation:', {
      stripe: !!stripe,
      elements: !!elements,
      clientSecret: !!clientSecret,
      clientSecretPrefix: clientSecret?.substring(0, 15) + '...',
      amount,
      description,
      echeanceId,
      commandeId,
      userId
    });

    // Récupérer les infos utilisateur depuis localStorage
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        if (parsedData.email) setCustomerEmail(parsedData.email);
        if (parsedData.first_name && parsedData.last_name) {
          setCustomerName(`${parsedData.first_name} ${parsedData.last_name}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ [PaymentForm] Erreur récupération userData:', error);
    }
  }, [stripe, elements, clientSecret]);

  // AJOUTÉ: Vérifier si PaymentElement est disponible
  useEffect(() => {
    if (elements) {
      try {
        // Tester si PaymentElement est supporté
        const testElement = elements.create('payment');
        if (testElement) {
          console.log('✅ [PaymentForm] PaymentElement supporté');
          setUsePaymentElement(true);
        }
      } catch (error) {
        console.warn('⚠️ [PaymentForm] PaymentElement non supporté, utilisation de CardElement:', error);
        setUsePaymentElement(false);
      }
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('❌ [PaymentForm] Stripe non initialisé');
      setMessage('❌ Erreur: Système de paiement non initialisé');
      return;
    }

    if (!acceptTerms) {
      setMessage('⚠️ Veuillez accepter les conditions générales');
      return;
    }

    setIsLoading(true);
    setMessage('');

    console.log('🚀 [PaymentForm] Début du processus de paiement...');

    try {
      let result;

      if (usePaymentElement) {
        // MÉTHODE 1: Utiliser PaymentElement (recommandé)
        console.log('💳 [PaymentForm] Confirmation avec PaymentElement...');
        
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl || `${window.location.origin}/pages/paiement?success=true`,
            payment_method_data: {
              billing_details: {
                name: customerName || 'Client',
                email: customerEmail || undefined
              }
            }
          },
          redirect: 'if_required' // IMPORTANT: Éviter la redirection automatique
        });

        console.log('📊 [PaymentForm] Résultat PaymentElement:', result);

      } else {
        // MÉTHODE 2: Utiliser CardElement (fallback)
        console.log('💳 [PaymentForm] Confirmation avec CardElement...');
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Élément de carte non trouvé');
        }

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName || 'Client',
              email: customerEmail || undefined
            }
          }
        });

        console.log('📊 [PaymentForm] Résultat CardElement:', result);
      }

      if (result.error) {
        console.error('❌ [PaymentForm] Erreur Stripe:', result.error);
        
        let errorMessage = result.error.message || 'Erreur de paiement inconnue';
        
        // Messages d'erreur personnalisés
        if (result.error.code === 'card_declined') {
          errorMessage = '❌ Carte refusée. Vérifiez vos informations ou utilisez une autre carte.';
        } else if (result.error.code === 'insufficient_funds') {
          errorMessage = '❌ Fonds insuffisants sur votre carte.';
        } else if (result.error.code === 'incorrect_cvc') {
          errorMessage = '❌ Code de sécurité (CVC) incorrect.';
        } else if (result.error.code === 'expired_card') {
          errorMessage = '❌ Votre carte a expiré.';
        }
        
        setMessage(errorMessage);
        
        if (onError) {
          onError(result.error);
        }
      } else {
        console.log('✅ [PaymentForm] Paiement réussi:', result.paymentIntent);
        
        setMessage('✅ Paiement réussi !');
        
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error: any) {
      console.error('❌ [PaymentForm] Erreur générale:', error);
      const errorMessage = `❌ Erreur de paiement: ${error.message}`;
      setMessage(errorMessage);
      
      if (onError) {
        onError(error);
      }
    }

    setIsLoading(false);
  };

  // AJOUTÉ: Handler pour les changements d'éléments
  const handleElementChange = (event: any) => {
    console.log('🔄 [PaymentForm] Changement élément:', event);
    setIsComplete(event.complete);
    if (event.error) {
      setMessage(`⚠️ ${event.error.message}`);
    } else {
      setMessage('');
    }
  };

  // Vérifications préliminaires
  if (!clientSecret) {
    return (
      <Alert variant="danger" title="Erreur de configuration">
        <p>❌ Client secret manquant. Impossible d'initialiser le paiement.</p>
      </Alert>
    );
  }

  if (!stripe || !elements) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="lg" />
        <div style={{ marginTop: '1rem' }}>
          🔄 Chargement du système de paiement sécurisé...
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
          Initialisation de Stripe Elements...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* DEBUG VISIBLE */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '1rem',
        fontSize: '14px'
      }}>
        <strong>🔧 Debug PaymentForm:</strong>
        <br />
        <strong>Stripe:</strong> {stripe ? '✅ Chargé' : '❌ Non chargé'}
        <br />
        <strong>Elements:</strong> {elements ? '✅ Chargé' : '❌ Non chargé'}
        <br />
        <strong>Client Secret:</strong> {clientSecret ? '✅ Présent' : '❌ Manquant'}
        <br />
        <strong>Type d'élément:</strong> {usePaymentElement ? 'PaymentElement' : 'CardElement'}
        <br />
        <strong>Montant:</strong> {amount ? `${amount} €` : 'Non spécifié'}
      </div>

      <Form onSubmit={handleSubmit}>
        {/* Informations client */}
        <FormGroup label="Nom complet" fieldId="customer-name">
          <TextInput
            id="customer-name"
            value={customerName}
            onChange={(_event, value) => setCustomerName(value)}
            placeholder="Votre nom complet"
          />
        </FormGroup>

        <FormGroup label="Email" fieldId="customer-email">
          <TextInput
            id="customer-email"
            type="email"
            value={customerEmail}
            onChange={(_event, value) => setCustomerEmail(value)}
            placeholder="votre@email.com"
          />
        </FormGroup>

        {/* Élément de paiement Stripe */}
        <FormGroup label="Informations de paiement" fieldId="payment-element">
          <div style={{
            padding: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff'
          }}>
            {usePaymentElement ? (
              <PaymentElement
                id="payment-element"
                onChange={handleElementChange}
                options={{
                  layout: 'tabs',
                  defaultValues: {
                    billingDetails: {
                      name: customerName,
                      email: customerEmail
                    }
                  }
                }}
              />
            ) : (
              <CardElement
                id="card-element"
                onChange={handleElementChange}
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            )}
          </div>
        </FormGroup>

        {/* Message d'erreur/succès */}
        {message && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert
              variant={message.includes('✅') ? 'success' : message.includes('⚠️') ? 'warning' : 'danger'}
              title={message.includes('✅') ? 'Succès' : message.includes('⚠️') ? 'Attention' : 'Erreur'}
              isInline
            >
              {message}
            </Alert>
          </div>
        )}

        {/* Conditions générales */}
        <FormGroup fieldId="accept-terms">
          <Checkbox
            id="accept-terms"
            isChecked={acceptTerms}
            onChange={(_event, checked) => setAcceptTerms(checked)}
            label={
              <span>
                J'accepte les{' '}
                <a href="/conditions" target="_blank" rel="noopener noreferrer">
                  conditions générales
                </a>{' '}
                et autorise le prélèvement de{' '}
                <strong>{amount ? `${amount} €` : 'ce montant'}</strong>
              </span>
            }
          />
        </FormGroup>

        {/* Bouton de paiement */}
        <div style={{ marginTop: '2rem' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isBlock
            isDisabled={isLoading || !acceptTerms || (!isComplete && usePaymentElement)}
            icon={isLoading ? <Spinner size="sm" /> : <CreditCardIcon />}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" style={{ marginRight: '8px' }} />
                Traitement en cours...
              </>
            ) : (
              <>
                <CreditCardIcon style={{ marginRight: '8px' }} />
                Payer {amount ? `${amount} €` : 'maintenant'}
              </>
            )}
          </Button>
        </div>

        {/* Informations de sécurité */}
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#0c5460' }}>
            🔒 <strong>Paiement 100% sécurisé</strong><br />
            Vos données sont protégées par le cryptage SSL de Stripe.<br />
            Aucune information bancaire n'est stockée sur nos serveurs.
          </p>
        </div>
      </Form>
    </div>
  );
};

export default PaymentForm;
