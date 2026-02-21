import React, { useState, useMemo } from "react";
import {
  Spinner,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Title,
  Badge,
  Button,
  Alert,
} from "@patternfly/react-core";
import { ChartLineIcon, ChartAreaIcon, ChartBarIcon } from "@patternfly/react-icons";
import GraphiqueLineaire from "@/shared/components/common-legacy/graph/GraphiqueLineaire";
import UserStatsService from "../services/user-stats.service";

interface StatistiquesUtilisateurProps {
  statFrequentation: any;
  isLoading: boolean;
}

const StatistiquesUtilisateur: React.FC<StatistiquesUtilisateurProps> = ({
  statFrequentation,
  isLoading,
}) => {
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");

  // ✅ Utilisation du service pour calculer les statistiques
  const stats = useMemo(() => {
    if (!statFrequentation?.frequentationParMois) return null;
    return UserStatsService.calculateAttendanceStats(statFrequentation.frequentationParMois);
  }, [statFrequentation]);

  const trend = useMemo(() => {
    if (!statFrequentation?.frequentationParMois) return null;
    const trendValue = UserStatsService.calculateAttendanceTrend(
      statFrequentation.frequentationParMois,
    );
    return UserStatsService.formatTrend(trendValue);
  }, [statFrequentation]);

  if (isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!statFrequentation || !stats) {
    return <Alert variant="info" title="Aucune statistique disponible pour cet utilisateur." />;
  }

  // Configuration des séries de données
  const series = [
    {
      dataKey: "pourcentage_de_cours_valides",
      name: "Taux de présence (%)",
      color: "#1f77b4",
    },
    {
      dataKey: "frequentation",
      name: "Nombre de présences",
      color: "#ff7f0e",
    },
  ];

  return (
    <div>
      {/* Cartes de statistiques globales */}
      <div style={{ marginBottom: "2rem" }}>
        <Title headingLevel="h3" style={{ marginBottom: "1rem" }}>
          Résumé des statistiques
        </Title>
        <Flex spaceItems={{ default: "spaceItemsLg" }}>
          <FlexItem flex={{ default: "flex_1" }}>
            <Card style={{ textAlign: "center", padding: "1rem" }}>
              <CardBody>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f77b4" }}>
                  {stats.totalPresences}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>Présences totales</div>
              </CardBody>
            </Card>
          </FlexItem>

          <FlexItem flex={{ default: "flex_1" }}>
            <Card style={{ textAlign: "center", padding: "1rem" }}>
              <CardBody>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff7f0e" }}>
                  {UserStatsService.formatAttendanceRate(stats.averageAttendanceRate)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>Taux de présence moyen</div>
              </CardBody>
            </Card>
          </FlexItem>

          <FlexItem flex={{ default: "flex_1" }}>
            <Card style={{ textAlign: "center", padding: "1rem" }}>
              <CardBody>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2ca02c" }}>
                  {stats.bestMonth ? UserStatsService.formatMonthName(stats.bestMonth.mois) : "N/A"}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>Meilleur mois</div>
                {stats.bestMonth && (
                  <Badge
                    style={{ marginTop: "0.5rem", backgroundColor: "#2ca02c", color: "white" }}
                  >
                    {UserStatsService.formatAttendanceRate(
                      stats.bestMonth.pourcentage_de_cours_valides,
                    )}
                  </Badge>
                )}
              </CardBody>
            </Card>
          </FlexItem>

          {/* Tendance */}
          {trend && (
            <FlexItem flex={{ default: "flex_1" }}>
              <Card style={{ textAlign: "center", padding: "1rem" }}>
                <CardBody>
                  <div style={{ fontSize: "1.5rem", color: trend.color }}>
                    {trend.icon} {trend.label}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>Tendance</div>
                  <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.5rem" }}>
                    Série actuelle: {stats.currentStreak} mois
                  </div>
                </CardBody>
              </Card>
            </FlexItem>
          )}
        </Flex>
      </div>

      {/* Contrôles du graphique */}
      <div style={{ marginBottom: "1rem" }}>
        <Title headingLevel="h3" style={{ marginBottom: "1rem" }}>
          Évolution de la fréquentation
        </Title>
        <Flex spaceItems={{ default: "spaceItemsSm" }}>
          <FlexItem>
            <span style={{ marginRight: "1rem", fontWeight: "500" }}>Type de graphique :</span>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === "line" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setChartType("line")}
              icon={<ChartLineIcon />}
            >
              Ligne
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === "area" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setChartType("area")}
              icon={<ChartAreaIcon />}
            >
              Aire
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              variant={chartType === "bar" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setChartType("bar")}
              icon={<ChartBarIcon />}
            >
              Barres
            </Button>
          </FlexItem>
        </Flex>
      </div>

      {/* Graphique principal */}
      <GraphiqueLineaire
        data={statFrequentation.frequentationParMois}
        series={series}
        xAxisKey="mois"
        xAxisLabel="Mois"
        yAxisLabel="Valeurs"
        type={chartType}
        height={450}
        showGrid={true}
        showLegend={true}
        showTooltip={true}
        gradientColors={chartType === "area"}
        cardStyle={{
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        formatTooltip={(value, name) => {
          if (name.includes("%")) {
            return [`${value}%`, name];
          }
          return [`${value} présence${value > 1 ? "s" : ""}`, name];
        }}
      />

      {/* Détails par mois */}
      <div style={{ marginTop: "2rem" }}>
        <Title headingLevel="h4" style={{ marginBottom: "1rem" }}>
          Détail par mois
        </Title>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {statFrequentation.frequentationParMois?.map((item: any, index: number) => {
            const rateColor = UserStatsService.getAttendanceRateColor(
              item.pourcentage_de_cours_valides,
            );
            const colorMap = {
              success: "#28a745",
              warning: "#ffc107",
              danger: "#dc3545",
              default: "#6c757d",
            };

            return (
              <Card key={index} style={{ padding: "0.75rem" }}>
                <CardBody>
                  <Title headingLevel="h5" size="md" style={{ marginBottom: "0.5rem" }}>
                    {UserStatsService.formatMonthName(item.mois)}
                  </Title>
                  <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsXs" }}>
                    <FlexItem>
                      <span style={{ fontWeight: "500" }}>Présences : </span>
                      <Badge style={{ backgroundColor: "#ff7f0e", color: "white" }}>
                        {item.frequentation}
                      </Badge>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontWeight: "500" }}>Taux : </span>
                      <Badge
                        style={{
                          backgroundColor: colorMap[rateColor],
                          color: "white",
                        }}
                      >
                        {UserStatsService.formatAttendanceRate(item.pourcentage_de_cours_valides)}
                      </Badge>
                    </FlexItem>
                    <FlexItem>
                      <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "#666" }}>
                        Cours total : {item.nombres_total_de_cours_du_mois}
                      </span>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatistiquesUtilisateur;
