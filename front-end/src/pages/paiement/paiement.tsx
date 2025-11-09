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
  
  // DÉPLACER TOUS LES HOOKS EN PREMIER - AVANT TOUTE LOGIQUE CONDITIONNELLE
  const [loading, setLoading] = useState(true);
  const [echeanceData, setEcheanceData] = useState<any>(null);
  const [commandeData, setCommandeData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'echeance' | 'commande'>('echeance');

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

  useEffect(() => {
    const loadPaymentData = async () => {
      // AJOUTÉ: Debug plus détaillé des paramètres
      console.log('🚀 [PaiementPage] loadPaymentData démarré avec:', {
        paymentType,
        echeanceId,
        commandeId,
        userId,
        echeanceIdValid: echeanceId && echeanceId !== 'null',
        commandeIdValid: commandeId && commandeId !== 'null',
        userIdValid: userId && userId !== 'null'
      });

      if ((!echeanceId && !commandeId) || !userId) {
        console.error('🚨 [PaiementPage] Paramètres manquants dans useEffect:', { echeanceId, commandeId, userId });
        setError('Paramètres manquants pour charger les données de paiement');
        setLoading(false);
        return;
      }

      // AJOUTÉ: Vérification supplémentaire pour éviter les valeurs 'null' string
      const validEcheanceId = echeanceId && echeanceId !== 'null' ? echeanceId : null;
      const validCommandeId = commandeId && commandeId !== 'null' ? commandeId : null;
      const validUserId = userId && userId !== 'null' ? userId : null;

      if (!validUserId) {
        console.error('🚨 [PaiementPage] userId invalide après validation:', { userId, validUserId });
        setError('ID utilisateur invalide');
        setLoading(false);
        return;
      }

      console.log('✅ [PaiementPage] Paramètres validés:', {
        paymentType,
        validEcheanceId,
        validCommandeId,
        validUserId
      });

      try {
        const token = localStorage.getItem('token') || 
                     localStorage.getItem('authToken') || 
                     JSON.parse(localStorage.getItem('userData') || '{}').token;

        console.log('🎯 [PaiementPage] Type de paiement détecté:', paymentType);
        console.log('🔍 [PaiementPage] Paramètres disponibles:', { 
          validEcheanceId, 
          validCommandeId, 
          validUserId 
        });

        if (paymentType === 'echeance' && validEcheanceId) {
          // EXISTANT: Chargement échéance - SEULEMENT si on a un echeanceId valide
          console.log('🔍 [PaiementPage] Chargement échéance:', { validEcheanceId, validUserId });

          const echeanceResponse = await fetch(apiUrl(`paiements/echeance/${validEcheanceId}?userId=${validUserId}`), {
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
          setEcheanceData(echeance);

          // CORRIGÉ: Créer PaymentIntent via la route consolidée
          const paymentIntentResponse = await fetch(apiUrl('paiements/create-payment-intent'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              amount: Math.round((echeance.montant || 0) * 100),
              currency: 'eur',
              echeanceId: echeanceId,
              userId: userId,
              description: echeance.description || `Paiement échéance #${echeanceId}`
            }),
          });

          if (paymentIntentResponse.ok) {
            const paymentData = await paymentIntentResponse.json();
            setClientSecret(paymentData?.client_secret || '');
            setPaymentIntentId(paymentData?.payment_intent_id || '');
          } else {
            const errorData = await paymentIntentResponse.json();
            throw new Error(errorData?.error || 'Erreur lors de la création du PaymentIntent');
          }

        } else if (paymentType === 'commande' && validCommandeId) {
          // CORRIGÉ: Utiliser la route consolidée pour les commandes
          console.log('🛒 [PaiementPage] Traitement commande:', { validCommandeId, validUserId });

          // CORRIGÉ: Déclarer commandeGenerique au début du bloc
          let commandeGenerique: any = null;

          // AJOUTÉ: Vérifier d'abord l'unicité de la commande
          try {
            console.log('🔍 [PaiementPage] Vérification unicité commande...');
            const verifyResponse = await fetch(apiUrl(`magasin/commande/${validCommandeId}/verify`), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.exists) {
                console.log('✅ [PaiementPage] Commande unique trouvée:', verifyData.commande);
                
                // Utiliser les données de la commande existante
                commandeGenerique = {
                  id: verifyData.commande.id,
                  unique_id: verifyData.commande.unique_id,
                  numero_commande: verifyData.commande.numero_commande,
                  total: verifyData.commande.total,
                  statut: verifyData.commande.statut,
                  utilisateur_id: verifyData.commande.utilisateur_id,
                  articles: [{ nom: 'Articles de la commande', prix: verifyData.commande.total, quantite: 1 }]
                };
              } else {
                throw new Error('Commande non trouvée dans la vérification d\'unicité');
              }
            } else {
              throw new Error('Erreur lors de la vérification d\'unicité');
            }
          } catch (verifyError) {
            console.warn('⚠️ [PaiementPage] Vérification unicité échouée, création données génériques:', verifyError);
            
            // Fallback: Récupérer les données du panier depuis localStorage
            let panierData = null;
            try {
              const panierJson = localStorage.getItem('dernierPanier');
              if (panierJson) {
                panierData = JSON.parse(panierJson);
                console.log('📦 [PaiementPage] Données panier récupérées:', panierData);
              }
            } catch (storageError) {
              console.warn('⚠️ [PaiementPage] Erreur lecture localStorage:', storageError);
            }

            // CORRIGÉ: Créer des données de commande avec ID unique
            commandeGenerique = {
              id: parseInt(commandeId),
              unique_id: `TEMP-${commandeId}-${Date.now()}`, // ID temporaire
              numero_commande: `CMD-TEMP-${commandeId}`,
              total: panierData?.total || 10,
              articles: panierData?.articles || [
                { nom: 'Article commandé', prix: 10, quantite: 1 }
              ],
              statut: 'en_attente',
              utilisateur_id: parseInt(userId),
              date_commande: new Date().toISOString()
            };

            console.log('📋 [PaiementPage] Commande construite avec ID unique:', commandeGenerique);
          }

          // CORRIGÉ: Maintenant commandeGenerique est défini, on peut l'utiliser
          setCommandeData(commandeGenerique);

          // Essayer de récupérer le PaymentIntent existant depuis la base
          try {
            console.log('🔍 [PaiementPage] Tentative récupération PaymentIntent existant...');
            const existingPaymentResponse = await fetch(apiUrl(`magasin/commande/${commandeId}/payment-intent?userId=${userId}`), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            if (existingPaymentResponse.ok) {
              const paymentData = await existingPaymentResponse.json();
              console.log('🔍 [PaiementPage] PaymentIntent existant trouvé:', paymentData);
              setClientSecret(paymentData?.client_secret || '');
              setPaymentIntentId(paymentData?.payment_intent_id || '');
            } else {
              throw new Error('Aucun PaymentIntent existant trouvé');
            }
          } catch (existingError) {
            console.log('🆕 [PaiementPage] Création nouveau PaymentIntent car aucun existant:', existingError.message);
            
            // CORRIGÉ: Utiliser commandeGenerique qui est maintenant défini
            const createPaymentResponse = await fetch(apiUrl('paiements/create-payment-intent-commande'), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                amount: Math.round(commandeGenerique.total * 100),
                currency: 'eur',
                commande: {
                  utilisateur_id: parseInt(userId),
                  articles: commandeGenerique.articles.map(article => ({
                    article_id: article.id || 1,
                    quantite: article.quantite || 1,
                    prix: article.prix || 10,
                    taille: article.taille || 'M'
                  })),
                  total: commandeGenerique.total,
                  statut: 'en_attente',
                  date: new Date().toISOString()
                },
                utilisateur_id: parseInt(userId),
                description: `Commande magasin #${commandeId}`
              }),
            });

            if (createPaymentResponse.ok) {
              const paymentData = await createPaymentResponse.json();
              console.log('✅ [PaiementPage] Nouveau PaymentIntent créé:', paymentData);
              setClientSecret(paymentData?.client_secret || '');
              setPaymentIntentId(paymentData?.payment_intent_id || '');
              
              // Mettre à jour le total depuis les métadonnées si disponible
              if (paymentData?.metadata?.montant_euros) {
                setCommandeData(prev => ({
                  ...prev,
                  total: parseFloat(paymentData.metadata.montant_euros)
                }));
              }
            } else {
              const errorData = await createPaymentResponse.json();
              throw new Error(errorData?.error || 'Erreur création PaymentIntent');
            }
          }
        } else {
          // AJOUTÉ: Gestion du cas où le type ne correspond pas aux paramètres
          const errorMsg = `Type de paiement incompatible: ${paymentType} avec paramètres validEcheanceId=${validEcheanceId}, validCommandeId=${validCommandeId}`;
          console.error('❌ [PaiementPage]', errorMsg);
          throw new Error(errorMsg);
        }
        
        setLoading(false);
        
      } catch (apiError: any) {
        console.error('❌ [PaiementPage] Erreur API:', apiError);
        setError(`Erreur de service: ${apiError.message}`);
        setLoading(false);
      }
    };

    // MODIFIÉ: Attendre que paymentType soit correctement défini ET qu'on ait des paramètres valides
    if (paymentType && (
      (paymentType === 'echeance' && echeanceId && echeanceId !== 'null') ||
      (paymentType === 'commande' && commandeId && commandeId !== 'null')
    )) {
      console.log('🎯 [PaiementPage] Conditions remplies, démarrage loadPaymentData...');
      loadPaymentData();
    } else {
      console.log('⏳ [PaiementPage] En attente des bonnes conditions:', {
        paymentType,
        echeanceId,
        commandeId,
        echeanceValid: echeanceId && echeanceId !== 'null',
        commandeValid: commandeId && commandeId !== 'null'
      });
    }
  }, [echeanceId, commandeId, userId, paymentType]);

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
    </Page>
  );
};

export default PaiementPage;
