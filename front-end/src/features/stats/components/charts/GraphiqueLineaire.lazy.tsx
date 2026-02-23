import React, { Suspense, lazy } from "react";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";

// Lazy load le composant GraphiqueLineaire avec Recharts
const GraphiqueLineaireLazy = lazy(() => import("./GraphiqueLineaire"));

// Props identiques au composant original
interface DataSerie {
  dataKey: string;
  name: string;
  color: string;
  type?: "line" | "area" | "bar";
}

interface GraphiqueLineaireProps {
  data: any[];
  series: DataSerie[];
  title?: string;
  height?: number;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  type?: "line" | "area" | "bar";
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatTooltip?: (value: any, name: string, props: any) => [string, string];
  formatXAxisLabel?: (value: any) => string;
  formatYAxisLabel?: (value: any) => string;
  cardStyle?: React.CSSProperties;
  gradientColors?: boolean;
}

/**
 * Wrapper lazy-loaded pour GraphiqueLineaire
 *
 * Charge Recharts (~280KB) uniquement quand le graphique est affiché
 * Affiche un skeleton pendant le chargement
 *
 * @example
 * ```tsx
 * <GraphiqueLineaire
 *   data={moisData}
 *   series={series}
 *   xAxisKey="mois"
 *   type="line"
 *   height={400}
 * />
 * ```
 */
const GraphiqueLineaire: React.FC<GraphiqueLineaireProps> = (props) => {
  const { height = 400, title } = props;

  return (
    <Suspense fallback={<SkeletonCard hasTitle={!!title} />}>
      <GraphiqueLineaireLazy {...props} />
    </Suspense>
  );
};

export default GraphiqueLineaire;
