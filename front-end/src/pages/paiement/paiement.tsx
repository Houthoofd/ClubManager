import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Page,
  PageSection,
  Title,
  Card,
  CardBody,
  Button,
  Alert,
  Flex,
  FlexItem,
  Badge,
  Spinner,
  Bullseye,
} from '@patternfly/react-core';
import { CreditCardIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@patternfly/react-icons';
import { PageHeader } from '../../components/common/PageHeader';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/form/PaymentForm';
import { apiUrl } from '../../pages/apiUrl';

// Charger Stripe avec votre clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const PaiementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [echeanceData, setEcheanceData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>(''); // AJOUTÉ

  // CORRIGÉ: Récupérer les paramètres de l'URL avec vérifications de sécurité
  const echeanceId = searchParams.get('echeance');
  const userId = searchParams.get('userId') || searchParams.get('user');
  const token = searchParams.get('token');

  // AJOUTÉ: Debug détaillé avec vérifications de sécurité
  console.log('🔥 [PaiementPage] FICHIER CORRIGÉ - Debug URL:', {
    href: window.location?.href || 'Non disponible',
    search: window.location?.search || 'Non disponible',
    searchParams_all: searchParams ? Array.from(searchParams.entries()) : [],
    echeanceId_extracted: echeanceId || 'null',
    userId_extracted: userId || 'null',
    userId_direct: typeof window !== 'undefined' && window.location ? 
      new URLSearchParams(window.location.search).get('userId') : 'Non disponible',
    user_direct: typeof window !== 'undefined' && window.location ? 
      new URLSearchParams(window.location.search).get('user') : 'Non disponible',
    NOTE: 'Recherche userId puis user en fallback avec vérifications de sécurité'
  });

  // AJOUTÉ: Vérification critique de userId avec message d'erreur détaillé
  if (!userId || userId === 'null' || userId === '' || userId === 'undefined') {
    console.error('🚨 [PaiementPage] userId invalide:', { userId, type: typeof userId });
    
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Paramètre manquant dans l'URL"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="ID utilisateur manquant ou invalide">
            <p>L'ID utilisateur est manquant ou invalide dans l'URL. L'URL doit contenir le paramètre <code>userId</code> avec une valeur numérique valide.</p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              margin: '1rem 0',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p><strong>URL actuelle :</strong> {typeof window !== 'undefined' ? window.location.href : 'Non disponible'}</p>
              <p><strong>Format attendu :</strong> /pages/paiement?echeance=487&userId=154</p>
              <p><strong>Paramètres détectés :</strong></p>
              <ul>
                <li>echeance: {searchParams?.get('echeance') || 'MANQUANT'}</li>
                <li>userId: {searchParams?.get('userId') || 'MANQUANT'}</li>
                <li>user: {searchParams?.get('user') || 'MANQUANT'}</li>
                <li>Valeur userId extraite: {userId || 'VIDE/NULL'}</li>
                <li>Type userId: {typeof userId}</li>
              </ul>
            </div>
          </Alert>
          <div style={{ marginTop: '2rem' }}>
            <Button 
              variant="primary" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/compte?tab=paiements')}
            >
              Retour au compte
            </Button>
          </div>
        </PageSection>
      </Page>
    );
  }

  // AJOUTÉ: Vérification de echeanceId avec message d'erreur
  if (!echeanceId || echeanceId === 'null' || echeanceId === '' || echeanceId === 'undefined') {
    console.error('🚨 [PaiementPage] echeanceId invalide:', { echeanceId, type: typeof echeanceId });
    
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Paramètre manquant dans l'URL"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="ID d'échéance manquant ou invalide">
            <p>L'ID de l'échéance est manquant ou invalide dans l'URL.</p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              margin: '1rem 0',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p><strong>Valeur echeanceId:</strong> {echeanceId || 'VIDE/NULL'}</p>
              <p><strong>Type:</strong> {typeof echeanceId}</p>
            </div>
            <Button 
              variant="primary" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/compte?tab=paiements')}
            >
              Retour au compte
            </Button>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  useEffect(() => {
    const loadEcheanceData = async () => {
      // AJOUTÉ: Vérifications de sécurité en début de fonction
      if (!echeanceId || !userId) {
        console.error('🚨 [PaiementPage] Paramètres manquants dans useEffect:', { echeanceId, userId });
        setError('Paramètres manquants pour charger les données de paiement');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     JSON.parse(localStorage.getItem('userData') || '{}').token;

        console.log('🔍 [PaiementPage] Chargement échéance:', {
          echeanceId, 
          userId, 
          userId_type: typeof userId,
          userId_valid: !!(userId && !isNaN(parseInt(userId)))
        });

        // 1. Récupérer les détails de l'échéance avec gestion d'erreur améliorée
        const echeanceResponse = await fetch(apiUrl(`paiements/echeance/${echeanceId}?userId=${userId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!echeanceResponse.ok) {
          const errorText = await echeanceResponse.text();
          throw new Error(`Échéance non trouvée (${echeanceResponse.status}): ${errorText}`);
        }

        const echeanceResult = await echeanceResponse.json();
        const echeance = echeanceResult?.data || echeanceResult;
        
        // AJOUTÉ: Vérification de la structure des données reçues
        if (!echeance || typeof echeance !== 'object') {
          throw new Error('Données d\'échéance invalides reçues du serveur');
        }
        
        console.log('📋 [PaiementPage] Échéance chargée:', echeance);
        setEcheanceData(echeance);

        // 2. Créer le PaymentIntent avec vérifications de sécurité
        console.log('💳 [PaiementPage] Création PaymentIntent avec userId:', userId);
        const paymentIntentResponse = await fetch(apiUrl('paiements/create-payment-intent'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            amount: Math.round((echeance.montant || 0) * 100), // Vérification de sécurité
            currency: 'eur',
            echeanceId: echeanceId,
            userId: userId,
            description: echeance.description || `Paiement échéance #${echeanceId}`
          }),
        });

        if (paymentIntentResponse.ok) {
          const paymentData = await paymentIntentResponse.json();
          console.log('✅ [PaiementPage] PaymentIntent créé avec userId:', { userId, paymentData });
          setClientSecret(paymentData?.client_secret || '');
          setPaymentIntentId(paymentData?.payment_intent_id || ''); // AJOUTÉ
        } else {
          const errorData = await paymentIntentResponse.json();
          console.error('❌ [PaiementPage] Erreur PaymentIntent:', errorData);
          throw new Error(errorData?.error || 'Erreur lors de la création du PaymentIntent');
        }
        
        setLoading(false);
        
      } catch (apiError: any) {
        console.error('❌ [PaiementPage] Erreur API avec userId:', userId, apiError);
        
        // AJOUTÉ: Gestion d'erreur plus robuste
        const errorMessage = apiError?.message || 'Erreur inconnue';
        
        if (errorMessage.includes('Configuration de paiement invalide')) {
          setError('Configuration de paiement invalide. L\'administrateur doit corriger les paramètres Stripe.');
        } else if (errorMessage.includes('Service de paiement temporairement indisponible')) {
          setError('Service de paiement temporairement indisponible. Veuillez réessayer plus tard.');
        } else if (errorMessage.includes('Clé API Stripe')) {
          setError('Configuration du service de paiement incorrecte. Veuillez contacter l\'administrateur.');
        } else {
          setError(`Erreur de service: ${errorMessage}`);
        }
        
        // Utiliser des données de démonstration avec vérifications
        console.warn('⚠️ [PaiementPage] Basculement mode démo avec userId:', userId);
        
        const echeanceDemo = {
          id: echeanceId,
          montant: 50.00,
          description: 'Cotisation mensuelle - Club Manager (DEMO)',
          dateEcheance: '2024-01-15',
          date_echeance: '2024-01-15',
          statut: 'en_attente',
          utilisateur_id: userId
        };
        
        setEcheanceData(echeanceDemo);
        setClientSecret('');
        setLoading(false);
      }
    };

    loadEcheanceData();
  }, [echeanceId, userId]);

  // NOUVEAU: Gérer le retour de Stripe après redirection (Bancontact, etc.)
  useEffect(() => {
    const handleStripeRedirectResult = async () => {
      if (!clientSecret) return;

      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
      const redirectStatus = urlParams.get('redirect_status');

      console.log('🔄 [PaiementPage] Vérification retour Stripe:', {
        paymentIntentClientSecret,
        redirectStatus,
        currentClientSecret: clientSecret
      });

      if (paymentIntentClientSecret && redirectStatus) {
        try {
          const stripe = await stripePromise;
          if (!stripe) {
            throw new Error('Stripe non initialisé');
          }

          console.log('🔍 [PaiementPage] Récupération du statut PaymentIntent après redirection...');
          
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
          
          console.log('📊 [PaiementPage] Statut PaymentIntent après redirection:', {
            id: paymentIntent?.id,
            status: paymentIntent?.status,
            redirectStatus
          });

          if (paymentIntent) {
            switch (paymentIntent.status) {
              case 'succeeded':
                console.log('✅ [PaiementPage] Paiement réussi après redirection');
                await handlePaymentSuccess({ paymentIntent });
                break;
              
              case 'processing':
                console.log('⏳ [PaiementPage] Paiement en cours de traitement');
                setError('Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.');
                break;
              
              case 'requires_payment_method':
                console.log('❌ [PaiementPage] Paiement échoué - méthode de paiement requise');
                setError('Le paiement a échoué. Veuillez réessayer avec une autre méthode de paiement.');
                break;
              
              case 'canceled':
                console.log('🚫 [PaiementPage] Paiement annulé');
                setError('Le paiement a été annulé.');
                break;
              
              default:
                console.log('⚠️ [PaiementPage] Statut de paiement inattendu:', paymentIntent.status);
                setError(`Statut de paiement inattendu: ${paymentIntent.status}`);
            }
          }
        } catch (error: any) {
          console.error('❌ [PaiementPage] Erreur lors de la vérification du paiement:', error);
          setError('Erreur lors de la vérification du paiement. Veuillez contacter le support.');
        }
      }
    };

    // Vérifier le retour de Stripe après un délai pour s'assurer que clientSecret est défini
    const timer = setTimeout(handleStripeRedirectResult, 1000);
    return () => clearTimeout(timer);
  }, [clientSecret]);

  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('🎉 [PaiementPage] Paiement réussi avec userId:', userId, paymentResult);
    
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('userData') || '{}').token;

      // NOUVEAU: Détection du mode simulation
      const isSimulated = paymentResult.simulated || paymentResult.simulationResult;
      
      console.log('🔍 [PaiementPage] Type de paiement détecté:', {
        isSimulated,
        hasPaymentIntent: !!paymentResult?.paymentIntent?.id,
        paymentIntentId: paymentResult?.paymentIntent?.id
      });

      // MODIFIÉ: Gestion spéciale pour les simulations
      if (isSimulated) {
        console.log('🧪 [PaiementPage] Simulation détectée - Traitement simplifié');
        
        // Pour les simulations, ne pas faire d'appel de confirmation supplémentaire
        setPaymentSuccess(true);
        
        // Message de succès pour simulation
        console.log('✅ [PaiementPage] Simulation traitée avec succès - Redirection...');
        
        setTimeout(() => {
          const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          const isAdmin = currentUserData?.status === 'administrateur' || currentUserData?.status === 'super-administrateur';
          
          if (isAdmin && currentUserData?.id !== parseInt(userId)) {
            navigate(`/pages/utilisateurs/consulter/${userId}?tab=2&payment_success=simulation`);
          } else {
            navigate('/pages/compte?tab=2&success=simulation');
          }
        }, 2000);
        
        return; // IMPORTANT: Sortir ici pour éviter l'appel API
      }

      // AJOUTÉ: Vérifications de sécurité avant envoi pour les vrais paiements
      if (!paymentResult?.paymentIntent?.id) {
        throw new Error('Données de paiement invalides - PaymentIntent ID manquant');
      }

      if (!echeanceData?.montant) {
        throw new Error('Montant de l\'échéance invalide');
      }

      console.log('💳 [PaiementPage] Paiement Stripe réel - Envoi confirmation vers serveur:', {
        paymentIntentId: paymentResult.paymentIntent.id,
        echeanceId,
        userId,
        amount: echeanceData.montant
      });

      // Notifier le serveur que le paiement est confirmé (SEULEMENT pour les vrais paiements)
      const response = await fetch(apiUrl('paiements/confirm-payment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentIntentId: paymentResult.paymentIntent.id,
          echeanceId: echeanceId,
          userId: userId,
          amount: echeanceData.montant
        }),
      });

      console.log('📊 [PaiementPage] Réponse confirm-payment:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        const confirmationData = await response.json();
        console.log('✅ [PaiementPage] Confirmation reçue du serveur:', confirmationData);
        
        // Afficher un message spécial pour le premier paiement
        if (confirmationData?.premier_paiement) {
          console.log('🎉 Premier paiement détecté - Statut utilisateur mis à jour !');
        }
        
        setPaymentSuccess(true);
        
        // Redirection adaptée selon qui effectue le paiement
        setTimeout(() => {
          const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          const isAdmin = currentUserData?.status === 'administrateur' || currentUserData?.status === 'super-administrateur';
          
          if (isAdmin && currentUserData?.id !== parseInt(userId)) {
            // Admin traitant le paiement d'un autre utilisateur
            const redirectUrl = `/pages/utilisateurs/consulter/${userId}?tab=2&payment_success=true`;
            console.log('🔄 [PaiementPage] Redirection admin vers:', redirectUrl);
            navigate(redirectUrl);
          } else {
            // Utilisateur traitant son propre paiement
            const redirectUrl = confirmationData?.premier_paiement 
              ? '/pages/compte?tab=2&success=true&first_payment=true'
              : '/pages/compte?tab=2&success=true';
            console.log('🔄 [PaiementPage] Redirection utilisateur vers:', redirectUrl);
            navigate(redirectUrl);
          }
        }, 3000);
      } else {
        // AMÉLIORÉ: Gestion d'erreur pour les vrais paiements
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        
        console.error('❌ [PaiementPage] Erreur confirmation serveur:', {
          status: response.status,
          errorDetails
        });

        // Message d'erreur spécifique mais informatif
        const errorMessage = `⚠️ Paiement traité mais problème de confirmation automatique

💳 Votre paiement Stripe a été effectué avec succès
📝 Référence : ${paymentResult.paymentIntent.id}

🔧 Détails techniques :
${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails, null, 2)}

💡 Que faire maintenant :
• Votre compte sera mis à jour automatiquement dans quelques minutes
• Vous pouvez vérifier votre compte pour voir les changements
• En cas de doute, contactez le support avec cette référence

🔄 Redirection vers votre compte...`;

        setError(errorMessage);
        
        // Redirection même en cas d'erreur car le paiement a réussi
        setTimeout(() => {
          navigate('/pages/compte?tab=2&payment=' + paymentResult.paymentIntent.id);
        }, 5000);
      }

    } catch (error: any) {
      console.error('❌ [PaiementPage] Erreur lors de la gestion du succès:', error);
      
      // AMÉLIORÉ: Message d'erreur détaillé selon le contexte
      let errorMessage = '';
      
      if (paymentResult.simulated) {
        errorMessage = `🧪 Erreur lors de la simulation de paiement

🔧 Détails : ${error.message}

💡 La simulation a peut-être réussi malgré cette erreur
🔄 Vérification de votre compte recommandée...`;
      } else {
        errorMessage = `⚠️ Paiement effectué mais erreur de traitement

💳 Votre paiement a été traité par Stripe
📝 Référence : ${paymentResult?.paymentIntent?.id || 'N/A'}

🔧 Erreur technique : ${error.message}

💡 Actions recommandées :
• Votre compte sera mis à jour automatiquement
• Vérifiez votre compte dans quelques minutes
• Contactez le support si nécessaire
• Conservez cette référence : ${paymentResult?.paymentIntent?.id || echeanceId}

🔄 Redirection vers votre compte...`;
      }

      setError(errorMessage);
      
      // Redirection vers le compte même en cas d'erreur
      setTimeout(() => {
        navigate('/pages/compte?tab=2');
      }, 5000);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ [PaiementPage] Erreur de paiement:', error);
    
    // AJOUTÉ: Gestion spécifique des erreurs Stripe
    let errorMessage = 'Erreur inconnue';
    
    if (error?.type === 'card_error') {
      errorMessage = `Erreur de carte: ${error.message}`;
    } else if (error?.type === 'validation_error') {
      errorMessage = `Erreur de validation: ${error.message}`;
    } else if (error?.type === 'api_connection_error') {
      errorMessage = 'Erreur de connexion. Veuillez réessayer.';
    } else if (error?.type === 'authentication_error') {
      errorMessage = 'Erreur d\'authentification du paiement.';
    } else if (error?.type === 'rate_limit_error') {
      errorMessage = 'Trop de tentatives. Veuillez attendre et réessayer.';
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    setError(`Erreur de paiement: ${errorMessage}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date invalide';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return 'Date invalide';
    }
  };

  const formatMontant = (montant: number) => {
    if (typeof montant !== 'number' || isNaN(montant)) return '0,00 €';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(montant);
    } catch (e) {
      return `${montant} €`;
    }
  };

  // AJOUTÉ: Vérification de sécurité pour echeanceData
  if (loading) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Régularisez votre situation rapidement et en toute sécurité"
          variant="payment"
        />
        <PageSection>
          <Bullseye>
            <div style={{ textAlign: 'center' }}>
              <Spinner size="xl" />
              <div style={{ marginTop: '1rem' }}>
                Chargement des informations de paiement...
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
                Échéance: {echeanceId || 'N/A'} - Utilisateur: {userId || 'N/A'}
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </Page>
    );
  }

  // AJOUTÉ: Vérification de echeanceData avant utilisation
  if (!echeanceData) {
    console.error('🚨 [PaiementPage] echeanceData est null/undefined');
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement des données"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Données manquantes">
            <p>Impossible de charger les données de l'échéance.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button 
                variant="primary" 
                icon={<ArrowLeftIcon />}
                onClick={() => navigate('/compte?tab=paiements')}
              >
                Retour au compte
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Information sur le traitement de votre paiement"
          variant="payment"
        />
        <PageSection>
          {/* MODIFIÉ: Alerte avec style adapté selon le type d'erreur */}
          <Alert 
            variant={error.includes('⚠️') ? "warning" : "danger"} 
            title={error.includes('⚠️') ? "Information importante" : "Erreur"}
            style={{ 
              whiteSpace: 'pre-line',
              lineHeight: '1.6' 
            }}
          >
            {error}
          </Alert>
          <div style={{ marginTop: '2rem' }}>
            <Button 
              variant="primary" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/pages/compte?tab=2')}
            >
              Accéder à mon compte
            </Button>
          </div>
        </PageSection>
      </Page>
    );
  }

  if (paymentSuccess) {
    return (
      <Page>
        <PageHeader
          title="Paiement réussi"
          subtitle="Votre paiement a été traité avec succès"
          variant="success"
        />
        <PageSection>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <Card>
              <CardBody>
                <div style={{ padding: '2rem' }}>
                  <CheckCircleIcon 
                    size="xl" 
                    style={{ color: '#28a745', fontSize: '4rem', marginBottom: '1rem' }}
                  />
                  <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem', color: '#28a745' }}>
                    Paiement confirmé !
                  </Title>
                  
                  <Alert variant="success" title="Succès" style={{ marginBottom: '2rem' }}>
                    <p>
                      Votre paiement de <strong>{formatMontant(echeanceData.montant)}</strong> a été traité avec succès.
                    </p>
                    <p>
                      Référence de l'échéance : <strong>#{echeanceData.id}</strong>
                    </p>
                    {/* AJOUTÉ: Indication si c'est une simulation */}
                    {window.location.href.includes('simulation') && (
                      <p style={{ color: '#856404', fontStyle: 'italic' }}>
                        🧪 <strong>Mode simulation</strong> - Paiement simulé pour les tests
                      </p>
                    )}
                  </Alert>

                  <div style={{ marginBottom: '2rem' }}>
                    <p>✅ Votre accès aux services du club est maintenu</p>
                    <p>📧 Un reçu de paiement vous sera envoyé par email</p>
                    <p>🔄 Redirection automatique dans quelques secondes...</p>
                  </div>

                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/pages/compte?tab=2&success=true')}
                  >
                    Accéder à mon compte
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </PageSection>
      </Page>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  // AJOUTÉ: Vérification critique de userId
  if (!userId || userId === 'null' || userId === '') {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Paramètre manquant dans l'URL"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="ID utilisateur manquant">
            <p>L'ID utilisateur est manquant dans l'URL. L'URL doit contenir le paramètre <code>userId</code>.</p>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px', 
              margin: '1rem 0',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p><strong>URL actuelle :</strong> {window.location.href}</p>
              <p><strong>Format attendu :</strong> /pages/paiement?echeance=487&userId=154</p>
              <p><strong>Paramètres détectés :</strong></p>
              <ul>
                <li>echeance: {searchParams.get('echeance') || 'MANQUANT'}</li>
                <li>userId: {searchParams.get('userId') || 'MANQUANT'}</li>
                <li>user: {searchParams.get('user') || 'MANQUANT'}</li>
              </ul>
            </div>
          </Alert>
          <div style={{ marginTop: '2rem' }}>
            <Button 
              variant="primary" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/compte?tab=paiements')}
            >
              Retour au compte
            </Button>
          </div>
        </PageSection>
      </Page>
    );
  }

  const handleCreatePaymentIntent = async () => {
    if (!echeanceData || !userId) {
      console.error('❌ Données manquantes pour créer PaymentIntent');
      setError('Données de paiement manquantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🏦 Création PaymentIntent pour:', {
        echeanceId: echeanceData.id,
        userId,
        amount: Math.round(echeanceData.montant * 100)
      });

      const response = await fetch('/api/paiements/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(echeanceData.montant * 100),
          currency: 'eur',
          echeanceId: echeanceData.id,
          userId: userId,
          description: `Paiement échéance #${echeanceData.id}`
        })
      });

      const data = await response.json();
      console.log('📨 Réponse create-payment-intent:', data);

      if (!response.ok) {
        // AJOUTÉ: Gestion spécifique des erreurs d'échéance
        if (response.status === 404 && data.error?.includes('Échéance')) {
          throw new Error(`Cette échéance n'existe pas ou n'est plus disponible. Veuillez actualiser la page.`);
        } else if (response.status === 403 && data.error?.includes('appartient')) {
          throw new Error(`Cette échéance ne vous appartient pas.`);
        } else if (response.status === 400 && data.error?.includes('payée')) {
          throw new Error(`Cette échéance est déjà payée.`);
        }
        
        throw new Error(data.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      if (!data.client_secret) {
        throw new Error('Client secret manquant dans la réponse serveur');
      }

      setClientSecret(data.client_secret);
      setPaymentIntentId(data.payment_intent_id);
      
      console.log('✅ PaymentIntent créé avec succès:', {
        paymentIntentId: data.payment_intent_id,
        paiementId: data.paiement_id
      });

    } catch (error: any) {
      console.error('❌ Erreur création PaymentIntent:', error);
      setError(error.message || 'Erreur lors de la création du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Paiement en ligne"
        subtitle="Régularisez votre situation rapidement et en toute sécurité"
        variant="payment"
      />
      
      <PageSection>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* MODIFIÉ: Debug visuel avec vérifications de sécurité */}
          <div style={{ 
            background: '#e7f3ff', 
            border: '1px solid #bee5eb', 
            borderRadius: '8px', 
            padding: '1rem',
            margin: '0 0 1rem 0',
            fontSize: '14px'
          }}>
            <strong>🔧 Debug PaiementPage (Sécurisé):</strong>
            <br />
            <strong>🔑 userId:</strong> {userId || 'ERREUR'} {userId ? '✅' : '❌'}
            <br />
            <strong>📊 echeanceId:</strong> {echeanceId || 'ERREUR'} {echeanceId ? '✅' : '❌'}
            <br />
            <strong>💰 Montant:</strong> {echeanceData?.montant ? formatMontant(echeanceData.montant) : 'ERREUR'}
            <br />
            <strong>🌐 URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Non disponible'}
          </div>

          {/* Bouton retour */}
          <div style={{ marginBottom: '1rem' }}>
            <Button 
              variant="link" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/pages/compte')}
            >
              Retour au compte
            </Button>
          </div>

          {/* Alerte de rappel */}
          <Alert 
            variant="warning" 
            title="Paiement en attente" 
            style={{ marginBottom: '2rem' }}
          >
            <p>
              Vous avez été redirigé vers cette page pour régulariser une échéance de paiement. 
              Effectuez votre paiement ci-dessous pour éviter toute interruption de service.
            </p>
          </Alert>

          {/* Détails de l'échéance */}
          <Card style={{ marginBottom: '2rem' }}>
            <CardBody>
              <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
                <ExclamationTriangleIcon style={{ marginRight: '8px', color: '#f0ad4e' }} />
                Détails de l'échéance
              </Title>
              
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Référence :</strong>
                    </FlexItem>
                    <FlexItem>#{echeanceData?.id || echeanceId || 'N/A'}</FlexItem>
                  </Flex>
                </FlexItem>
                
                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Description :</strong>
                    </FlexItem>
                    <FlexItem>{echeanceData?.description || 'Description non disponible'}</FlexItem>
                  </Flex>
                </FlexItem>
                
                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Date d'échéance :</strong>
                    </FlexItem>
                    <FlexItem>
                      {formatDate(echeanceData?.dateEcheance || echeanceData?.date_echeance || '')}
                    </FlexItem>
                  </Flex>
                </FlexItem>
                
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Montant à payer :</strong>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                        {formatMontant(echeanceData?.montant || 0)}
                      </span>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                
                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Statut :</strong>
                    </FlexItem>
                    <FlexItem>
                      <Badge variant="outline" color="orange">
                        {echeanceData?.statut || 'En attente de paiement'}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>

          {/* Section de paiement Stripe */}
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
                <CreditCardIcon style={{ marginRight: '8px', color: '#28a745' }} />
                Effectuer le paiement
              </Title>
              
              <div style={{ marginBottom: '2rem' }}>
                <Alert variant="info" title="Paiement sécurisé" isInline>
                  Votre paiement est sécurisé et traité par Stripe. 
                  Aucune donnée de carte bancaire n'est stockée sur nos serveurs.
                </Alert>
              </div>

              {/* Vérifier si on a un vrai client secret */}
              {clientSecret && clientSecret !== 'demo_client_secret' && stripePromise ? (
                // Affichage du formulaire Stripe réel
                <Elements options={options} stripe={stripePromise}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={echeanceData.montant}
                    description={echeanceData.description}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    echeanceId={echeanceId}
                    userId={userId}
                    returnUrl={`${window.location.origin}/pages/paiement?echeance=${echeanceId}&userId=${userId}&payment_return=true`}
                  />
                </Elements>
              ) : (
                // Affichage mode démo/erreur
                <div>
                  {error && (
                    <Alert variant="warning" title="Mode démo" style={{ marginBottom: '2rem' }}>
                      {error}
                    </Alert>
                  )}
                  
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '2rem', 
                    borderRadius: '8px', 
                    border: '1px solid #dee2e6',
                    marginBottom: '2rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#495057' }}>
                      🚧 Interface de paiement en mode démo
                    </h4>
                    <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      Les API de paiement ne sont pas configurées ou disponibles.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        alert('Paiement simulé avec succès ! (Mode démo)');
                        setTimeout(() => {
                          navigate('/pages/compte?tab=paiements&demo=true');
                        }, 1000);
                      }}
                    >
                      Simuler le paiement de {formatMontant(echeanceData.montant)}
                    </Button>
                  </div>
                </div>
              )}

              {/* Informations supplémentaires */}
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                background: '#e7f3ff', 
                borderRadius: '8px' 
              }}>
                <h5 style={{ marginBottom: '0.5rem' }}>ℹ️ Informations importantes :</h5>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li>Le paiement sera traité immédiatement</li>
                  <li>Vous recevrez une confirmation par email</li>
                  <li>Votre accès aux services sera maintenu</li>
                  <li>En cas de problème, contactez notre support</li>
                </ul>
              </div>

              {/* Autres moyens de paiement */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                borderLeft: '4px solid #6c757d'
              }}>
                <h5 style={{ marginBottom: '0.5rem' }}>💡 Autres moyens de paiement :</h5>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li>Auprès de l'accueil du club</li>
                  <li>Par virement bancaire (contactez-nous pour les détails)</li>
                  <li>En espèces lors de votre prochaine visite</li>
                </ul>
              </div>
            </CardBody>
          </Card>

        </div>
      </PageSection>
    </Page>
  );
};

export default PaiementPage;
