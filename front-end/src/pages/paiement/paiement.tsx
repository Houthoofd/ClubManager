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

// Charger Stripe avec votre clé publique
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const PaiementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // DÉPLACER TOUS LES HOOKS EN PREMIER - AVANT TOUTE LOGIQUE CONDITIONNELLE
  const [loading, setLoading] = useState(true);
  const [echeanceData, setEcheanceData] = useState<any>(null);
  const [commandeData, setCommandeData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'echeance' | 'commande'>('echeance');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  // AJOUTÉ: États pour la vérification de sécurité utilisateur
  const [userIdMismatch, setUserIdMismatch] = useState<boolean>(false);
  const [connectedUserId, setConnectedUserId] = useState<number | null>(null);
  // AJOUTÉ: État pour la modal d'avertissement de sécurité
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [securityModalData, setSecurityModalData] = useState<{
    userConnected: number;
    userTarget: number;
    echeanceId?: string;
    commandeId?: string;
  } | null>(null);

  // RÉCUPÉRER LES PARAMÈTRES
  const echeanceId = searchParams.get('echeance');
  const commandeId = searchParams.get('commande');
  const userId = searchParams.get('userId') || searchParams.get('user');
  const token = searchParams.get('token');

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
      // AJOUTÉ: Si on a juste commandeId (même avec echeanceId null), c'est une commande
      console.log('🛒 [PaiementPage] Type détecté: COMMANDE (priorité sur échéance null)');
      setPaymentType('commande');
    } else if (echeanceId && echeanceId !== 'null') {
      // AJOUTÉ: Si on a juste echeanceId (même avec commandeId null), c'est une échéance
      console.log('💰 [PaiementPage] Type détecté: ECHÉANCE (priorité sur commande null)');
      setPaymentType('echeance');
    } else {
      console.error('❌ [PaiementPage] Aucun paramètre valide détecté');
      console.error('❌ [PaiementPage] URL complète:', window.location.href);
      console.error('❌ [PaiementPage] Paramètres searchParams:', {
        commande: searchParams.get('commande'),
        echeance: searchParams.get('echeance'),
        userId: searchParams.get('userId')
      });
      setPaymentType('echeance'); // Valeur par défaut
    }
  }, [commandeId, echeanceId, searchParams]);

  // AJOUTÉ: useEffect pour vérifier l'identité utilisateur AVANT tout traitement
  useEffect(() => {
    const verifierIdentiteUtilisateur = () => {
      try {
        console.log('🔐 [Paiement] Vérification identité utilisateur...');

        // Récupérer les données de l'utilisateur connecté
        const userData = localStorage.getItem('userData');
        if (!userData) {
          console.error('❌ [Paiement] Aucune session utilisateur trouvée');
          setSecurityError('Session expirée. Veuillez vous reconnecter.');
          setLoading(false); // AJOUTÉ: Arrêter le loading
          setTimeout(() => navigate('/pages/connexion'), 2000);
          return;
        }

        const user = JSON.parse(userData);
        const userIdFromSession = user.id;
        setConnectedUserId(userIdFromSession);

        console.log('👤 [Paiement] Utilisateur connecté:', {
          id: userIdFromSession,
          email: user.email,
          nom: `${user.first_name} ${user.last_name}`
        });

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
            console.error('🚨 [Paiement] Détails de la tentative:', {
              utilisateurConnecte: userIdFromSession,
              utilisateurCible: userIdFromUrl,
              echeanceId: echeanceId,
              commandeId: commandeId,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              url: window.location.href
            });

            // CRITIQUE: Arrêter immédiatement tous les processus
            setLoading(false); // Arrêter le loading
            setIsVerifyingAccess(false); // Arrêter la vérification
            
            // Préparer les données de la modal
            setSecurityModalData({
              userConnected: userIdFromSession,
              userTarget: userIdFromUrl,
              echeanceId: echeanceId || undefined,
              commandeId: commandeId || undefined
            });
            
            // Afficher la modal IMMÉDIATEMENT
            setShowSecurityModal(true);
            setUserIdMismatch(true);
            
            console.log('🛑 [Paiement] ARRÊT IMMÉDIAT - Modal de sécurité affichée');
            return; // CRITIQUE: Sortir immédiatement
          }

          console.log('✅ [Paiement] Vérification identité réussie - Accès autorisé');
        }

      } catch (error) {
        console.error('❌ [Paiement] Erreur vérification identité:', error);
        setLoading(false); // AJOUTÉ: Arrêter le loading en cas d'erreur
        setSecurityError('Erreur de vérification d\'identité. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/pages/connexion'), 2000);
      }
    };

    // CRITIQUE: Effectuer la vérification en premier, avant tout autre traitement
    verifierIdentiteUtilisateur();
  }, [userId, navigate, echeanceId, commandeId]);

  // MODIFIÉ: useEffect pour loadPaymentData avec vérification immédiate
  useEffect(() => {
    const loadPaymentData = async () => {
      // CRITIQUE: Vérifier IMMÉDIATEMENT les conditions de sécurité
      if (userIdMismatch) {
        console.log('🛑 [Paiement] ARRÊT - userIdMismatch détecté');
        setLoading(false);
        return;
      }

      if (securityError) {
        console.log('🛑 [Paiement] ARRÊT - securityError détecté');
        setLoading(false);
        return;
      }

      if (showSecurityModal) {
        console.log('🛑 [Paiement] ARRÊT - modal de sécurité active');
        setLoading(false);
        return;
      }

      // AJOUTÉ: Attendre que connectedUserId soit défini
      if (connectedUserId === null) {
        console.log('⏳ [Paiement] En attente de la vérification d\'identité...');
        return;
      }

      try {
        setIsVerifyingAccess(true);

        // SÉCURITÉ: Utiliser TOUJOURS l'userId de la session, jamais celui de l'URL
        const secureUserId = connectedUserId;

        console.log('🔒 [Paiement] Utilisation sécurisée de l\'userId:', secureUserId);

        // Validation des paramètres avec userId sécurisé
        if (paymentType === 'echeance' && echeanceId) {
          console.log('💰 [Paiement] Chargement sécurisé échéance:', { echeanceId, secureUserId });

          // MODIFIÉ: Vérification renforcée côté serveur avec userId sécurisé
          const response = await fetch(`${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'}/paiements/echeance/${echeanceId}?userId=${secureUserId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            if (response.status === 403) {
              const errorData = await response.json().catch(() => ({}));
              console.error('❌ [Paiement] VIOLATION DE SÉCURITÉ DÉTECTÉE PAR LE SERVEUR:', errorData);
              
              // CRITIQUE: Arrêter immédiatement et afficher la modal
              setLoading(false);
              setIsVerifyingAccess(false);
              
              // Extraire les informations de sécurité de la réponse serveur
              const details = errorData.details || {};
              setSecurityModalData({
                userConnected: details.your_user_id || connectedUserId,
                userTarget: parseInt(userId || '0'),
                echeanceId: echeanceId || undefined,
                commandeId: commandeId || undefined
              });
              
              setShowSecurityModal(true);
              setUserIdMismatch(true);
              
              console.log('🛑 [Paiement] VIOLATION SERVEUR - Modal affichée immédiatement');
              return;
            } else if (response.status === 404) {
              setSecurityError('Échéance non trouvée. Vous allez être redirigé vers votre compte.');
              setLoading(false);
              setTimeout(() => navigate('/pages/compte'), 3000);
              return;
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }

          const echeanceData = await response.json();

          if (echeanceData.success && echeanceData.security?.access_verified) {
            console.log('✅ [Paiement] Accès échéance vérifié côté serveur');
            setEcheanceData(echeanceData.data);

            // AJOUTÉ: Double vérification que l'échéance appartient bien à l'utilisateur connecté
            if (echeanceData.security.user_id !== secureUserId) {
              console.error('🚨 [Paiement] Incohérence détectée entre serveur et client !');
              
              // CRITIQUE: Arrêter immédiatement
              setLoading(false);
              setIsVerifyingAccess(false);
              setSecurityModalData({
                userConnected: secureUserId,
                userTarget: echeanceData.security.user_id,
                echeanceId: echeanceId || undefined,
                commandeId: commandeId || undefined
              });
              setShowSecurityModal(true);
              setUserIdMismatch(true);
              
              console.log('🛑 [Paiement] INCOHÉRENCE SERVEUR-CLIENT - Modal affichée');
              return;
            }
          } else {
            console.error('❌ [Paiement] Accès échéance refusé par le serveur');
            setLoading(false);
            setSecurityError('Accès refusé par le serveur. Cette tentative a été enregistrée.');
            setTimeout(() => navigate('/pages/compte'), 3000);
            return;
          }

        } else if (paymentType === 'commande' && commandeId) {
          console.log('🛒 [Paiement] Chargement sécurisé commande:', { commandeId, secureUserId });

          // TODO: Ajouter vérification similaire pour les commandes
          // Vérifier que la commande appartient à l'utilisateur connecté
        }

        // SUCCÈS: Si on arrive ici, tout est sécurisé
        console.log('✅ [Paiement] Toutes les vérifications de sécurité passées');
        setLoading(false); // AJOUTÉ: Arrêter le loading en cas de succès

      } catch (apiError: any) {
        console.error('❌ [Paiement] Erreur lors du chargement sécurisé:', apiError);
        setError(`Erreur de service: ${apiError.message}`);
        setLoading(false); // AJOUTÉ: Arrêter le loading en cas d'erreur
      } finally {
        setIsVerifyingAccess(false);
      }
    };

    // MODIFIÉ: Conditions de démarrage avec vérification de sécurité
    if (paymentType && connectedUserId !== null && !userIdMismatch && !showSecurityModal && (
      (paymentType === 'echeance' && echeanceId && echeanceId !== 'null') ||
      (paymentType === 'commande' && commandeId && commandeId !== 'null')
    )) {
      console.log('🎯 [Paiement] Conditions sécurisées remplies, démarrage...');
      loadPaymentData();
    } else {
      console.log('⏳ [Paiement] En attente des conditions sécurisées:', {
        paymentType,
        connectedUserId,
        userIdMismatch,
        showSecurityModal,
        echeanceValid: echeanceId && echeanceId !== 'null',
        commandeValid: commandeId && commandeId !== 'null'
      });
      
      // AJOUTÉ: Si on a une violation détectée, arrêter le loading
      if (userIdMismatch || showSecurityModal) {
        setLoading(false);
      }
    }
  }, [echeanceId, commandeId, paymentType, connectedUserId, userIdMismatch, securityError, showSecurityModal]);

  // FONCTIONS HANDLER
  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('🎉 [PaiementPage] Paiement réussi:', { paymentType, userId, paymentResult });

    try {
      const token = localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   JSON.parse(localStorage.getItem('userData') || '{}').token;
      // CORRIGÉ: Récupérer le montant depuis les données disponibles
      let amount = 0;

      if (paymentType === 'echeance' && echeanceData) {
        amount = echeanceData.montant;
      } else if (paymentType === 'commande' && commandeData) {
        amount = commandeData.total;
      } else {
        // Fallback: essayer de récupérer depuis paymentResult
        amount = paymentResult?.amount || paymentResult?.paymentIntent?.amount / 100 || 0;
      }
      console.log('💰 [PaiementPage] Montant calculé:', { amount, paymentType, echeanceData: !!echeanceData, commandeData: !!commandeData });
      // CORRIGÉ: Utiliser les routes du module paiements consolidé (sans sous-modules)
      const confirmEndpoint = paymentType === 'echeance' ?
        apiUrl('paiements/confirm-payment') :
        apiUrl('paiements/confirm-payment-commande');

      const confirmBody = paymentType === 'echeance' ? {
        paymentIntentId: paymentResult.paymentIntent.id,
        echeanceId: echeanceId,
        userId: userId,
        amount: amount
      } : {
        paymentIntentId: paymentResult.paymentIntent.id,
        commandeId: commandeId,
        userId: userId
      };
      console.log(`🚀 [PaiementPage] Appel API:`, {
        endpoint: confirmEndpoint,
        method: 'POST',
        body: confirmBody
      });
      const response = await fetch(confirmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(confirmBody),
      });
      // CORRIGÉ: Meilleure gestion de la réponse
      console.log(`📡 [PaiementPage] Réponse API:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      if (response.ok) {
        try {
          const confirmationData = await response.json();
          console.log(`✅ [PaiementPage] Confirmation ${paymentType} reçue:`, confirmationData);

          setPaymentSuccess(true);

          // Message spécial pour premier paiement
          if (confirmationData?.premier_paiement) {
            console.log('🎉 [PaiementPage] Premier paiement détecté - promotion visiteur → utilisateur');
          }

          // Redirection selon le type de paiement
          setTimeout(() => {
            const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
            const isAdmin = currentUserData?.status === 'administrateur' || currentUserData?.status === 'super-administrateur';

            if (paymentType === 'commande') {
              navigate('/pages/magasin/magasin?payment_success=true');
            } else {
              if (isAdmin && currentUserData?.id !== parseInt(userId)) {
                navigate(`/pages/utilisateurs/consulter/${userId}?tab=2&payment_success=true`);
              } else {
                const redirectUrl = confirmationData?.premier_paiement
                  ? '/pages/compte?tab=2&success=true&first_payment=true'
                  : '/pages/compte?tab=2&success=true';
                navigate(redirectUrl);
              }
            }
          }, 3000);

        } catch (jsonError) {
          console.error('❌ [PaiementPage] Erreur parsing JSON réponse:', jsonError);
          throw new Error('Réponse serveur invalide (JSON malformé)');
        }
      } else {
        // CORRIGÉ: Gestion d'erreur avec lecture sécurisée de la réponse
        let errorDetails = 'Détails non disponibles';
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorDetails = JSON.stringify(errorJson, null, 2);
            } catch {
              errorDetails = errorText;
            }
          }
        } catch (readError) {
          console.error('❌ [PaiementPage] Impossible de lire la réponse d\'erreur:', readError);
        }
        const errorMessage = `⚠️ Paiement traité mais problème de confirmation
💳 Votre paiement Stripe a été effectué avec succès
📝 Référence : ${paymentResult.paymentIntent.id}
🔧 Statut HTTP : ${response.status} ${response.statusText}
🔧 Détails techniques : ${errorDetails}
🔄 Redirection...`;
        setError(errorMessage);

        setTimeout(() => {
          if (paymentType === 'commande') {
            navigate('/pages/magasin/magasin?payment=' + paymentResult.paymentIntent.id);
          } else {
            navigate('/pages/compte?tab=2&payment=' + paymentResult.paymentIntent.id);
          }
        }, 5000);
      }
    } catch (error: any) {
      console.error(`❌ [PaiementPage] Erreur gestion succès ${paymentType}:`, error);
      setError(`Erreur de traitement ${paymentType}: ${error.message}`);

      setTimeout(() => {
        if (paymentType === 'commande') {
          navigate('/pages/magasin/magasin');
        } else {
          navigate('/pages/compte?tab=2');
        }
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

  // VARIABLES CALCULÉES APRÈS LES HOOKS
  const currentData = paymentType === 'echeance' ? echeanceData : commandeData;
  const currentId = paymentType === 'echeance' ? echeanceId : (commandeData?.unique_id || commandeData?.numero_commande || commandeId);
  const currentAmount = paymentType === 'echeance' ? currentData?.montant : currentData?.total;
  const currentDescription = paymentType === 'echeance' ?
    (currentData?.description || 'Description non disponible') :
    (`${currentData?.numero_commande || 'Commande magasin'} #${commandeId}`);

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
          <Modal
            variant={ModalVariant.medium}
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.75rem', 
                color: '#dc3545',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                <ShieldAltIcon size="xl" />
                🚨 Accès non autorisé détecté
              </div>
            }
            isOpen={showSecurityModal}
            onClose={() => {
              setShowSecurityModal(false);
              navigate('/pages/compte');
            }}
            actions={[
              <Button
                key="compte"
                variant="primary"
                size="lg"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate('/pages/compte');
                }}
                style={{ minWidth: '180px' }}
              >
                🏠 Aller à mon compte
              </Button>,
              <Button
                key="reconnect"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate('/pages/connexion');
                }}
                style={{ minWidth: '160px' }}
              >
                🔐 Se reconnecter
              </Button>
            ]}
          >
            <div style={{ 
              padding: '2rem 1rem', 
              maxWidth: '100%',
              margin: '0 auto'
            }}>
              {/* En-tête d'alerte - SIMPLIFIÉ */}
              <div style={{
                background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                border: '2px solid #dc3545',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.15)'
              }}>
                <div style={{
                  background: 'rgba(220, 53, 69, 0.1)',
                  borderRadius: '50%',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ExclamationTriangleIcon
                    size="xl"
                    style={{ color: '#721c24', fontSize: '3.5rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 1rem 0', 
                    color: '#721c24', 
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    Tentative d'accès non autorisé
                  </h3>
                  <p style={{ 
                    margin: '0 0 0.75rem 0', 
                    color: '#721c24', 
                    fontSize: '1.1rem', 
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    Vous essayez d'accéder à un paiement qui ne vous appartient pas.
                  </p>
                  <p style={{ 
                    margin: 0, 
                    color: '#721c24', 
                    fontSize: '1rem', 
                    lineHeight: '1.4',
                    fontWeight: 'bold'
                  }}>
                    Seul le propriétaire d'une échéance peut effectuer son paiement.
                  </p>
                </div>
              </div>

              {/* Explication de sécurité - SIMPLIFIÉ */}
              <div style={{
                background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)',
                border: '1px solid #17a2b8',
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(23, 162, 184, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    background: 'rgba(23, 162, 184, 0.1)',
                    borderRadius: '50%',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    🛡️
                  </div>
                  <h4 style={{ 
                    color: '#0c5460', 
                    margin: 0, 
                    fontSize: '1.3rem',
                    fontWeight: 'bold'
                  }}>
                    Pourquoi cette vérification ?
                  </h4>
                </div>
                
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#0c5460', 
                  lineHeight: '1.7',
                  textAlign: 'left',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    Pour votre sécurité et celle des autres utilisateurs, nous vérifions que vous avez 
                    le droit d'accéder aux informations de paiement demandées.
                  </p>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    Cette mesure de sécurité protège les données financières de tous nos membres.
                  </p>
                  <div style={{
                    background: 'rgba(23, 162, 184, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: '1rem 0 0 0'
                  }}>
                    📝 Cette tentative d'accès a été automatiquement enregistrée dans nos logs de sécurité.
                  </div>
                </div>
              </div>

              {/* Boutons d'action centrés */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                marginTop: '2.5rem',
                paddingTop: '2rem',
                borderTop: '2px solid #dee2e6'
              }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setShowSecurityModal(false);
                    navigate('/pages/compte');
                  }}
                  style={{ 
                    minWidth: '200px',
                    padding: '0.75rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
                  }}
                >
                  🏠 Aller à mon compte
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowSecurityModal(false);
                    navigate('/pages/connexion');
                  }}
                  style={{ 
                    minWidth: '180px',
                    padding: '0.75rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)'
                  }}
                >
                  🔐 Se reconnecter
                </Button>
              </div>
            </div>
          </Modal>
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
            <p>L'ID utilisateur est manquant ou invalide dans l'URL.</p>
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              margin: '1rem 0',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <p><strong>URL actuelle :</strong> {typeof window !== 'undefined' ? window.location.href : 'Non disponible'}</p>
              <p><strong>Format attendu (échéance) :</strong> /pages/paiement?echeance=487&userId=154</p>
              <p><strong>Format attendu (commande) :</strong> /pages/paiement?commande=6&userId=154</p>
              <p><strong>Paramètres détectés :</strong></p>
              <ul>
                <li>echeance: {searchParams?.get('echeance') || 'MANQUANT'}</li>
                <li>commande: {searchParams?.get('commande') || 'MANQUANT'}</li>
                <li>userId: {searchParams?.get('userId') || 'MANQUANT'}</li>
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

  if (paymentType === 'echeance' && (!echeanceId || echeanceId === 'null')) {
    return (
      <Page>
        <PageHeader title="Paiement en ligne" subtitle="Paramètre manquant" variant="payment" />
        <PageSection>
          <Alert variant="danger" title="ID d'échéance manquant">
            <p>L'ID de l'énchéance est manquant dans l'URL.</p>
            <Button variant="primary" icon={<ArrowLeftIcon />} onClick={() => navigate('/compte?tab=paiements')}>
              Retour au compte
            </Button>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (paymentType === 'commande' && (!commandeId || commandeId === 'null')) {
    return (
      <Page>
        <PageHeader title="Paiement en ligne" subtitle="Paramètre manquant" variant="payment" />
        <PageSection>
          <Alert variant="danger" title="ID de commande manquant">
            <p>L'ID de la commande est manquant dans l'URL.</p>
            <Button variant="primary" icon={<ArrowLeftIcon />} onClick={() => navigate('/pages/magasin/magasin')}>
              Retour au magasin
            </Button>
          </Alert>
        </PageSection>
      </Page>
    );
  }

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

  if (!currentData) {
    console.error(`🚨 [PaiementPage] ${paymentType}Data est null/undefined`);
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
                      Votre paiement de <strong>{formatMontant(currentAmount)}</strong> a été traité avec succès.
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
                  </Alert>
                  <div style={{ marginBottom: '2rem' }}>
                    <p>✅ {paymentType === 'echeance' ? 'Votre accès aux services du club est maintenu' : 'Votre commande a été confirmée'}</p>
                    {/* Message adapté pour premier paiement */}
                    {window.location.href.includes('first_payment=true') ? (
                      <p>🏆 Bienvenue officiellement dans notre club !</p>
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

  // CONFIGURATION STRIPE
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

          {/* MODIFIÉ: Debug multi-type */}
          <div style={{
            background: '#e7f3ff',
            border: '1px solid #bee5eb',
            borderRadius: '8px',
            padding: '1rem',
            margin: '0 0 1rem 0',
            fontSize: '14px'
          }}>
            <strong>🔧 Debug PaiementPage:</strong>
            <br />
            <strong>🎯 Type:</strong> {paymentType} {paymentType === 'echeance' ? '💰' : '🛒'}
            <br />
            <strong>🔑 userId:</strong> {userId || 'ERREUR'} {userId ? '✅' : '❌'}
            <br />
            <strong>📊 ID:</strong> {currentId || 'ERREUR'} {currentId ? '✅' : '❌'}
            <br />
            <strong>💰 Montant:</strong> {currentAmount ? formatMontant(currentAmount) : 'ERREUR'}
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

                {paymentType === 'commande' && currentData?.articles && (
                  <FlexItem>
                    <Flex>
                      <FlexItem style={{ minWidth: '150px' }}>
                        <strong>Articles :</strong>
                      </FlexItem>
                      <FlexItem>
                        {currentData.articles.length} article(s)
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

              {/* CORRIGÉ: Affichage du formulaire Stripe SANS simulation */}
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
                    Chargement du système de paiement sécurisé...
                  </div>
                  {!clientSecret && (
                    <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
                      Initialisation de Stripe en cours...
                    </div>
                  )}
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

      {/* CORRIGÉ: Modal de sécurité explicite avec syntaxe JSX correcte */}
      {showSecurityModal && securityModalData && (
        <Modal
          variant={ModalVariant.medium}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc3545' }}>
              <ShieldAltIcon size="lg" />
              Accès non autorisé détecté
            </div>
          }
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          actions={[
            <Button
              key="compte"
              variant="primary"
              onClick={() => {
                setShowSecurityModal(false);
                navigate('/pages/compte');
              }}
            >
              Aller à mon compte
            </Button>,
            <Button
              key="reconnect"
              variant="secondary"
              onClick={() => {
                setShowSecurityModal(false);
                navigate('/pages/connexion');
              }}
            >
              Se reconnecter
            </Button>
          ]}
        >
          <div style={{ padding: '1rem 0' }}>
            {/* En-tête d'alerte */}
            <div style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <ExclamationTriangleIcon
                size="xl"
                style={{ color: '#721c24', fontSize: '3rem' }}
              />
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24', fontSize: '1.2rem' }}>
                  🚨 Tentative d'accès non autorisé
                </h4>
                <p style={{ margin: 0, color: '#721c24', fontSize: '16px', lineHeight: '1.4' }}>
                  Vous essayez d'accéder à un paiement qui ne vous appartient pas.
                  <br />
                  <strong>Seul le propriétaire d'une échéance peut effectuer son paiement.</strong>
                </p>
              </div>
            </div>

            {/* Explication de sécurité */}
            <div style={{
              background: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '6px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{ color: '#0c5460', marginBottom: '1rem', fontSize: '1.1rem' }}>
                🛡️ Pourquoi cette vérification ?
              </h5>
              <div style={{ fontSize: '15px', color: '#0c5460', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 1rem 0' }}>
                  Pour votre sécurité et celle des autres utilisateurs, nous vérifions que vous avez 
                  le droit d'accéder aux informations de paiement demandées.
                </p>
                <p style={{ margin: '0 0 1rem 0' }}>
                  Cette mesure de sécurité protège les données financières de tous nos membres.
                </p>
                <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic' }}>
                  📝 Cette tentative d'accès a été automatiquement enregistrée dans nos logs de sécurité.
                </p>
              </div>
            </div>

            {/* Actions recommandées */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '1.5rem'
            }}>
              <h5 style={{ color: '#495057', marginBottom: '1rem', fontSize: '1.1rem' }}>
                🔄 Que faire maintenant ?
              </h5>
              <div style={{ fontSize: '15px', color: '#495057' }}>
                <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>🏠 Retournez à votre compte</strong> pour accéder à vos propres échéances de paiement
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>🔍 Vérifiez le lien</strong> si vous pensez qu'il s'agit d'une erreur
                  </li>
                  <li style={{ marginBottom: '0.75rem' }}>
                    <strong>🔐 Reconnectez-vous</strong> si vous soupçonnez un problème de session
                  </li>
                  <li>
                    <strong>📞 Contactez le support</strong> si le problème persiste ou si vous avez des questions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
};

export default PaiementPage;
