import React from 'react';
import { PageSection } from '@patternfly/react-core';
import { PageHeader } from '../../components/common/PageHeader';

const StatistiquesPage: React.FC = () => {
  return (
    <div className="stats-page">
      <PageHeader
        title="Statistiques"
        subtitle="Analysez les performances de votre centre de fitness"
        variant="stats"
      />

      <PageSection className="stats-content">
        {/* ...existing code... */}
      </PageSection>
    </div>
  );
};

export default StatistiquesPage;
