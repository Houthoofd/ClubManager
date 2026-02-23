import React from "react";
import { GraphiqueLineaire } from "@/features/stats/components/charts";

interface StatistiquesGraphiqueProps {
  statFrequentationForGraph: any;
  chartType: "line" | "area" | "bar";
  onChartTypeChange: (type: "line" | "area" | "bar") => void;
}

const StatistiquesGraphique: React.FC<StatistiquesGraphiqueProps> = ({
  statFrequentationForGraph,
  chartType,
  onChartTypeChange,
}) => {
  // Vérifications de sécurité
  if (
    !statFrequentationForGraph ||
    !statFrequentationForGraph.mois ||
    !Array.isArray(statFrequentationForGraph.mois)
  ) {
    return <div>Aucune donnée disponible pour le graphique</div>;
  }

  return (
    <>
      {/* Contrôles du graphique */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => onChartTypeChange("line")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 4,
            border: "none",
            backgroundColor: chartType === "line" ? "#1f77b4" : "#ccc",
            color: "white",
          }}
        >
          Ligne
        </button>
        <button
          onClick={() => onChartTypeChange("area")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 4,
            border: "none",
            backgroundColor: chartType === "area" ? "#1f77b4" : "#ccc",
            color: "white",
          }}
        >
          Aire
        </button>
        <button
          onClick={() => onChartTypeChange("bar")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 4,
            border: "none",
            backgroundColor: chartType === "bar" ? "#1f77b4" : "#ccc",
            color: "white",
          }}
        >
          Barres
        </button>
      </div>

      {/* Graphique */}
      <GraphiqueLineaire
        data={statFrequentationForGraph.mois}
        series={[
          {
            dataKey: "pourcentage_de_cours_valides",
            name: "Taux de présence (%)",
            color: "#1f77b4",
          },
          { dataKey: "frequentation", name: "Nombre de présences", color: "#ff7f0e" },
        ]}
        xAxisKey="mois"
        xAxisLabel="Mois"
        yAxisLabel="Valeurs"
        type={chartType}
        height={450}
        showGrid
        showLegend
        showTooltip
        gradientColors={chartType === "area"}
        cardStyle={{
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        formatTooltip={(value, name) =>
          name.includes("%")
            ? [`${value}%`, name]
            : [`${value} présence${value > 1 ? "s" : ""}`, name]
        }
      />
    </>
  );
};

export default StatistiquesGraphique;
