/**
 * ============================================================================
 * TeacherPlanningPage - Refactored
 * ============================================================================
 *
 * Planning view for instructors to see their assigned courses and statistics.
 *
 * Features:
 * - GraphQL typed hooks (useGetInstructorsQuery, etc.)
 * - Zustand stores (authStore, uiStore)
 * - react-i18next for translations
 * - PatternFly UI components
 * - Sentry tracking via withTracking HOC
 * - HOCs: withAuth, withTracking, withErrorBoundary
 *
 * @refactored 2024 - Production ready
 */

import React, { useState, useMemo } from "react";
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Alert,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
} from "@patternfly/react-core";
import { CalendarAltIcon } from "@patternfly/react-icons";
import { useTranslation } from "react-i18next";
import { useTracking } from "@/shared/hooks/useTracking";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useAuthStore } from "@/core/stores/authStore";
import { useUiStore } from "@/core/stores/uiStore";
import { useGetSessionsQuery } from "@/core/api/apollo/generated/graphql";
import PlanningFilter from "../components/PlanningFilter";
import PlanningGrid from "../components/PlanningGrid";
import PlanningStatistics from "../components/PlanningStatistics";
import type { PlanningCourse } from "@clubmanager/types";

// ============================================================================
// Constants
// ============================================================================

const TEACHER_TABS = {
  PLANNING: 0,
  STATISTICS: 1,
} as const;

// ============================================================================
// Component
// ============================================================================

