import React from 'react';
import { Spinner } from '@patternfly/react-core';
import EcheancesPaiement from '../utilisateurs/EcheancesPaiement';

interface PaiementsTabProps {
  isDataReady: boolean;
  paiementsEcheances: any[];
}

const PaiementsTab: React.FC<PaiementsTabProps> = ({
  isDataReady,
  paiementsEcheances,
}) => {
  if (!isDataReady) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return <EcheancesPaiement paiementsEcheances={paiementsEcheances} />;
};

export default PaiementsTab;
