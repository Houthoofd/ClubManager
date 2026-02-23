// Stats Feature Components - Barrel Export

// Dashboard Components
export { MetricCard } from "./MetricCard";
export { DataTable } from "./DataTable";
export { ExpandableDataSection } from "./ExpandableDataSection";

// Chart Components (⚡ Lazy-loaded - Recharts ~335KB chargé à la demande)
export {
  ChartCard,
  ChartCardEager,
  GraphiqueLineaire,
  GraphiqueLineaireEager,
  GraphiquePie,
  GraphiquePieEager,
} from "./charts";

// Statistiques Components
export { default as StatistiquesTab } from "./StatistiquesTab";
export { default as StatistiquesResume } from "./StatistiquesResume";
export { default as StatistiquesGraphique } from "./StatistiquesGraphique";
export { default as StatistiquesDetail } from "./StatistiquesDetail";
export { default as StatistiquesCompte } from "./StatistiquesCompte";
