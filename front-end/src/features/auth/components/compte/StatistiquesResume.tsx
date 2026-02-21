import React from "react";
import {
  Title,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Badge,
} from "@patternfly/react-core";

interface MoisData {
  mois: string;
  frequentation: number;
  pourcentage_de_cours_valides: number;
  nombres_total_de_cours_du_mois: number;
}

interface StatistiquesResumeProps {
  statFrequentationForGraph: {
    mois: MoisData[];
  };
}

const StatistiquesResume: React.FC<StatistiquesResumeProps> = ({
  statFrequentationForGraph,
}) => {
  // Vérifications de sécurité
  if (
    !statFrequentationForGraph ||
    !statFrequentationForGraph.mois ||
    !Array.isArray(statFrequentationForGraph.mois)
  ) {
    return (
      <div style={{ marginBottom: "2rem" }}>
        <Title headingLevel="h3" style={{ marginBottom: "1rem" }}>
          Résumé des statistiques
        </Title>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const presencesTotales = statFrequentationForGraph.mois.reduce(
    (acc: number, item: MoisData) => acc + (item?.frequentation ?? 0),
    0,
  );

  const tauxPresenceMoyen =
    statFrequentationForGraph.mois.length > 0
      ? (
          statFrequentationForGraph.mois.reduce(
            (acc: number, item: MoisData) =>
              acc + (item?.pourcentage_de_cours_valides ?? 0),
            0,
          ) / statFrequentationForGraph.mois.length
        ).toFixed(1)
      : "0";

  const meilleurMois = statFrequentationForGraph.mois.reduce(
    (best: MoisData | null, current: MoisData) =>
      (current?.pourcentage_de_cours_valides ?? 0) >
      (best?.pourcentage_de_cours_valides ?? 0)
        ? current
        : best,
    null as MoisData | null,
  );

  return (
    <div style={{ marginBottom: "2rem" }}>
      <Title headingLevel="h3" style={{ marginBottom: "1rem" }}>
        Résumé des statistiques
      </Title>
      <Flex spaceItems={{ default: "spaceItemsLg" }}>
        <FlexItem flex={{ default: "flex_1" }}>
          <Card style={{ textAlign: "center", padding: "1rem" }}>
            <CardBody>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#1f77b4",
                }}
              >
                {presencesTotales}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Présences totales
              </div>
            </CardBody>
          </Card>
        </FlexItem>

        <FlexItem flex={{ default: "flex_1" }}>
          <Card style={{ textAlign: "center", padding: "1rem" }}>
            <CardBody>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#ff7f0e",
                }}
              >
                {tauxPresenceMoyen}%
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Taux de présence moyen
              </div>
            </CardBody>
          </Card>
        </FlexItem>

        <FlexItem flex={{ default: "flex_1" }}>
          <Card style={{ textAlign: "center", padding: "1rem" }}>
            <CardBody>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#2ca02c",
                }}
              >
                {meilleurMois?.mois || "N/A"}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                Meilleur mois
              </div>
              {meilleurMois && (
                <Badge
                  style={{
                    marginTop: "0.5rem",
                    backgroundColor: "#2ca02c",
                    color: "white",
                  }}
                >
                  {meilleurMois.pourcentage_de_cours_valides || 0}%
                </Badge>
              )}
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>
    </div>
  );
};

export default StatistiquesResume;
