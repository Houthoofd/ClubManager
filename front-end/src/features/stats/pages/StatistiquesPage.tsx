import React from "react";
import { PageSection } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";

const StatistiquesPage: React.FC = () => {
  return (
    <div className="stats-page">
      <PageHeader
        title="Statistiques"
        subtitle="Analysez les performances de votre centre de fitness"
        variant="stats"
      />

      <PageSection className="stats-content">
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Page de statistiques détaillées en cours de développement.</p>
          <p style={{ marginTop: "1rem", color: "#666" }}>
            Utilisez le tableau de bord pour consulter les statistiques principales.
          </p>
        </div>
      </PageSection>
    </div>
  );
};

export default StatistiquesPage;