const TeacherPlanningPage: React.FC = () => {
  const { t } = useTranslation();
  const { trackEvent } = useTracking();
  const { user } = useAuthStore();
  const { showNotification } = useUiStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<number>(TEACHER_TABS.PLANNING);
  const [filtreJour, setFiltreJour] = useState<string>("tous");

  // GraphQL query - fetch sessions assigned to current instructor
  const {
    data: sessionsData,
    loading,
    error,
    refetch,
  } = useGetSessionsQuery({
    variables: {
      where: {
        instructor_id: { equals: user?.id },
      },
    },
    skip: !user?.id,
    onError: (err) => {
      console.error("❌ Error fetching instructor planning:", err);
      trackEvent("teacher_planning_load_error", {
        error: err.message,
        instructor_id: user?.id,
      });
      showNotification(
        t("teachers.planning.errors.loadFailed", "Erreur lors du chargement du planning"),
        "danger",
      );
    },
  });

  // Transform sessions to planning courses
  const planningData: PlanningCourse[] = useMemo(() => {
    if (!sessionsData?.sessions) return [];

    return sessionsData.sessions.map((session: any) => ({
      id: session.id,
      nom: session.course?.name || "Cours sans nom",
      jour_semaine: session.day_of_week || session.course?.day_of_week || 1,
      heure_debut: session.start_time || session.course?.start_time || "00:00",
      heure_fin: session.end_time || session.course?.end_time || "00:00",
      niveau: session.course?.level || "Tous niveaux",
      salle: session.course?.room || "À définir",
      participants: session.registrations?.length || 0,
      max_participants: session.course?.max_participants || 0,
      status: session.status || "active",
      date: session.date,
    }));
  }, [sessionsData]);

  // Convert day number to day name
  const convertirJourSemaine = (jour: number | string): string => {
    if (typeof jour === "string") return jour;

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

  // Filter courses by selected day
  const coursFiltres = useMemo(() => {
    if (filtreJour === "tous") return planningData;

    return planningData.filter((c) => convertirJourSemaine(c.jour_semaine) === filtreJour);
  }, [planningData, filtreJour]);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent("teacher_planning_page_view", {
      instructor_id: user?.id,
      courses_count: planningData.length,
    });
  }, [trackEvent, user?.id, planningData.length]);

  // Track tab changes
  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === "number") {
      setActiveTabKey(tabIndex);
      trackEvent("teacher_planning_tab_change", {
        tab: tabIndex === TEACHER_TABS.PLANNING ? "planning" : "statistics",
        instructor_id: user?.id,
      });
    }
  };

  // Track filter changes
  const handleFilterSelect = (jour: string) => {
    setFiltreJour(jour);
    trackEvent("teacher_planning_filter_change", {
      filter: jour,
      instructor_id: user?.id,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="planning-page">
        <PageHeader
          title={t("teachers.planning.title", "Mon Planning des Cours")}
          subtitle={t("teachers.planning.subtitle", "Consultez vos cours assignés")}
          variant="planning"
        />
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
              {t("teachers.planning.loading", "Chargement du planning des cours...")}
            </p>
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="planning-page">
        <PageHeader
          title={t("teachers.planning.title", "Mon Planning des Cours")}
          subtitle={t("teachers.planning.subtitle", "Consultez vos cours assignés")}
          variant="planning"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("teachers.planning.errors.loadTitle", "Erreur de chargement")}
            isInline
            actionClose={
              <button
                onClick={() => refetch()}
                style={{
                  padding: "0.5rem 1rem",
                  marginLeft: "1rem",
                  cursor: "pointer",
                }}
              >
                {t("common.actions.retry", "Réessayer")}
              </button>
            }
          >
            {t(
              "teachers.planning.errors.loadFailed",
              "Impossible de charger le planning. Veuillez réessayer.",
            )}
          </Alert>
        </PageSection>
      </div>
    );
  }

  // Empty state (no courses)
  if (planningData.length === 0) {
    return (
      <div className="planning-page">
        <PageHeader
          title={t("teachers.planning.title", "Mon Planning des Cours")}
          subtitle={t("teachers.planning.subtitle", "Consultez vos cours assignés")}
          variant="planning"
        />
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={CalendarAltIcon} />
            <Title headingLevel="h4" size="lg">
              {t("teachers.planning.empty.title", "Aucun cours assigné")}
            </Title>
            <EmptyStateBody>
              {t(
                "teachers.planning.empty.description",
                "Vous n'avez pas encore de cours assignés. Contactez l'administrateur pour plus d'informations.",
              )}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </div>
    );
  }

  // Main render
  return (
    <div className="planning-page">
      <PageHeader
        title={t("teachers.planning.title", "Mon Planning des Cours")}
        subtitle={t("teachers.planning.subtitle", "Consultez vos cours assignés")}
        variant="planning"
      />

      <PageSection className="planning-content">
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick} className="modern-tabs">
          {/* Tab: Planning */}
          <Tab
            eventKey={TEACHER_TABS.PLANNING}
            title={
              <TabTitleText>
                <span>{t("teachers.planning.tabs.planning", "Mes Cours")}</span>
              </TabTitleText>
            }
          >
            <PlanningFilter filtreJour={filtreJour} onFilterSelect={handleFilterSelect} />

            <PlanningGrid cours={coursFiltres} filtreJour={filtreJour} />

            {/* Results info */}
            {filtreJour !== "tous" && (
              <div style={{ marginTop: "1rem", textAlign: "center", color: "#6a6e73" }}>
                {coursFiltres.length === 0 ? (
                  <p>
                    {t("teachers.planning.noCoursesForDay", "Aucun cours le {{day}}", {
                      day: filtreJour,
                    })}
                  </p>
                ) : (
                  <p>
                    {t("teachers.planning.coursesCount", "{{count}} cours le {{day}}", {
                      count: coursFiltres.length,
                      day: filtreJour,
                    })}
                  </p>
                )}
              </div>
            )}
          </Tab>

          {/* Tab: Statistics */}
          <Tab
            eventKey={TEACHER_TABS.STATISTICS}
            title={
              <TabTitleText>
                <span>{t("teachers.planning.tabs.statistics", "Statistiques")}</span>
              </TabTitleText>
            }
          >
            <PlanningStatistics cours={planningData} />
          </Tab>
        </Tabs>
      </PageSection>
    </div>
  );
};

// ============================================================================
// Exports with HOCs
// ============================================================================

export default withErrorBoundary(
  withTracking(
    withAuth(TeacherPlanningPage, {
      requireAuth: true,
      requiredRoles: ["instructor", "admin"],
      redirectTo: "/login",
    }),
    "teacher_planning",
  ),
);
