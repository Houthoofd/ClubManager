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
  const [customerAddress, setCustomerAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    postal_code: '',
    country: 'BE' // Défaut Belgique
  });
  const [usePaymentElement, setUsePaymentElement] = useState(true);

  // AJOUTÉ: Debug du client secret et des éléments Stripe
  useEffect(() => {
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
  }, [stripe, elements, clientSecret]);

  // CORRIGÉ: Configuration PaymentElement avec adresse complète
  useEffect(() => {
    if (elements) {
      try {
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

  // AJOUTÉ: Handler pour les changements d'adresse avec validation du code postal
  const handleAddressChange = (field: string, value: string) => {
    // CORRIGÉ: S'assurer que le code postal est toujours une chaîne de caractères
    if (field === 'postal_code') {
      // Nettoyer et formater le code postal
      const cleanedPostalCode = value.toString().trim();
      console.log('🏠 [PaymentForm] Code postal saisi:', { original: value, cleaned: cleanedPostalCode });
      
      setCustomerAddress(prev => ({
        ...prev,
        [field]: cleanedPostalCode
      }));
    } else {
      setCustomerAddress(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // AJOUTÉ: Validation spécifique du code postal belge
  const validatePostalCode = (postalCode: string, country: string): boolean => {
    if (!postalCode) return false;
    
    const cleanCode = postalCode.toString().trim();
    
    switch (country) {
      case 'BE': // Belgique: 4 chiffres (1000-9999)
        return /^\d{4}$/.test(cleanCode) && parseInt(cleanCode) >= 1000 && parseInt(cleanCode) <= 9999;
      case 'FR': // France: 5 chiffres
        return /^\d{5}$/.test(cleanCode);
      case 'NL': // Pays-Bas: 4 chiffres + 2 lettres (1234 AB)
        return /^\d{4}\s?[A-Z]{2}$/i.test(cleanCode);
      case 'DE': // Allemagne: 5 chiffres
        return /^\d{5}$/.test(cleanCode);
      case 'LU': // Luxembourg: 4 chiffres
        return /^\d{4}$/.test(cleanCode);
      default:
        return cleanCode.length >= 4; // Minimum 4 caractères pour les autres pays
    }
  };

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

    // CORRIGÉ: Validation renforcée de l'adresse avec code postal spécifique
    if (!customerAddress.postal_code) {
      setMessage('⚠️ Le code postal est obligatoire');
      return;
    }

    // AJOUTÉ: Validation spécifique du format du code postal
    if (!validatePostalCode(customerAddress.postal_code, customerAddress.country)) {
      const countryFormats = {
        'BE': '4 chiffres (ex: 1400)',
        'FR': '5 chiffres (ex: 75001)',
        'NL': '4 chiffres + 2 lettres (ex: 1234 AB)',
        'DE': '5 chiffres (ex: 10115)',
        'LU': '4 chiffres (ex: 1234)'
      };
      
      const expectedFormat = countryFormats[customerAddress.country as keyof typeof countryFormats] || 'au moins 4 caractères';
      setMessage(`⚠️ Format de code postal incorrect pour ${customerAddress.country}. Format attendu: ${expectedFormat}`);
      return;
    }

    if (!customerAddress.city) {
      setMessage('⚠️ La ville est obligatoire');
      return;
    }

    if (!customerAddress.line1) {
      setMessage('⚠️ L\'adresse (rue et numéro) est obligatoire');
      return;
    }

    setIsLoading(true);
    setMessage('');

    console.log('🚀 [PaymentForm] Début du processus de paiement...');
    console.log('🏠 [PaymentForm] Adresse validée:', {
      line1: customerAddress.line1,
      city: customerAddress.city,
      postal_code: customerAddress.postal_code,
      country: customerAddress.country,
      postalCodeValid: validatePostalCode(customerAddress.postal_code, customerAddress.country)
    });

    try {
      let result;

      // CORRIGÉ: Préparation de l'adresse avec code postal en string
      const billingAddress = {
        line1: customerAddress.line1.trim(),
        line2: customerAddress.line2?.trim() || undefined,
        city: customerAddress.city.trim(),
        postal_code: customerAddress.postal_code.toString().trim(), // IMPORTANT: Forcer en string
        country: customerAddress.country,
        state: undefined // Pas de state pour l'Europe
      };

      console.log('📋 [PaymentForm] Adresse de facturation préparée:', billingAddress);

      if (usePaymentElement) {
        // CORRIGÉ: PaymentElement avec adresse de facturation strictement formatée
        console.log('💳 [PaymentForm] Confirmation avec PaymentElement...');
        
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl || `${window.location.origin}/pages/paiement?success=true`,
            payment_method_data: {
              billing_details: {
                name: customerName.trim() || 'Client',
                email: customerEmail.trim() || undefined,
                address: billingAddress
              }
            }
          },
          redirect: 'if_required'
        });

        console.log('📊 [PaymentForm] Résultat PaymentElement:', result);

      } else {
        // CORRIGÉ: CardElement avec adresse de facturation strictement formatée
        console.log('💳 [PaymentForm] Confirmation avec CardElement...');
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Élément de carte non trouvé');
        }

        result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName.trim() || 'Client',
              email: customerEmail.trim() || undefined,
              address: billingAddress
            }
          }
        });

        console.log('📊 [PaymentForm] Résultat CardElement:', result);
      }

      if (result.error) {
        console.error('❌ [PaymentForm] Erreur Stripe:', result.error);
        
        let errorMessage = result.error.message || 'Erreur de paiement inconnue';
        
        // CORRIGÉ: Messages d'erreur spécifiques pour les codes postaux
        if (result.error.code === 'incomplete_zip' || 
            result.error.message?.includes('postcode is onvolledig') ||
            result.error.message?.includes('postcode') ||
            result.error.message?.includes('postal')) {
          errorMessage = `❌ Code postal incomplet ou invalide. Pour la Belgique, utilisez un code à 4 chiffres (comme 1400). Code actuel: "${customerAddress.postal_code}"`;
        } else if (result.error.code === 'invalid_zip') {
          errorMessage = `❌ Code postal invalide. Format attendu pour ${customerAddress.country}: ${validatePostalCode(customerAddress.postal_code, customerAddress.country) ? 'valide' : 'invalide'}`;
        } else if (result.error.code === 'card_declined') {
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
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <Form onSubmit={handleSubmit}>
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

        {/* CORRIGÉ: Adresse de facturation avec validation en temps réel */}
        <FormGroup label="Adresse de facturation" fieldId="billing-address">
          <TextInput
            id="address-line1"
            value={customerAddress.line1}
            onChange={(_event, value) => handleAddressChange('line1', value)}
            placeholder="Rue et numéro *"
            style={{ marginBottom: '0.5rem' }}
            isRequired
          />
          <TextInput
            id="address-line2"
            value={customerAddress.line2}
            onChange={(_event, value) => handleAddressChange('line2', value)}
            placeholder="Complément d'adresse (optionnel)"
            style={{ marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: '0 0 140px' }}>
              <TextInput
                id="postal-code"
                value={customerAddress.postal_code}
                onChange={(_event, value) => handleAddressChange('postal_code', value)}
                placeholder={customerAddress.country === 'BE' ? '1400' : 'Code postal *'}
                isRequired
                // AJOUTÉ: Validation visuelle en temps réel
                validated={
                  customerAddress.postal_code ? 
                    (validatePostalCode(customerAddress.postal_code, customerAddress.country) ? 'success' : 'error') : 
                    'default'
                }
              />
              {/* AJOUTÉ: Indicateur de validation */}
              {customerAddress.postal_code && (
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  {validatePostalCode(customerAddress.postal_code, customerAddress.country) ? (
                    <span style={{ color: 'green' }}>✅ Code postal valide</span>
                  ) : (
                    <span style={{ color: 'red' }}>❌ Format incorrect</span>
                  )}
                </div>
              )}
            </div>
            <TextInput
              id="city"
              value={customerAddress.city}
              onChange={(_event, value) => handleAddressChange('city', value)}
              placeholder="Ville *"
              style={{ flex: '1' }}
              isRequired
            />
          </div>
          <select
            id="country"
            value={customerAddress.country}
            onChange={(e) => {
              handleAddressChange('country', e.target.value);
              // Réinitialiser le code postal si on change de pays
              if (customerAddress.postal_code) {
                console.log('🌍 [PaymentForm] Changement de pays, revalidation du code postal');
              }
            }}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            <option value="BE">🇧🇪 Belgique (4 chiffres)</option>
            <option value="FR">🇫🇷 France (5 chiffres)</option>
            <option value="NL">🇳🇱 Pays-Bas (4 chiffres + 2 lettres)</option>
            <option value="DE">🇩🇪 Allemagne (5 chiffres)</option>
            <option value="LU">🇱🇺 Luxembourg (4 chiffres)</option>
          </select>
        </FormGroup>

        {/* Élément de paiement Stripe */}
        <FormGroup label="Informations de paiement *" fieldId="payment-element" isRequired>
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
                      email: customerEmail,
                      address: {
                        line1: customerAddress.line1,
                        line2: customerAddress.line2,
                        city: customerAddress.city,
                        postal_code: customerAddress.postal_code.toString(), // IMPORTANT: Forcer en string
                        country: customerAddress.country
                      }
                    }
                  },
                  // CORRIGÉ: Configuration pour forcer les types corrects
                  fields: {
                    billingDetails: {
                      address: {
                        country: 'auto',
                        postalCode: 'auto'
                      }
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
            isDisabled={
              isLoading || 
              !acceptTerms || 
              !customerName.trim() || 
              !customerEmail.trim() ||
              !customerAddress.line1.trim() ||
              !customerAddress.city.trim() ||
              !customerAddress.postal_code ||
              !validatePostalCode(customerAddress.postal_code, customerAddress.country) ||
              (!isComplete && usePaymentElement)
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
                Payer {amount ? `${amount} €` : 'maintenant'}
              </>
            )}
          </Button>
          
          {/* AJOUTÉ: Indicateur de validation globale */}
          {!validatePostalCode(customerAddress.postal_code, customerAddress.country) && customerAddress.postal_code && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.5rem', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              ⚠️ Code postal "{customerAddress.postal_code}" invalide pour {customerAddress.country}. 
              Format attendu: {
                customerAddress.country === 'BE' ? '4 chiffres (ex: 1400)' :
                customerAddress.country === 'FR' ? '5 chiffres (ex: 75001)' :
                customerAddress.country === 'NL' ? '4 chiffres + 2 lettres (ex: 1234 AB)' :
                customerAddress.country === 'DE' ? '5 chiffres (ex: 10115)' :
                customerAddress.country === 'LU' ? '4 chiffres (ex: 1234)' :
                'au moins 4 caractères'
              }
            </div>
          )}
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
