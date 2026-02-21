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
  Form,
  FormGroup,
  TextInput,
  Checkbox
} from '@patternfly/react-core';
import { CreditCardIcon } from '@patternfly/react-icons';

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

  // AJOUTÉ: Validation de base avant de continuer
  useEffect(() => {
    if (!clientSecret) {
      console.error('❌ [PaymentForm] ClientSecret manquant');
      setMessage('❌ Erreur: Configuration de paiement invalide');
      return;
    }

    console.log('🔧 [PaymentForm] Initialisation:', {
      stripe: !!stripe,
      elements: !!elements,
      clientSecret: !!clientSecret,
      amount,
      echeanceId
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
  }, [stripe, elements, clientSecret, amount, echeanceId]);

  // CORRIGÉ: Handler pour les changements d'éléments
  const handleElementChange = (event: any) => {
    console.log('🔄 [PaymentForm] Changement élément:', event);
    setIsComplete(event.complete);
    
    if (event.error) {
      console.error('❌ [PaymentForm] Erreur dans PaymentElement:', event.error);
      setMessage(`⚠️ ${event.error.message}`);
    } else {
      setMessage('');
    }
  };

  // CORRIGÉ: Handler de soumission complet
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

    if (!customerName.trim()) {
      setMessage('⚠️ Le nom est obligatoire');
      return;
    }

    if (!customerEmail.trim()) {
      setMessage('⚠️ L\'email est obligatoire');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      setMessage('⚠️ Format d\'email invalide');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Soumission des éléments avant confirmation
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('❌ [PaymentForm] Erreur soumission:', submitError);
        setMessage(`⚠️ ${submitError.message}`);
        setIsLoading(false);
        return;
      }

      // Confirmation du paiement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/pages/paiement?success=true`,
          payment_method_data: {
            billing_details: {
              name: customerName.trim(),
              email: customerEmail.trim()
            }
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('❌ [PaymentForm] Erreur Stripe:', error);
        setMessage(`❌ ${error.message}`);
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ [PaymentForm] Paiement réussi:', paymentIntent.id);
        setMessage('✅ Paiement réussi !');
        if (onSuccess) {
          onSuccess({ paymentIntent });
        }
      } else {
        console.log('⏳ [PaymentForm] Paiement en cours...', paymentIntent?.status);
        setMessage('⏳ Paiement en cours de traitement...');
      }
    } catch (error: any) {
      console.error('❌ [PaymentForm] Erreur générale:', error);
      setMessage(`❌ Erreur de paiement: ${error.message}`);
      if (onError) onError(error);
    }

    setIsLoading(false);
  };

  // CRITIQUE: Vérifications avant rendu
  if (!clientSecret) {
    return (
      <Alert variant="danger" title="Erreur de configuration">
        <p>❌ Configuration de paiement manquante</p>
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
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <Form onSubmit={handleSubmit}>
        {/* AJOUTÉ: Affichage du montant si disponible */}
        {amount && amount > 0 && (
          <Alert variant="info" title="Montant à payer" isInline style={{ marginBottom: '1rem' }}>
            <strong>{amount.toFixed(2)} €</strong>
            {description && <div style={{ marginTop: '0.5rem' }}>{description}</div>}
          </Alert>
        )}

        {/* Informations client */}
        <FormGroup label="Nom complet *" fieldId="customer-name" isRequired>
          <TextInput
            id="customer-name"
            value={customerName}
            onChange={(_event, value) => setCustomerName(value)}
            placeholder="Votre nom complet"
            isRequired
          />
        </FormGroup>

        <FormGroup label="Email *" fieldId="customer-email" isRequired>
          <TextInput
            id="customer-email"
            type="email"
            value={customerEmail}
            onChange={(_event, value) => setCustomerEmail(value)}
            placeholder="votre@email.com"
            isRequired
          />
        </FormGroup>

        {/* CORRIGÉ: PaymentElement avec configuration ultra-basique */}
        <FormGroup label="Informations de paiement *" fieldId="payment-element" isRequired>
          <div style={{
            padding: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff'
          }}>
            <PaymentElement
              id="payment-element"
              onChange={handleElementChange}
              // AUCUNE option - configuration par défaut uniquement
            />
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
                <strong>{amount && amount > 0 ? `${amount.toFixed(2)} €` : 'ce montant'}</strong>
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
            isDisabled={
              isLoading || 
              !acceptTerms || 
              !customerName.trim() || 
              !customerEmail.trim() ||
              !stripe ||
              !elements
            }
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
                Payer {amount && amount > 0 ? `${amount.toFixed(2)} €` : 'maintenant'}
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
