import React, { useState, useEffect } from "react";
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Alert,
} from "@patternfly/react-core";
import { PageHeader } from "@/components/common/PageHeader";
import ResultModal from "@/components/common/modal/ResultModal";
import PlanningFilter from "../components/PlanningFilter";
import PlanningGrid from "../components/PlanningGrid";
import PlanningStatistics from "../components/PlanningStatistics";
import { TEACHER_TABS, ERROR_MESSAGES } from "../constants";
import type { PlanningPageState, PlanningCourse } from "../types";

const TeacherPlanningPage: React.FC = () => {
  const [state, setState] = useState<PlanningPageState>({
    activeTabKey: TEACHER_TABS.PLANNING,
    filtreJour: "tous",
    showResultModal: false,
    resultModalMessage: "",
    resultModalSuccess: false,
  });

  // TODO: Replace with actual GraphQL hook when available
  // const { data: planningData = [], isLoading: loading, error } = useMonPlanningCours();
  const planningData: PlanningCourse[] = [];
  const loading = false;
  const error = null;

  // Fonction utilitaire pour convertir le jour semaine en nom
  const convertirJourSemaine = (jour: number | string): string => {
    if (typeof jour === "string") return jour;

    // Mapping correct : 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
    const jours: Record<number, string> = {
      1: "Lundi",
      2: "Mardi",
      3: "Mercredi",
      4: "Jeudi",
      5: "Vendredi",
      6: "Samedi",
      7: "Dimanche",
    };

    return jours[jour] || "Inconnu";
  };

  // Gérer les erreurs avec useEffect pour éviter le re-rendu infini
  useEffect(() => {
    if (error) {
      setState((prev) => ({
        ...prev,
        resultModalMessage: ERROR_MESSAGES.LOAD_PLANNING_FAILED,
        resultModalSuccess: false,
        showResultModal: true,
      }));
    }
  }, [error]);

  const coursFiltres =
    state.filtreJour === "tous"
      ? planningData
      : planningData.filter(
          (c) => convertirJourSemaine(c.jour_semaine) === state.filtreJour
        );

  const handleTabClick = (
    _event: React.MouseEvent,
    tabIndex: string | number
  ) => {
    if (typeof tabIndex === "number") {
      setState((prev) => ({
        ...prev,
        activeTabKey: tabIndex,
      }));
    }
  };

  const handleFilterSelect = (jour: string) => {
    setState((prev) => ({
      ...prev,
      filtreJour: jour,
    }));
  };

  if (loading) {
    return (
      <PageSection>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <Spinner size="xl" />
          <p style={{ marginLeft: "1rem" }}>
            Chargement du planning des cours...
          </p>
        </div>
      </PageSection>
    );
  }

  return (
    <div className="planning-page">
      <PageHeader
        title="Mon Planning des Cours"
        subtitle="Consultez vos cours assignés"
        variant="planning"
      />

      <PageSection className="planning-content">
        {error && (
          <Alert
            variant="danger"
            title="Erreur de chargement"
            isInline
            style={{ marginBottom: "1rem" }}
          >
            {ERROR_MESSAGES.LOAD_PLANNING_FAILED}
          </Alert>
        )}

        <Tabs
          activeKey={state.activeTabKey}
          onSelect={handleTabClick}
          className="modern-tabs"
        >
          <Tab
            eventKey={TEACHER_TABS.PLANNING}
            title={
              <TabTitleText>
                <span>Mes Cours</span>
              </TabTitleText>
            }
          >
            <PlanningFilter
              filtreJour={state.filtreJour}
              onFilterSelect={handleFilterSelect}
            />

            <PlanningGrid cours={coursFiltres} filtreJour={state.filtreJour} />
          </Tab>

          <Tab
            eventKey={TEACHER_TABS.STATISTICS}
            title={
              <TabTitleText>
                <span>Statistiques</span>
              </TabTitleText>
            }
          >
            <PlanningStatistics cours={planningData} />
          </Tab>
        </Tabs>

        <ResultModal
          isOpen={state.showResultModal}
          onClose={() =>
            setState((prev) => ({ ...prev, showResultModal: false }))
          }
          title={state.resultModalSuccess ? "Succès" : "Erreur"}
          message={state.resultModalMessage}
          isSuccess={state.resultModalSuccess}
        />
      </PageSection>
    </div>
  );
};

export default TeacherPlanningPage;
