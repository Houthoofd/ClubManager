import React from 'react';
import { Spinner } from '@patternfly/react-core';
import EcheancesPaiement from '../utilisateurs/EcheancesPaiement';

interface PaiementsTabProps {
  isDataReady: boolean;
  paiementsEcheances: any[];
  userId?: number;
  genererUrlPaiement?: (echeanceId: number) => string;
}

const PaiementsTab: React.FC<PaiementsTabProps> = ({ 
  isDataReady, 
  paiementsEcheances,
  userId,
  genererUrlPaiement
}) => {
  // Debug et vérifications de sécurité
  console.log('🔍 [PaiementsTab] Props reçues:', {
    isDataReady,
    paiementsEcheances: paiementsEcheances,
    paiementsEcheances_type: typeof paiementsEcheances,
    paiementsEcheances_isArray: Array.isArray(paiementsEcheances),
    paiementsEcheances_length: paiementsEcheances?.length,
    userId,
    genererUrlPaiement: !!genererUrlPaiement
  });

  // Vérification de sécurité
  const echeancesSafe = Array.isArray(paiementsEcheances) ? paiementsEcheances : [];

  // Afficher l'erreur d'authentification si présente
  if (echeancesSafe.errorEcheances && (echeancesSafe.errorEcheances.message?.includes('403') || echeancesSafe.errorEcheances.message?.includes('401'))) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ 
          background: '#ffeaa7', 
          border: '1px solid #fdcb6e', 
          borderRadius: '8px', 
          padding: '1rem',
          margin: '1rem 0'
        }}>
          <h3 style={{ color: '#e17055', margin: '0 0 1rem 0' }}>
            🔒 Problème d'authentification
          </h3>
          <p style={{ margin: '0 0 1rem 0' }}>
            Impossible de charger les échéances. Votre session semble avoir expiré.
          </p>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#636e72' }}>
            <strong>Erreur:</strong> {echeancesSafe.errorEcheances.message}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#74b9ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Actualiser
            </button>
            <button 
              onClick={() => window.location.href = '/pages/connexion'}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔑 Se reconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (echeancesSafe.loadingEcheances || !isDataReady) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="md" />
        <p style={{ marginTop: '1rem' }}>Chargement des échéances...</p>
      </div>
    );
  }

  return (
    <div className="paiements-tab">
      <EcheancesPaiement 
        paiementsEcheances={paiementsEcheances} 
        userId={userId}
        genererUrlPaiement={genererUrlPaiement}
      />
    </div>
  );
};

export default PaiementsTab;