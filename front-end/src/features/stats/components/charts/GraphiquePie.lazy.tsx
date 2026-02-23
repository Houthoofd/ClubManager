import React, { Suspense, lazy } from "react";
import { SkeletonCard } from "@/shared/components/ui/Skeleton";

// Lazy load le composant GraphiquePie avec Recharts
const GraphiquePieLazy = lazy(() => import("./GraphiquePie"));

// Props identiques au composant original
interface DataSerie {
  dataKey: string;
  nameKey: string;
  colors: string[];
}

interface GraphiquePieProps {
  data: any[];
  serie: DataSerie;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  outerRadius?: number;
  innerRadius?: number;
  showLabels?: boolean;
  cardStyle?: React.CSSProperties;
  formatTooltip?: (value: any, name: string) => [string, string];
}

/**
 * Wrapper lazy-loaded pour GraphiquePie
 *
 * Charge Recharts (~280KB) uniquement quand le graphique pie est affiché
 * Affiche un skeleton pendant le chargement
 *
 * @example
 * ```tsx
 * <GraphiquePie
 *   data={pieData}
 *   serie={{ dataKey: 'value', nameKey: 'name', colors: ['#0066cc', '#f4c145'] }}
 *   height={300}
 *   title="Distribution"
 * />
 * ```
 */
const GraphiquePie: React.FC<GraphiquePieProps> = (props) => {
  const { height = 300, title } = props;

  return (
    <Suspense fallback={<SkeletonCard hasTitle={!!title} />}>
      <GraphiquePieLazy {...props} />
    </Suspense>
  );
};

export default GraphiquePie;
