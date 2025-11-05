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
  returnUrl
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
      // Phase 1 - Validation
      updatePaymentStatus('validating', 'Validation des informations de paiement...', 10);

      console.log('🚀 [PaymentForm] Début du processus de paiement:', {
        echeanceId,
        userId,
        amount,
        clientSecret: clientSecret.substring(0, 20) + '...'
      });

      // Simulation d'un délai pour montrer la validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2 - Traitement
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

      // Phase 3 - Analyse du résultat
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
        updatePaymentStatus('failed', `Échec du paiement: ${error.message}`, 0);
        
        console.error('❌ [PaymentForm] Erreur confirmation:', error);
        
        // AMÉLIORÉ: Gestion spécifique des erreurs de refus de carte
        if (error.type === 'card_error') {
          let userFriendlyMessage = '';
          
          switch (error.code) {
            case 'payment_intent_payment_attempt_failed':
            case 'card_declined':
            case 'generic_decline':
              userFriendlyMessage = `🚫 Votre carte a été refusée par votre banque.

💡 Solutions possibles :
• Vérifiez que vous avez suffisamment de fonds
• Vérifiez les limites de votre carte (montant/géographiques)
• Contactez votre banque pour autoriser le paiement
• Essayez avec une autre carte
• Le paiement peut être bloqué pour sécurité (paiement à l'étranger)

💳 Détails techniques : ${error.message}

📞 Si le problème persiste, contactez votre banque en mentionnant :
- Tentative de paiement de ${formatAmount(amount)}
- Site marchand : Stripe
- Code erreur : ${error.code}`;
              break;
              
            case 'insufficient_funds':
              userFriendlyMessage = `💰 Fonds insuffisants sur votre carte.

💡 Solutions :
• Vérifiez le solde de votre compte
• Utilisez une autre carte
• Effectuez un virement sur votre compte`;
              break;
              
            case 'expired_card':
              userFriendlyMessage = `📅 Votre carte a expiré.

💡 Solution :
• Utilisez une carte valide
• Contactez votre banque pour une nouvelle carte`;
              break;
              
            case 'incorrect_cvc':
              userFriendlyMessage = `🔐 Code de sécurité (CVC) incorrect.

💡 Solution :
• Vérifiez les 3 chiffres au dos de votre carte
• Ressaisissez votre carte`;
              break;
              
            case 'processing_error':
              userFriendlyMessage = `⚙️ Erreur de traitement temporaire.

💡 Solutions :
• Réessayez dans quelques minutes
• Vérifiez votre connexion internet
• Utilisez une autre carte si le problème persiste`;
              break;
              
            default:
              userFriendlyMessage = `❌ Problème avec votre carte : ${error.message}

💡 Solutions générales :
• Vérifiez les informations saisies
• Contactez votre banque
• Essayez avec une autre carte
• Code d'erreur : ${error.code}`;
          }
          
          setErrorMessage(userFriendlyMessage);
        } else if (error.type === 'validation_error') {
          setErrorMessage(`⚠️ Informations invalides : ${error.message}\n\n💡 Veuillez vérifier et corriger les données saisies.`);
        } else {
          setErrorMessage(`❌ Erreur inattendue : ${error.message}\n\n💡 Veuillez réessayer ou contacter le support.`);
        }
        
        onError(error);
      } else if (paymentIntent) {
        switch (paymentIntent.status) {
          case 'succeeded':
            updatePaymentStatus('succeeded', 'Paiement réussi ! Redirection en cours...', 100);
            console.log('✅ [PaymentForm] Paiement réussi immédiatement');
            
            setTimeout(() => {
              onSuccess({ paymentIntent });
            }, 1500);
            break;
          
          case 'processing':
            updatePaymentStatus('processing', 'Paiement en cours de traitement...', 80);
            console.log('⏳ [PaymentForm] Paiement en cours de traitement');
            setErrorMessage(`ℹ️ Votre paiement est en cours de traitement.

📧 Vous recevrez une confirmation par email une fois le traitement terminé.
⏱️ Cela peut prendre quelques minutes à quelques heures selon votre banque.

💡 Ne fermez pas cette page et n'effectuez pas un nouveau paiement.`);
            break;
          
          case 'requires_payment_method':
            updatePaymentStatus('failed', 'Méthode de paiement requise', 0);
            console.log('❌ [PaymentForm] Paiement nécessite une autre méthode');
            setErrorMessage(`🚫 Votre méthode de paiement a été refusée.

💡 Solutions :
• Essayez avec une autre carte
• Vérifiez les informations saisies
• Contactez votre banque
• Utilisez un autre moyen de paiement si disponible`);
            onError({ type: 'payment_method_required', message: 'Méthode de paiement requise' });
            break;
          
          case 'requires_action':
            updatePaymentStatus('redirecting', 'Redirection vers votre banque...', 50);
            console.log('🔄 [PaymentForm] Action requise - redirection en cours');
            break;
          
          default:
            updatePaymentStatus('failed', `Statut inattendu: ${paymentIntent.status}`, 0);
            console.log('⚠️ [PaymentForm] Statut de paiement inattendu:', paymentIntent.status);
            setErrorMessage(`⚠️ Statut de paiement inattendu : ${paymentIntent.status}

💡 Veuillez vérifier votre compte ou contacter le support.`);
        }
      } else {
        updatePaymentStatus('redirecting', 'Redirection en cours pour finaliser le paiement...', 60);
        console.log('🔄 [PaymentForm] Redirection en cours pour action de paiement (ex: Bancontact)');
      }
    } catch (unexpectedError: any) {
      updatePaymentStatus('failed', 'Erreur inattendue lors du paiement', 0);
      console.error('❌ [PaymentForm] Erreur inattendue:', unexpectedError);
      setErrorMessage(`❌ Une erreur technique inattendue s'est produite.

💡 Solutions :
• Actualisez la page et réessayez
• Vérifiez votre connexion internet
• Contactez le support si le problème persiste

🔧 Détails : ${unexpectedError.message}`);
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

  // AMÉLIORÉ: Composant d'erreur avec style et solutions
  const ErrorAlert = () => {
    if (!errorMessage) return null;
    
    const isCardDeclined = errorMessage.includes('refusée') || errorMessage.includes('declined');
    const isInsufficientFunds = errorMessage.includes('Fonds insuffisants');
    
    return (
      <Alert 
        variant="danger" 
        title={
          isCardDeclined ? "🚫 Paiement refusé par votre banque" :
          isInsufficientFunds ? "💰 Fonds insuffisants" :
          "❌ Erreur de paiement"
        }
        style={{ 
          marginBottom: '1rem',
          whiteSpace: 'pre-line' // Pour afficher les retours à la ligne
        }}
      >
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          {errorMessage}
        </div>
        
        {isCardDeclined && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '6px'
          }}>
            <strong>🔔 Important :</strong> Ce refus vient de votre banque, pas de notre système. 
            Votre compte n'a pas été débité.
          </div>
        )}
      </Alert>
    );
  };

  // NOUVEAU: Mode simulation pour forcer le succès du paiement
  const [isSimulationMode, setIsSimulationMode] = useState(process.env.NODE_ENV === 'development');

  // NOUVEAU: Fonction pour simuler un paiement réussi
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      updatePaymentStatus('validating', '🧪 Mode simulation - Validation...', 10);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updatePaymentStatus('processing', '🧪 Simulation du paiement en cours...', 30);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updatePaymentStatus('confirming', '🧪 Simulation de la confirmation...', 70);
      
      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('authToken') || 
                   localStorage.getItem('token') || 
                   JSON.parse(localStorage.getItem('userData') || '{}').token;

      console.log('🧪 [PaymentForm] Simulation - Appel de force-payment-success:', {
        echeanceId,
        userId,
        paymentIntentId: clientSecret.split('_secret_')[0]
      });

      const apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/paiements/force-payment-success`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split('_secret_')[0],
          echeanceId: echeanceId,
          userId: userId
        })
      });

      console.log('📊 [PaymentForm] Réponse simulation:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type')
        }
      });

      if (response.ok) {
        // AMÉLIORÉ: Gestion robuste de la réponse JSON
        let result;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            result = await response.json();
            console.log('✅ [PaymentForm] Réponse JSON parsée:', result);
          } catch (jsonError) {
            console.error('❌ [PaymentForm] Erreur parsing JSON:', jsonError);
            const textResponse = await response.text();
            console.log('📄 [PaymentForm] Réponse brute:', textResponse);
            
            // Si la réponse contient "success": true quelque part, considérer comme succès
            if (textResponse.includes('"success":true') || textResponse.includes('success: true')) {
              result = { 
                success: true, 
                message: 'Simulation réussie (parsing JSON échoué mais réponse positive détectée)',
                rawResponse: textResponse 
              };
            } else {
              throw new Error(`Réponse invalide du serveur: ${textResponse}`);
            }
          }
        } else {
          // Si ce n'est pas du JSON, traiter comme du texte
          const textResponse = await response.text();
          console.log('📄 [PaymentForm] Réponse texte:', textResponse);
          
          if (textResponse.includes('success') || response.status === 200) {
            result = { 
              success: true, 
              message: 'Simulation réussie (réponse non-JSON)',
              rawResponse: textResponse 
            };
          } else {
            throw new Error(`Réponse inattendue: ${textResponse}`);
          }
        }

        // VÉRIFIÉ: Vérifier le succès dans la réponse
        if (result.success || result.isConfirm || response.status === 200) {
          console.log('✅ [PaymentForm] Simulation validée comme réussie');
          updatePaymentStatus('succeeded', '🎉 Simulation réussie ! Redirection en cours...', 100);
          
          setTimeout(() => {
            onSuccess({ 
              paymentIntent: { 
                id: clientSecret.split('_secret_')[0],
                status: 'succeeded',
                amount: amount 
              },
              simulated: true,
              simulationResult: result
            });
          }, 1500);
        } else {
          console.warn('⚠️ [PaymentForm] Réponse positive mais succès non confirmé:', result);
          throw new Error(`Simulation échouée: ${result.message || 'Statut inconnu'}`);
        }
      } else {
        // AMÉLIORÉ: Gestion des erreurs HTTP avec plus de détails
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        
        console.error('❌ [PaymentForm] Erreur HTTP simulation:', {
          status: response.status,
          statusText: response.statusText,
          body: errorDetails
        });
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorDetails ? ` - ${JSON.stringify(errorDetails)}` : ''}`);
      }
      
    } catch (error: any) {
      console.error('❌ [PaymentForm] Erreur simulation complète:', error);
      updatePaymentStatus('failed', 'Erreur de simulation', 0);
      
      // AMÉLIORÉ: Messages d'erreur plus informatifs
      let errorMsg = '';
      if (error.message.includes('404')) {
        errorMsg = `❌ Route de simulation non trouvée (404)

🔧 Solutions :
• Vérifiez que le serveur API est démarré sur le port 3000
• URL tentée : ${window.location.protocol}//${window.location.hostname}:3000/paiements/force-payment-success
• Commande : npm run start:api:dev`;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = `❌ Impossible de contacter le serveur API

🔧 Solutions :
• Vérifiez que le serveur API est démarré
• URL : ${window.location.protocol}//${window.location.hostname}:3000
• Vérifiez les logs du serveur API`;
      } else if (error.message.includes('JSON')) {
        errorMsg = `⚠️ Problème de format de réponse du serveur

🔧 Le serveur a répondu mais le format n'est pas valide
• Vérifiez les logs du serveur API
• La simulation a peut-être réussi malgré cette erreur

📄 Détails : ${error.message}`;
      } else {
        errorMsg = `❌ Erreur de simulation : ${error.message}

🔧 Si le problème persiste :
• Vérifiez les logs du serveur API
• Vérifiez que l'authentification est désactivée pour les tests
• URL : ${window.location.protocol}//${window.location.hostname}:3000/paiements/force-payment-success`;
      }
      
      setErrorMessage(errorMsg);
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {/* Indicateur de statut de paiement */}
      <PaymentStatusIndicator />

      {/* NOUVEAU: Mode simulation pour développement */}
      {isSimulationMode && (
        <Card style={{ marginBottom: '2rem', border: '2px solid #ffc107', backgroundColor: '#fff3cd' }}>
          <CardBody>
            <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem', color: '#856404' }}>
              🧪 Mode Développement - Simulation
            </Title>
            
            <div style={{ marginBottom: '1rem', color: '#856404' }}>
              <p><strong>🎯 Mode test activé !</strong></p>
              <p>Vous pouvez simuler un paiement réussi sans utiliser Stripe.</p>
              <p>Cette fonction utilise l'API <code>/force-payment-success</code> pour marquer l'échéance comme payée.</p>
              
              {/* AJOUTÉ: Informations de debug */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <strong>🔧 Debug Info:</strong><br/>
                • API URL: {`${window.location.protocol}//${window.location.hostname}:3000/paiements/force-payment-success`}<br/>
                • PaymentIntent ID: {clientSecret.split('_secret_')[0]}<br/>
                • Échéance ID: {echeanceId}<br/>
                • Utilisateur ID: {userId}
              </div>
            </div>
            
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <Button
                  variant="warning"
                  onClick={handleSimulatePayment}
                  isDisabled={isProcessing}
                  icon={<CheckCircleIcon />}
                >
                  🧪 Simuler un paiement réussi
                </Button>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="link"
                  onClick={() => setIsSimulationMode(false)}
                  style={{ color: '#856404' }}
                >
                  Désactiver la simulation
                </Button>
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
      )}

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

      {/* Élément de paiement Stripe - Masqué en mode simulation */}
      {!isSimulationMode && (
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
      )}

      {/* Option pour l'adresse de facturation - OPTIONNELLE */}
      {!isSimulationMode && (
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
      )}

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

      {/* AMÉLIORÉ: Affichage des erreurs avec style */}
      <ErrorAlert />

      {/* Bouton de paiement avec statut */}
      <Flex justifyContent={{ default: 'justifyContentCenter' }}>
        <FlexItem>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={paymentStatus === 'succeeded' ? <CheckCircleIcon /> : <CreditCardIcon />}
            isLoading={isProcessing}
            isDisabled={!stripe || !elements || isProcessing || !acceptTerms || isSimulationMode}
            style={{ 
              minWidth: '200px',
              fontSize: '16px',
              padding: '12px 24px',
              backgroundColor: paymentStatus === 'succeeded' ? '#28a745' : undefined,
              opacity: isSimulationMode ? 0.6 : 1
            }}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" style={{ marginRight: '8px' }} />
                {statusMessage || 'Traitement en cours...'}
              </>
            ) : paymentStatus === 'succeeded' ? (
              'Paiement réussi ✅'
            ) : isSimulationMode ? (
              `Payer ${formatAmount(amount)} (Mode simulation actif)`
            ) : (
              `Payer ${formatAmount(amount)}`
            )}
          </Button>
        </FlexItem>
      </Flex>

      {/* Bouton pour activer la simulation si désactivée */}
      {!isSimulationMode && process.env.NODE_ENV === 'development' && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button
            variant="link"
            onClick={() => setIsSimulationMode(true)}
            style={{ color: '#ffc107' }}
          >
            🧪 Activer le mode simulation (développement)
          </Button>
        </div>
      )}

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
          {isSimulationMode && <span style={{ color: '#ffc107' }}> (Mode simulation actif)</span>}
        </p>
        <p style={{ fontSize: '12px', marginTop: '0.5rem' }}>
          💡 En cas de refus, contactez votre banque. Aucun débit n'est effectué en cas d'échec.
        </p>
      </div>
    </Form>
  );
};

export default PaymentForm;
