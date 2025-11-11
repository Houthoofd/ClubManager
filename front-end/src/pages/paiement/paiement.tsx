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
  Modal,
  ModalVariant
} from '@patternfly/react-core';
import { CreditCardIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon, ShieldAltIcon } from '@patternfly/react-icons';
import { PageHeader } from '../../components/common/PageHeader';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/form/PaymentForm';
import { apiUrl } from '../../pages/apiUrl';

// AJOUTÉ: Import des hooks de paiement
import { 
  useEcheanceDetails,
  useCreatePaymentIntentSecurise,
  useConfirmPayment,
  obtenirIdUtilisateur
} from '../../hooks/usePaiements';

// CORRIGÉ: Charger Stripe avec la bonne variable d'environnement
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...');

const PaiementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // DÉPLACER TOUS LES HOOKS EN PREMIER - AVANT TOUTE LOGIQUE CONDITIONNELLE
  const [loading, setLoading] = useState(true);
  const [commandeData, setCommandeData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'echeance' | 'commande'>('echeance');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [userIdMismatch, setUserIdMismatch] = useState<boolean>(false);
  const [connectedUserId, setConnectedUserId] = useState<number | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [securityModalData, setSecurityModalData] = useState<{
    userConnected: number;
    userTarget: number;
    echeanceId?: string;
    commandeId?: string;
  } | null>(null);

  // AJOUTÉ: Variable d'état pour stocker le résultat de confirmation
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // RÉCUPÉRER LES PARAMÈTRES
  const echeanceId = searchParams.get('echeance');
  const commandeId = searchParams.get('commande');
  const userId = searchParams.get('userId') || searchParams.get('user');
  const token = searchParams.get('token');

  // CONVERSION DES IDs EN NOMBRES
  const userIdNumber = userId ? parseInt(userId) : null;
  const echeanceIdNumber = echeanceId ? parseInt(echeanceId) : null;

  // HOOKS DE PAIEMENTS - CONDITIONNELS
  // Hook pour récupérer les détails de l'échéance (seulement si c'est une échéance)
  const {
    data: echeanceData,
    isLoading: echeanceLoading,
    error: echeanceError,
    isError: echeanceIsError
  } = useEcheanceDetails(
    paymentType === 'echeance' && echeanceId ? echeanceId : null,
    userIdNumber
  );

  // Hook pour créer le PaymentIntent (conditionnellement selon le type)
  const createPaymentIntentEcheance = useCreatePaymentIntentSecurise(
    paymentType === 'echeance' && echeanceId ? echeanceId : '',
    paymentType === 'echeance' && echeanceData ? echeanceData.montant : 0,
    userIdNumber || 0
  );

  // Hook pour confirmer le paiement
  const confirmPaymentMutation = useConfirmPayment();

  // TOUS LES useEffect DOIVENT ÊTRE ICI
  useEffect(() => {
    console.log('🎯 [PaiementPage] Détection type de paiement:', {
      commandeId,
      echeanceId,
      commandeIdType: typeof commandeId,
      echeanceIdType: typeof echeanceId,
      commandeIdTruthy: !!commandeId,
      echeanceIdTruthy: !!echeanceId
    });

    // CORRIGÉ: Vérifier explicitement si les paramètres existent et ne sont pas null
    if (commandeId && commandeId !== 'null' && !echeanceId) {
      console.log('🛒 [PaiementPage] Type détecté: COMMANDE');
      setPaymentType('commande');
    } else if (echeanceId && echeanceId !== 'null' && !commandeId) {
      console.log('💰 [PaiementPage] Type détecté: ECHÉANCE');
      setPaymentType('echeance');
    } else if (commandeId && commandeId !== 'null' && echeanceId && echeanceId !== 'null') {
      console.warn('⚠️ [PaiementPage] Paramètres ambigus: commande ET échéance présents. Utilisation de commande par défaut.');
      setPaymentType('commande');
    } else if (commandeId && commandeId !== 'null') {
      console.log('🛒 [PaiementPage] Type détecté: COMMANDE (priorité sur échéance null)');
      setPaymentType('commande');
    } else if (echeanceId && echeanceId !== 'null') {
      console.log('💰 [PaiementPage] Type détecté: ECHÉANCE (priorité sur commande null)');
      setPaymentType('echeance');
    } else {
      console.error('❌ [PaiementPage] Aucun paramètre valide détecté');
      setPaymentType('echeance'); // Valeur par défaut
    }
  }, [commandeId, echeanceId, searchParams]);

  // AJOUTÉ: useEffect pour vérifier l'identité utilisateur AVANT tout traitement
  useEffect(() => {
    const verifierIdentiteUtilisateur = () => {
      try {
        console.log('🔐 [Paiement] Vérification identité utilisateur...');

        // Utiliser la fonction utilitaire du hook
        const userIdFromSession = obtenirIdUtilisateur();
        setConnectedUserId(userIdFromSession);

        if (!userIdFromSession) {
          console.error('❌ [Paiement] Aucune session utilisateur trouvée');
          setSecurityError('Session expirée. Veuillez vous reconnecter.');
          setLoading(false);
          setTimeout(() => navigate('/pages/connexion'), 2000);
          return;
        }

        console.log('👤 [Paiement] Utilisateur connecté:', userIdFromSession);

        // Vérifier la cohérence avec l'URL
        if (userId) {
          const userIdFromUrl = parseInt(userId);

          console.log('🔍 [Paiement] Comparaison des identifiants:', {
            urlUserId: userIdFromUrl,
            sessionUserId: userIdFromSession,
            match: userIdFromUrl === userIdFromSession
          });

          if (userIdFromUrl !== userIdFromSession) {
            console.error('🚨 [Paiement] SÉCURITÉ COMPROMISE: Tentative d\'accès à une échéance d\'un autre utilisateur !');
            
            setLoading(false);
            setIsVerifyingAccess(false);
            
            setSecurityModalData({
              userConnected: userIdFromSession,
              userTarget: userIdFromUrl,
              echeanceId: echeanceId || undefined,
              commandeId: commandeId || undefined
            });
            
            setShowSecurityModal(true);
            setUserIdMismatch(true);
            
            console.log('🛑 [Paiement] ARRÊT IMMÉDIAT - Modal de sécurité affichée');
            return;
          }

          console.log('✅ [Paiement] Vérification identité réussie - Accès autorisé');
        }

      } catch (error) {
        console.error('❌ [Paiement] Erreur vérification identité:', error);
        setLoading(false);
        setSecurityError('Erreur de vérification d\'identité. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/pages/connexion'), 2000);
      }
    };

    verifierIdentiteUtilisateur();
  }, [userId, navigate, echeanceId, commandeId]);

  // MODIFIÉ: useEffect pour gérer les données d'échéance avec le hook - SIMPLIFIÉ
  useEffect(() => {
    if (paymentType === 'echeance') {
      console.log('💰 [PaiementPage] Gestion échéance avec hook:', {
        echeanceId,
        userIdNumber,
        echeanceData: !!echeanceData,
        echeanceLoading,
        echeanceError,
        echeanceIsError
      });

      if (echeanceIsError && echeanceError) {
        console.error('❌ [PaiementPage] Erreur hook échéance:', echeanceError);
        setError(`Erreur de chargement de l'échéance: ${echeanceError.message}`);
        setLoading(false);
        return;
      }

      if (!echeanceLoading && echeanceData) {
        console.log('✅ [PaiementPage] Données échéance reçues:', echeanceData);
        setLoading(false);
      }
      
      // AJOUTÉ: Gérer le cas où le hook n'est pas activé
      if (!echeanceLoading && !echeanceData && !echeanceIsError && echeanceId && userIdNumber) {
        console.warn('⚠️ [PaiementPage] Hook échéance non activé - conditions non remplies');
        setError('Impossible de charger l\'échéance - paramètres manquants');
        setLoading(false);
      }
      
    } else {
      // Pour les commandes, sortir du loading si on a les paramètres nécessaires
      if (paymentType === 'commande' && commandeId && userIdNumber && connectedUserId) {
        console.log('🛒 [PaiementPage] Type commande - conditions loading remplies');
        setLoading(false);
      }
    }
  }, [paymentType, echeanceData, echeanceLoading, echeanceError, echeanceIsError, echeanceId, userIdNumber]); // SIMPLIFIÉ: Moins de dépendances

  // AJOUTÉ: useEffect pour créer le PaymentIntent automatiquement
  useEffect(() => {
    const creerPaymentIntent = async () => {
      // CORRIGÉ: Vérifications de sécurité simplifiées
      if (userIdMismatch || securityError || showSecurityModal || !connectedUserId || !userIdNumber) {
        console.log('🛑 [PaiementPage] Création PaymentIntent bloquée');
        return;
      }

      try {
        if (paymentType === 'echeance' && echeanceData && !clientSecret) {
          console.log('💳 [PaiementPage] Création PaymentIntent échéance...');
          
          const result = await createPaymentIntentEcheance.mutateAsync({
            currency: 'eur',
            description: `Paiement échéance #${echeanceId} - ${echeanceData.description || 'Cotisation'}`
          });

          console.log('✅ [PaiementPage] PaymentIntent échéance créé:', result);
          setClientSecret(result.client_secret);
          setPaymentIntentId(result.payment_intent_id);

        } else if (paymentType === 'commande' && commandeId && !clientSecret) {
          console.log('🛒 [PaiementPage] Création PaymentIntent commande...');
          
          // CORRIGÉ: Récupération token simplifiée
          const token = localStorage.getItem('token') || 
                       JSON.parse(localStorage.getItem('userData') || '{}').token;

          if (!token) {
            throw new Error('Token d\'authentification manquant');
          }

          setLoading(false); // Forcer la sortie du loading
          
          const response = await fetch(apiUrl('paiements/stripe/create-payment-intent-commande'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              commande: parseInt(commandeId),
              currency: 'eur',
              description: `Paiement commande #${commandeId}`
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur ${response.status}: ${errorData.error || response.statusText}`);
          }

          const paymentIntentData = await response.json();
          
          if (!paymentIntentData.client_secret) {
            throw new Error('client_secret manquant dans la réponse');
          }
          
          setClientSecret(paymentIntentData.client_secret);
          setPaymentIntentId(paymentIntentData.payment_intent_id);
          
          // CORRIGÉ: Données commande simplifiées
          const actualCommandeId = paymentIntentData.commande_id || commandeId;
          setCommandeData({
            id: actualCommandeId,
            total: paymentIntentData.amount / 100,
            nb_articles: 1,
            statut: 'en_attente',
            numero_commande: `CMD-${actualCommandeId}`
          });
          
          setLoading(false);
        }
      } catch (paymentIntentError: any) {
        console.error('❌ [PaiementPage] Erreur création PaymentIntent:', paymentIntentError);
        setError(`Erreur d'initialisation du paiement: ${paymentIntentError.message}`);
        setLoading(false);
      }
    };

    // CORRIGÉ: Conditions simplifiées
    const shouldCreatePaymentIntent = (
      paymentType &&
      connectedUserId &&
      userIdNumber &&
      !userIdMismatch &&
      !showSecurityModal &&
      !clientSecret &&
      (
        (paymentType === 'echeance' && echeanceData) ||
        (paymentType === 'commande' && commandeId)
      )
    );

    if (shouldCreatePaymentIntent) {
      creerPaymentIntent();
    }
  }, [
    paymentType,
    echeanceData,
    commandeId,
    connectedUserId,
    userIdNumber,
    userIdMismatch,
    showSecurityModal,
    clientSecret,
    createPaymentIntentEcheance
  ]);

  // CORRIGÉ: Fonction handlePaymentSuccess simplifiée
  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('🎉 [PaiementPage] Paiement réussi:', { paymentType, userId, paymentResult });

    try {
      // CORRIGÉ: Récupération du montant simplifiée
      let amount = 0;
      if (paymentType === 'echeance' && echeanceData) {
        amount = echeanceData.montant;
      } else if (paymentType === 'commande' && commandeData) {
        amount = commandeData.total;
      }

      if (paymentType === 'echeance') {
        // UTILISER LE HOOK DE CONFIRMATION POUR LES ÉCHÉANCES
        const confirmData = {
          paymentIntentId: paymentResult.paymentIntent.id,
          echeanceId: echeanceId!,
          userId: userIdNumber!,
          amount: amount
        };

        const result = await confirmPaymentMutation.mutateAsync(confirmData);
        setConfirmationResult(result);
        setPaymentSuccess(true);

      } else if (paymentType === 'commande') {
        // CORRIGÉ: Confirmation commande simplifiée
        const token = localStorage.getItem('token') ||
          JSON.parse(localStorage.getItem('userData') || '{}').token;

        const confirmData = {
          paymentIntentId: paymentResult.paymentIntent.id,
          commandeId: commandeData?.id || parseInt(commandeId!),
          userId: userIdNumber!,
          amount: amount
        };

        const response = await fetch(apiUrl('paiements/confirmation/confirm-payment'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(confirmData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const result = await response.json();
        setConfirmationResult(result);
        setPaymentSuccess(true);
      }

      // Redirection après succès
      setTimeout(() => {
        if (paymentType === 'commande') {
          navigate('/pages/magasin/magasin?payment_success=true');
        } else {
          navigate('/pages/compte?tab=2&success=true');
        }
      }, 3000);

    } catch (error: any) {
      console.error(`❌ [PaiementPage] Erreur confirmation:`, error);
      setError(`⚠️ Paiement traité mais problème de confirmation: ${error.message}`);
      
      // Redirection de secours
      setTimeout(() => {
        navigate(paymentType === 'commande' ? '/pages/magasin/magasin' : '/pages/compte?tab=2');
      }, 3000);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('❌ [PaiementPage] Erreur de paiement:', error);

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

  // VARIABLES CALCULÉES APRÈS LES HOOKS
  const currentData = paymentType === 'echeance' ? echeanceData : commandeData;
  const currentId = paymentType === 'echeance' ? echeanceId : (commandeData?.unique_id || commandeData?.numero_commande || commandeId);
  const currentAmount = paymentType === 'echeance' ? currentData?.montant : currentData?.total;
  const currentDescription = paymentType === 'echeance' ?
    (currentData?.description || 'Description non disponible') :
    (`${currentData?.numero_commande || 'Commande magasin'} #${commandeId}`);

  // MODIFIÉ: Conditions de loading avec debug - DÉPLACÉ AVANT LES RETURNS
  const isLoading = loading || 
    (paymentType === 'echeance' && echeanceLoading) ||
    createPaymentIntentEcheance.isPending ||
    confirmPaymentMutation.isPending;

  // AJOUTÉ: Debug de l'état complet
  console.log('🔍 [PaiementPage] État complet debug:', {
    loading,
    isLoading,
    paymentType,
    clientSecret: !!clientSecret,
    commandeData: !!commandeData,
    echeanceData: !!echeanceData,
    commandeId,
    userId,
    connectedUserId,
    userIdNumber
  });

  // AJOUTÉ: Render prioritaire pour la modal de sécurité
  if (showSecurityModal && securityModalData) {
    return (
      <Page>
        <PageHeader
          title="⚠️ Accès non autorisé"
          subtitle="Vérification de sécurité"
          variant="danger"
        />
        <PageSection>
          <Alert variant="danger" title="Accès non autorisé">
            <p>Vous essayez d'accéder à un paiement qui ne vous appartient pas.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate('/pages/compte');
                }}
              >
                🏠 Aller à mon compte
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate('/pages/connexion');
                }}
                style={{ marginLeft: '1rem' }}
              >
                🔐 Se reconnecter
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // VÉRIFICATIONS ET RETURNS CONDITIONNELS SEULEMENT APRÈS TOUS LES HOOKS

  // Debug logs
  console.log('🔥 [PaiementPage] Debug URL multi-type:', {
    href: window.location?.href || 'Non disponible',
    paymentType,
    echeanceId: echeanceId || 'null',
    commandeId: commandeId || 'null',
    userId_extracted: userId || 'null'
  });

  // Vérifications des paramètres APRÈS tous les hooks
  if (!userId || userId === 'null' || userId === '' || userId === 'undefined') {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur d'accès"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Accès non autorisé">
            <p>Impossible de vérifier votre identité. Veuillez vous reconnecter.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate('/pages/connexion')}
              >
                Se connecter
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (paymentType === 'echeance' && (!echeanceId || echeanceId === 'null')) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement de l'échéance"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Échéance introuvable">
            <p>Impossible de charger les détails de l'échéance.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate('/pages/compte?tab=2')}
              >
                Retour à mon compte
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (paymentType === 'commande' && (!commandeId || commandeId === 'null')) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement de la commande"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Commande introuvable">
            <p>Impossible de charger les détails de la commande.</p>
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate('/pages/magasin/magasin')}
              >
                Retour au magasin
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (isLoading) {
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
                {paymentType === 'echeance' && echeanceLoading && 'Chargement de l\'échéance...'}
                {createPaymentIntentEcheance.isPending && 'Initialisation du paiement...'}
                {confirmPaymentMutation.isPending && 'Confirmation du paiement...'}
                {!echeanceLoading && !createPaymentIntentEcheance.isPending && !confirmPaymentMutation.isPending && 'Chargement des informations de paiement...'}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
                {paymentType === 'echeance' ? `Échéance: ${echeanceId}` : `Commande: ${commandeId}`} - Utilisateur: {userId}
              </div>
              {/* AJOUTÉ: Debug du loading */}
              <div style={{ marginTop: '1rem', fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                Debug: loading={loading ? 'true' : 'false'}, clientSecret={clientSecret ? 'présent' : 'absent'}, 
                commandeData={commandeData ? 'présent' : 'absent'}
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </Page>
    );
  }

  if (!currentData) {
    console.error(`🚨 [PaiementPage] ${paymentType}Data est null/undefined`);
    
    // SIMPLIFIÉ: Debug sans appels supplémentaires
    if (paymentType === 'echeance') {
      console.error('🚨 [PaiementPage] Debug échéance:', {
        echeanceId,
        userIdNumber,
        connectedUserId,
        echeanceData: !!echeanceData,
        echeanceLoading,
        echeanceError,
        echeanceIsError
      });
      
      // SUPPRIMÉ: Le code qui faisait des appels supplémentaires
      // Plus de tentatives de rechargement ici
    }
    
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement des données"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Données manquantes">
            <p>Impossible de charger les données de {paymentType === 'echeance' ? 'l\'échéance' : 'la commande'}.</p>
            
            {/* DEBUG simplifié sans appels */}
            {paymentType === 'echeance' && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <strong>Debug échéance:</strong><br />
                ID échéance: {echeanceId || 'MANQUANT'}<br />
                ID utilisateur: {userIdNumber || 'MANQUANT'}<br />
                Hook loading: {echeanceLoading ? 'true' : 'false'}<br />
                Hook error: {echeanceError?.message || 'none'}<br />
                Hook data: {echeanceData ? 'présent' : 'absent'}<br />
                Conditions hook: {(paymentType === 'echeance' && echeanceId && userIdNumber) ? 'OK' : 'KO'}
              </div>
            )}
            
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate(paymentType === 'echeance' ? '/pages/compte?tab=2' : '/pages/magasin/magasin')}
              >
                Retour {paymentType === 'echeance' ? 'au compte' : 'au magasin'}
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
              onClick={() => navigate(paymentType === 'echeance' ? '/pages/compte?tab=2' : '/pages/magasin/magasin')}
            >
              {paymentType === 'echeance' ? 'Accéder à mon compte' : 'Retour au magasin'}
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
                      Votre paiement de <strong>{formatMontant(currentAmount || 0)}</strong> a été traité avec succès.
                    </p>
                    <p>
                      Référence : <strong>#{currentId}</strong>
                    </p>
                    
                    {/* Message spécial pour premier paiement */}
                    {window.location.href.includes('first_payment=true') && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
                        <p style={{ color: '#0c5460', fontWeight: 'bold', margin: 0 }}>
                          🎉 <strong>Félicitations !</strong> Votre compte a été activé.
                        </p>
                        <p style={{ color: '#0c5460', margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                          Vous êtes maintenant membre du club et avez accès à tous nos services.
                        </p>
                      </div>
                    )}
                    
                    {/* CORRIGÉ: Vérifier que confirmationResult existe avant de l'utiliser */}
                    {confirmationResult?.statut_upgrade && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: confirmationResult.statut_upgrade.includes('→') ? '#d1ecf1' : '#f8f9fa', borderRadius: '4px' }}>
                        {confirmationResult.statut_upgrade.includes('→') ? (
                          <>
                            <p style={{ color: '#0c5460', fontWeight: 'bold', margin: 0 }}>
                              🎉 <strong>Félicitations !</strong> Promotion de compte effectuée.
                            </p>
                            <p style={{ color: '#0c5460', margin: '0.5rem 0 0 0', fontSize: '14px' }}>
                              Statut mis à jour : {confirmationResult.statut_upgrade}
                            </p>
                          </>
                        ) : (
                          <p style={{ color: '#495057', margin: 0, fontSize: '14px' }}>
                            ℹ️ Statut maintenu : {confirmationResult.statut_upgrade}
                          </p>
                        )}
                      </div>
                    )}
                  </Alert>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <p>✅ {paymentType === 'echeance' ? 'Votre accès aux services du club est maintenu' : 'Votre commande a été confirmée'}</p>
                    {/* CORRIGÉ: Vérifier confirmationResult avant utilisation */}
                    {window.location.href.includes('first_payment=true') ? (
                      <p>🏆 Bienvenue officiellement dans notre club !</p>
                    ) : confirmationResult?.premier_paiement && confirmationResult?.statut_upgrade?.includes('→') ? (
                      <p>🎉 Bienvenue dans notre club ! Votre statut a été mis à jour.</p>
                    ) : confirmationResult?.premier_paiement ? (
                      <p>🎉 Merci pour votre premier paiement ! Votre statut reste inchangé.</p>
                    ) : (
                      <p>📧 Un reçu de paiement vous sera envoyé par email</p>
                    )}
                    <p>🔄 Redirection automatique dans quelques secondes...</p>
                  </div>
                  
                  <Button
                    variant="primary"
                    onClick={() => navigate(paymentType === 'echeance' ? '/pages/compte?tab=2&success=true' : '/pages/magasin/magasin?payment_success=true')}
                  >
                    {paymentType === 'echeance' ? 'Accéder à mon compte' : 'Retour au magasin'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </PageSection>
      </Page>
    );
  }

  // CORRIGÉ: Configuration Stripe simplifiée
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
    },
  };
  
  const options = {
    clientSecret,
    appearance,
    // CRITIQUE: Configuration minimale pour éviter les appels API automatiques
    paymentMethodCreation: 'manual' as const,
    mode: 'payment' as const
  };

  // RENDER PRINCIPAL
  return (
    <Page>
      <PageHeader
        title="Paiement en ligne"
        subtitle={`Finalisez votre ${paymentType === 'echeance' ? 'paiement d\'échéance' : 'commande'} rapidement et en toute sécurité`}
        variant="payment"
      />

      <PageSection>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Debug avec hooks */}
          <div style={{
            background: '#e7f3ff',
            border: '1px solid #bee5eb',
            borderRadius: '8px',
            padding: '1rem',
            margin: '0 0 1rem 0',
            fontSize: '14px'
          }}>
            <strong>🔧 Debug PaiementPage (avec hooks):</strong>
            <br />
            <strong>🎯 Type:</strong> {paymentType} {paymentType === 'echeance' ? '💰' : '🛒'}
            <br />
            <strong>🔑 userId:</strong> {userId || 'ERREUR'} {userId ? '✅' : '❌'}
            <br />
            <strong>📊 ID:</strong> {currentId || 'ERREUR'} {currentId ? '✅' : '❌'}
            <br />
            <strong>💰 Montant:</strong> {currentAmount ? formatMontant(currentAmount) : 'ERREUR'}
            <br />
            <strong>🔄 Hooks:</strong> Échéance={echeanceLoading ? 'Loading...' : echeanceData ? '✅' : '❌'} | PaymentIntent={createPaymentIntentEcheance.isPending ? 'Creating...' : clientSecret ? '✅' : '❌'}
          </div>

          {/* Bouton retour adapté */}
          <div style={{ marginBottom: '1rem' }}>
            <Button
              variant="link"
              icon={<ArrowLeftIcon />}
              onClick={() => navigate(paymentType === 'echeance' ? '/pages/compte' : '/pages/magasin/magasin')}
            >
              Retour {paymentType === 'echeance' ? 'au compte' : 'au magasin'}
            </Button>
          </div>

          {/* Alerte adaptée */}
          <Alert
            variant="warning"
            title={paymentType === 'echeance' ? 'Paiement en attente' : 'Finalisation de commande'}
            style={{ marginBottom: '2rem' }}
          >
            <p>
              {paymentType === 'echeance' ?
                'Vous avez été redirigé vers cette page pour régulariser une échéance de paiement.' :
                'Finalisez votre commande en effectuant le paiement ci-dessous.'
              }
            </p>
          </Alert>

          {/* Détails adaptés */}
          <Card style={{ marginBottom: '2rem' }}>
            <CardBody>
              <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
                {paymentType === 'echeance' ? (
                  <>
                    <ExclamationTriangleIcon style={{ marginRight: '8px', color: '#f0ad4e' }} />
                    Détails de l'échéance
                  </>
                ) : (
                  <>
                    <CreditCardIcon style={{ marginRight: '8px', color: '#28a745' }} />
                    Détails de la commande
                  </>
                )}
              </Title>

              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Référence :</strong>
                    </FlexItem>
                    <FlexItem>#{currentId || 'N/A'}</FlexItem>
                  </Flex>
                </FlexItem>

                <FlexItem>
                  <Flex>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Description :</strong>
                    </FlexItem>
                    <FlexItem>{currentDescription}</FlexItem>
                  </Flex>
                </FlexItem>

                {paymentType === 'echeance' && (
                  <FlexItem>
                    <Flex>
                      <FlexItem style={{ minWidth: '150px' }}>
                        <strong>Date d'échéance :</strong>
                      </FlexItem>
                      <FlexItem>
                        {formatDate(currentData?.dateEcheance || currentData?.date_echeance || '')}
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                )}

                {paymentType === 'commande' && currentData?.nb_articles && (
                  <FlexItem>
                    <Flex>
                      <FlexItem style={{ minWidth: '150px' }}>
                        <strong>Articles :</strong>
                      </FlexItem>
                      <FlexItem>
                        {currentData.nb_articles} article(s)
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                )}

                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem style={{ minWidth: '150px' }}>
                      <strong>Montant à payer :</strong>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                        {formatMontant(currentAmount || 0)}
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
                        {currentData?.statut || 'En attente de paiement'}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>

          {/* Section de paiement */}
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

              {/* CORRIGÉ: Formulaire Stripe simplifié */}
              {clientSecret && stripePromise ? (
                <Elements options={options} stripe={stripePromise}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={currentAmount}
                    description={currentDescription}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    echeanceId={paymentType === 'echeance' ? echeanceId : undefined}
                    commandeId={paymentType === 'commande' ? commandeId : undefined}
                    userId={userId}
                    returnUrl={`${window.location.origin}/pages/paiement?${paymentType}=${currentId}&userId=${userId}&payment_return=true`}
                  />
                </Elements>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner size="lg" />
                  <div style={{ marginTop: '1rem' }}>
                    Initialisation du paiement sécurisé...
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
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ marginBottom: '0.5rem', color: '#495057' }}>💳 Autres moyens de paiement :</h5>
                <p style={{ marginBottom: '0.5rem', color: '#6c757d' }}>
                  Si vous préférez, vous pouvez également régler par virement bancaire ou chèque.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    navigate('/pages/compte?tab=2&contact=payment');
                  }}
                >
                  Demander des informations de paiement alternatif
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </PageSection>
    </Page>
  );
};

export default PaiementPage;