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
  }, [echeanceId, userId]); // Dépendances sécurisées

  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('🎉 [PaiementPage] Paiement réussi avec userId:', userId, paymentResult);
    
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('userData') || '{}').token;

      // AJOUTÉ: Vérifications de sécurité avant envoi
      if (!paymentResult?.paymentIntent?.id) {
        throw new Error('Données de paiement invalides');
      }

      if (!echeanceData?.montant) {
        throw new Error('Montant de l\'échéance invalide');
      }

      // Notifier le serveur que le paiement est confirmé
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

      if (response.ok) {
        const confirmationData = await response.json();
        console.log('✅ Confirmation reçue:', confirmationData);
        
        // Afficher un message spécial pour le premier paiement
        if (confirmationData?.premier_paiement) {
          console.log('🎉 Premier paiement détecté - Statut utilisateur mis à jour !');
        }
        
        setPaymentSuccess(true);
        
        // Rediriger après quelques secondes avec paramètres appropriés
        setTimeout(() => {
          const redirectUrl = confirmationData?.premier_paiement 
            ? '/pages/compte?tab=paiements&success=true&first_payment=true'
            : '/pages/compte?tab=paiements&success=true';
          navigate(redirectUrl);
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Erreur lors de la confirmation du paiement');
      }
    } catch (error: any) {
      console.error('Erreur confirmation:', error);
      setError('Paiement effectué mais erreur de confirmation. Contactez le support.');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ Erreur de paiement:', error);
    setError(`Erreur de paiement: ${error?.message || 'Erreur inconnue'}`);
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
          subtitle="Régularisez votre situation rapidement et en toute sécurité"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Erreur">
            {error}
          </Alert>
          <div style={{ marginTop: '2rem' }}>
            <Button 
              variant="primary" 
              icon={<ArrowLeftIcon />}
              onClick={() => navigate('/pages/compte')}
            >
              Retour au compte
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
                  </Alert>

                  <div style={{ marginBottom: '2rem' }}>
                    <p>✅ Votre accès aux services du club est maintenu</p>
                    <p>📧 Un reçu de paiement vous sera envoyé par email</p>
                    <p>🔄 Redirection automatique dans quelques secondes...</p>
                  </div>

                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/pages/compte?tab=paiements&success=true')}
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
