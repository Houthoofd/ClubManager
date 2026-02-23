import React from "react";
import { Title, Alert } from "@patternfly/react-core";
import { GraphiqueLineaire, GraphiquePie } from "../charts";
import TableauStatistiques from "@/shared/components/common-legacy/table/TableauStatistiques";
import SwitchViewControls from "@/shared/components/common-legacy/controls/SwitchViewControls";

interface OngletStatistiquesProps {
  title: string;
  data: any[];
  showChart: boolean;
  onToggleView: () => void;
  type: "bar" | "pie" | "table";
  chartProps?: any;
  tableProps?: any;
  emptyMessage?: string;
}

const OngletStatistiques: React.FC<OngletStatistiquesProps> = ({
  title,
  data,
  showChart,
  onToggleView,
  type,
  chartProps,
  tableProps,
  emptyMessage = "Aucune donnée disponible.",
}) => {
  if (!data || data.length === 0) {
    return (
      <>
        <Title headingLevel="h2" style={{ marginBottom: "1rem" }}>
          {title}
        </Title>
        <Alert variant="info" title={emptyMessage} />
      </>
    );
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <GraphiqueLineaire
            {...chartProps}
            data={data}
            type="bar"
            height={300}
            cardStyle={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
        );
      case "pie":
        return (
          <GraphiquePie
            {...chartProps}
            data={data}
            height={300}
            cardStyle={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Title headingLevel="h2" style={{ marginBottom: "1rem" }}>
        {title}
      </Title>

      {type !== "table" && <SwitchViewControls showChart={showChart} onToggle={onToggleView} />}

      {showChart && type !== "table" ? (
        renderChart()
      ) : (
        <TableauStatistiques
          {...tableProps}
          data={data}
          cardStyle={{
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
      )}
    </>
  );
};

export default OngletStatistiques;
