import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreatePaymentIntentSecurise, useConfirmPayment, useEcheanceDetails } from '../../hooks/usePaiements';

const Paiement = () => {
  const { echeanceId } = useParams<{ echeanceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // MODIFIÉ: Récupérer userId et echeanceId depuis les paramètres d'URL
  const userIdFromUrl = searchParams.get('userId') || searchParams.get('user');
  const echeanceIdFromUrl = searchParams.get('echeance') || echeanceId;
  
  const echeanceIdNumber = echeanceIdFromUrl ? parseInt(echeanceIdFromUrl) : null;
  const userIdNumber = userIdFromUrl ? parseInt(userIdFromUrl) : null;

  console.log('🔍 [Paiement] Paramètres depuis URL:', {
    echeanceParam: echeanceId,
    echeanceQuery: searchParams.get('echeance'),
    echeanceIdFinal: echeanceIdNumber,
    userIdParam: userIdFromUrl,
    userIdNumber,
    fullUrl: window.location.href,
    NOTE: 'Format attendu: /pages/paiement?echeance=487&userId=154'
  });

  // Utiliser les hooks React Query avec userId depuis l'URL
  const { 
    data: echeanceDetails, 
    isLoading: loadingEcheance, 
    error: loadError 
  } = useEcheanceDetails(echeanceIdNumber, userIdNumber);

  // Hook sécurisé avec userId obligatoire depuis l'URL
  const createPaymentIntent = useCreatePaymentIntentSecurise(
    echeanceIdNumber || 0,
    echeanceDetails?.montant || 0,
    userIdNumber || 0 // userId depuis l'URL
  );

  const confirmPayment = useConfirmPayment();

  console.log('📋 [Paiement] État des hooks avec userId depuis URL:', {
    echeanceDetails: !!echeanceDetails,
    loadingEcheance,
    loadError: loadError?.message,
    createPaymentIntentPending: createPaymentIntent.isPending,
    confirmPaymentPending: confirmPayment.isPending,
    userIdSource: 'URL_PARAMS'
  });

  const handlePayment = async () => {
    if (!echeanceDetails || !echeanceIdNumber || !userIdNumber) {
      setError(`Données manquantes: ${!echeanceDetails ? 'échéance ' : ''}${!echeanceIdNumber ? 'ID échéance ' : ''}${!userIdNumber ? 'ID utilisateur depuis URL' : ''}`);
      console.error('❌ [Paiement] Données manquantes avec userId depuis URL:', {
        echeanceDetails: !!echeanceDetails,
        echeanceIdNumber,
        userIdNumber,
        userIdFromUrl,
        NOTE: 'userId doit être fourni via URL'
      });
      return;
    }

    setError('');

    try {
      console.log(`💳 [Paiement] DÉBUT - userId depuis URL: ${userIdNumber}`);
      console.log(`📊 [Paiement] Données: échéance ${echeanceIdNumber}, utilisateur ${userIdNumber} (URL), montant ${echeanceDetails.montant}`);

      console.log(`🔒 [Paiement] Appel useCreatePaymentIntentSecurise avec userId depuis URL...`);
      const paymentIntentData = await createPaymentIntent.mutateAsync({
        description: `Cotisation mensuelle - ${new Date(echeanceDetails.date_echeance).toLocaleDateString('fr-FR')}`
      });

      console.log(`✅ [Paiement] PaymentIntent créé avec userId depuis URL:`, paymentIntentData);

      console.log(`🔄 [Paiement] Confirmation via useConfirmPayment...`);
      const confirmationData = await confirmPayment.mutateAsync({
        paymentIntentId: paymentIntentData.payment_intent_id,
        echeanceId: echeanceIdNumber,
        userId: userIdNumber, // userId depuis l'URL
        amount: echeanceDetails.montant
      });

      console.log(`🎉 [Paiement] Succès avec userId depuis URL:`, confirmationData);

      setPaymentSuccess(true);
      setError('');

      setTimeout(() => {
        navigate(`/compte?tab=paiements&userId=${userIdNumber}`);
      }, 3000);

    } catch (error: any) {
      console.error('❌ [Paiement] Erreur avec userId depuis URL:', error);
      setError(`Erreur: ${error.message}`);
    }
  };

  if (!echeanceIdNumber) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff4444', 
          borderRadius: '8px', 
          padding: '2rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#cc0000', margin: '0 0 1rem 0' }}>❌ Erreur</h2>
          <p style={{ margin: '0 0 1.5rem 0' }}>ID d'échéance invalide</p>
          <button 
            onClick={() => navigate('/compte?tab=paiements')} 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Retour aux paiements
          </button>
        </div>
      </div>
    );
  }

  if (!userIdNumber) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px', 
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#856404', margin: '0 0 1rem 0' }}>🔒 Paramètre manquant</h2>
          <p style={{ margin: '0 0 1rem 0' }}>
            <strong>ID utilisateur manquant dans l'URL</strong>
          </p>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px', 
            margin: '1rem 0',
            textAlign: 'left',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>URL attendue :</strong>
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              • /pages/paiement?echeance=487&userId=154
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>URL actuelle :</strong> {window.location.href}
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Paramètres détectés :</strong>
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              - echeance: {searchParams.get('echeance') || 'MANQUANT'}
            </p>
            <p style={{ margin: '0.5rem 0' }}>
              - userId: {searchParams.get('userId') || 'MANQUANT'}
            </p>
          </div>

          <button 
            onClick={() => navigate('/compte?tab=paiements')} 
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔑 Retour à mon compte
          </button>
        </div>
      </div>
    );
  }

  if (loadingEcheance) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          padding: '2rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ margin: 0, color: '#6c757d' }}>
            Chargement via useEcheanceDetails hook...
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '12px', color: '#999' }}>
            (Hooks React Query EXCLUSIFS - Aucun fetch manuel)
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff4444', 
          borderRadius: '8px', 
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#cc0000', margin: '0 0 1rem 0' }}>❌ Erreur Hook</h2>
          <p style={{ margin: '0 0 1rem 0' }}>Erreur useEcheanceDetails:</p>
          <p style={{ 
            margin: '0 0 1.5rem 0', 
            backgroundColor: '#f8f8f8', 
            padding: '0.75rem', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#666'
          }}>
            {loadError.message}
          </p>
          <button 
            onClick={() => navigate('/compte?tab=paiements')} 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '8px', 
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#155724', margin: '0 0 1rem 0' }}>🎉 Paiement réussi !</h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '18px' }}>
            Traité avec succès via hooks React Query.
          </p>
          <p style={{ margin: '0 0 1.5rem 0', color: '#6c757d' }}>
            Redirection en cours...
          </p>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px', 
            margin: '1rem 0',
            border: '1px solid #dee2e6'
          }}>
            <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
              <strong>Montant:</strong> {echeanceDetails?.montant} €
            </p>
            <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>
              <strong>Échéance:</strong> #{echeanceId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#343a40', marginBottom: '2rem' }}>
        💳 Paiement - Échéance #{echeanceIdNumber}
      </h1>
      
      <div style={{ 
        background: '#e7f3ff', 
        border: '1px solid #bee5eb', 
        borderRadius: '8px', 
        padding: '1rem',
        margin: '0 0 2rem 0',
        fontSize: '14px',
        color: '#0c5460'
      }}>
        <strong>🔧 Informations de paiement:</strong>
        <br />
        <strong>🔑 Utilisateur:</strong> #{userIdNumber}
        <br />
        <strong>📊 Échéance:</strong> #{echeanceIdNumber}
        <br />
        <strong>💰 Montant:</strong> {echeanceDetails ? `${echeanceDetails.montant}€` : 'Chargement...'}
        <br />
        <strong>✅ Source:</strong> Paramètres URL - Format: /pages/paiement?echeance={echeanceIdNumber}&userId={userIdNumber}
      </div>
      
      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff4444', 
          borderRadius: '8px', 
          padding: '1rem',
          margin: '0 0 2rem 0'
        }}>
          <p style={{ margin: 0, color: '#cc0000', fontWeight: 'bold' }}>❌ {error}</p>
        </div>
      )}
      
      {echeanceDetails && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#495057', marginBottom: '1.5rem' }}>
            📋 Échéance (userId: {userIdNumber} depuis URL)
          </h2>
          
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px', 
            padding: '1.5rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem 2rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Référence:</span>
              <span style={{ fontSize: '16px' }}>#{echeanceDetails.id}</span>
              
              <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Montant:</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {echeanceDetails.montant} €
              </span>
              
              <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Date:</span>
              <span style={{ fontSize: '16px' }}>
                {new Date(echeanceDetails.date_echeance).toLocaleDateString('fr-FR')}
              </span>
              
              <span style={{ fontWeight: 'bold', color: '#6c757d' }}>Statut:</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: echeanceDetails.statut === 'payé' ? '#28a745' : '#dc3545',
                textTransform: 'uppercase'
              }}>
                {echeanceDetails.statut}
              </span>
            </div>
          </div>

          {echeanceDetails.statut !== 'payé' && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                onClick={handlePayment} 
                disabled={createPaymentIntent.isPending || confirmPayment.isPending}
                style={{
                  backgroundColor: createPaymentIntent.isPending || confirmPayment.isPending ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: createPaymentIntent.isPending || confirmPayment.isPending ? 'not-allowed' : 'pointer',
                  minWidth: '250px',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {createPaymentIntent.isPending || confirmPayment.isPending 
                  ? '⏳ Traitement URL...' 
                  : `💳 PAYER (User ${userIdNumber})`
                }
              </button>
              
              <p style={{ 
                margin: '1rem 0 0 0', 
                color: '#6c757d', 
                fontSize: '14px',
                fontStyle: 'italic'
              }}>
                💡 Paiement sécurisé via URL - userId: {userIdNumber}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button 
          onClick={() => navigate(`/compte?tab=paiements`)}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ← Retour paiements
        </button>
      </div>
    </div>
  );
};

export default Paiement;