import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageSection, Button, Alert, Title } from "@patternfly/react-core";
import { CalendarAltIcon, ClockIcon, UserIcon } from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { SkeletonDataList } from "@/shared/components/ui";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useAuthStore } from "@/core/store/authStore";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetSessionsQuery,
  useGetUserEnrollmentsQuery,
  useEnrollUserMutation,
  useCancelEnrollmentMutation,
} from "@/core/api/graphql/generated/graphql";
import "@/styles/inscription.css";

interface SessionData {
  id: number;
  date_cours: string;
  jour_semaine: string;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  professeurs: Array<{
    id: number;
    nom: string;
    prenom: string;
  }>;
  enrollments?: Array<{
    id: number;
    userId: number;
  }>;
}

/**
 * InscriptionPage Component
 *
 * Displays available courses and allows users to enroll/unenroll
 * Uses GraphQL for data fetching, Zustand for state, i18n for translations
 *
 * @architecture
 * - GraphQL: useGetSessionsQuery, useGetUserEnrollmentsQuery, useEnrollUserMutation, useCancelEnrollmentMutation
 * - Zustand: authStore (user), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: courses.enrollment.*
 */
const InscriptionPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand stores
  const user = useAuthStore((state) => state.user);
  const addNotification = useUiStore((state) => state.addNotification);

  // GraphQL queries
  const {
    data: sessionsData,
    loading: loadingSessions,
    error: errorSessions,
    refetch: refetchSessions,
  } = useGetSessionsQuery({
    fetchPolicy: "cache-and-network",
  });

  const {
    data: enrollmentsData,
    loading: loadingEnrollments,
    refetch: refetchEnrollments,
  } = useGetUserEnrollmentsQuery({
    variables: { userId: user?.id || 0 },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [enrollUser, { loading: enrolling }] = useEnrollUserMutation();
  const [cancelEnrollment, { loading: unenrolling }] = useCancelEnrollmentMutation();

  // Extract sessions from query data
  const sessions = useMemo(() => {
    return (sessionsData?.sessions || []) as SessionData[];
  }, [sessionsData]);

  // Extract user enrollments
  const userEnrollments = useMemo(() => {
    return enrollmentsData?.userEnrollments || [];
  }, [enrollmentsData]);

  // Permissions: can user view participants list?
  const canViewParticipants = useMemo(() => {
    return user?.status !== "utilisateur";
  }, [user?.status]);

  /**
   * Handle user enrollment to a course
   */
  const handleEnrollment = async (sessionId: number) => {
    if (!user?.id || !sessionId) {
      addNotification({
        type: "error",
        message: t("courses.enrollment.error.invalidData"),
      });
      trackEvent("enrollment_failed", { sessionId, reason: "invalid_data" });
      return;
    }

    try {
      await enrollUser({
        variables: {
          userId: user.id,
          sessionId,
        },
      });

      const session = sessions.find((s) => s.id === sessionId);
      const dateLabel = session?.date_cours
        ? formatDateSansJour(session.date_cours)
        : t("courses.enrollment.unknownDate");

      addNotification({
        type: "success",
        message: t("courses.enrollment.success.enrolled", { date: dateLabel }),
      });

      trackEvent("enrollment_success", {
        sessionId,
        sessionType: session?.type_cours,
        sessionDate: session?.date_cours,
      });

      // Refetch both queries to update UI
      await Promise.all([refetchSessions(), refetchEnrollments()]);
    } catch (error: any) {
      console.error("Enrollment error:", error);

      const errorMessage = error?.message?.includes("déjà inscrit")
        ? t("courses.enrollment.error.alreadyEnrolled")
        : t("courses.enrollment.error.enrollmentFailed");

      addNotification({
        type: "error",
        message: errorMessage,
      });

      trackEvent("enrollment_failed", {
        sessionId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Handle user unenrollment from a course
   */
  const handleUnenrollment = async (sessionId: number) => {
    if (!user?.id || !sessionId) {
      addNotification({
        type: "error",
        message: t("courses.enrollment.error.invalidData"),
      });
      trackEvent("unenrollment_failed", { sessionId, reason: "invalid_data" });
      return;
    }

    try {
      // Find the enrollment ID for this user and session
      const enrollment = userEnrollments.find(
        (e: any) => e.sessionId === sessionId && e.userId === user.id
      );

      if (!enrollment?.id) {
        throw new Error("Enrollment not found");
      }

      await cancelEnrollment({
        variables: {
          enrollmentId: enrollment.id,
        },
      });

      const session = sessions.find((s) => s.id === sessionId);
      const dateLabel = session?.date_cours
        ? formatDateSansJour(session.date_cours)
        : t("courses.enrollment.unknownDate");

      addNotification({
        type: "success",
        message: t("courses.enrollment.success.unenrolled", { date: dateLabel }),
      });

      trackEvent("unenrollment_success", {
        sessionId,
        sessionType: session?.type_cours,
        sessionDate: session?.date_cours,
      });

      // Refetch both queries to update UI
      await Promise.all([refetchSessions(), refetchEnrollments()]);
    } catch (error: any) {
      console.error("Unenrollment error:", error);

      addNotification({
        type: "error",
        message: t("courses.enrollment.error.unenrollmentFailed"),
      });

      trackEvent("unenrollment_failed", {
        sessionId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Check if user is enrolled in a specific session
   */
  const isEnrolled = (sessionId: number): boolean => {
    return userEnrollments.some(
      (e: any) => e.sessionId === sessionId && e.userId === user?.id
    );
  };

  /**
   * Get enrollment count for a session
   */
  const getEnrollmentCount = (sessionId: number): number => {
    const session = sessions.find((s) => s.id === sessionId);
    return session?.enrollments?.length || 0;
  };

  /**
   * Get CSS class for course type badge
   */
  const getTypeCoursClass = (typeCours: string): string => {
    return `inscription-type-badge ${typeCours.toLowerCase()}`;
  };

  /**
   * Format date without calculated day of week
   */
  const formatDateSansJour = (dateString: string): string => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (loadingSessions || loadingEnrollments) {
    return (
      <div className="inscription-page">
        <PageHeader
          title={t("courses.enrollment.title")}
          subtitle={t("courses.enrollment.subtitle")}
          variant="courses"
        />
        <PageSection className="inscription-content">
          <div className="pf-v5-u-p-lg">
            <Title headingLevel="h2" className="pf-v5-u-mb-md">
              {t("courses.enrollment.loading")}
            </Title>
            <SkeletonDataList items={6} />
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorSessions) {
    return (
      <div className="inscription-page">
        <PageHeader
          title={t("courses.enrollment.title")}
          subtitle={t("courses.enrollment.subtitle")}
          variant="courses"
        />
        <PageSection className="inscription-content">
          <Alert
            variant="danger"
            title={t("courses.enrollment.loadingError")}
            style={{ borderRadius: "8px" }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div className="inscription-page">
      <PageHeader
        title={t("courses.enrollment.title")}
        subtitle={t("courses.enrollment.subtitle")}
        variant="courses"
      />

      <PageSection className="inscription-content">
        {/* Grid of course cards */}
        <div className="inscription-cards-grid">
          {sessions.map((session) => {
            const enrolled = isEnrolled(session.id);
            const enrollmentCount = getEnrollmentCount(session.id);

            return (
              <div key={session.id} className="inscription-card">
                {/* Header with course type */}
                <div className="inscription-card-header">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span className={getTypeCoursClass(session.type_cours)}>
                      {session.type_cours}
                    </span>
                    {enrolled && (
                      <span className="inscription-inscrit-badge">
                        {t("courses.enrollment.enrolled")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="inscription-card-body">
                  {/* Date and day */}
                  <div className="inscription-info-item">
                    <CalendarAltIcon className="inscription-info-icon" />
                    <span className="inscription-date-text">
                      {session.date_cours ? (
                        <>
                          {session.jour_semaine} - {formatDateSansJour(session.date_cours)}
                        </>
                      ) : (
                        session.jour_semaine || t("courses.enrollment.unknownDate")
                      )}
                    </span>
                  </div>

                  {/* Schedule */}
                  <div className="inscription-info-item">
                    <ClockIcon className="inscription-info-icon" />
                    <span className="inscription-info-text">
                      {session.heure_debut} - {session.heure_fin}
                    </span>
                  </div>

                  {/* Instructors */}
                  {session.professeurs && session.professeurs.length > 0 && (
                    <div className="inscription-info-item">
                      <UserIcon className="inscription-info-icon" />
                      <div>
                        <span className="inscription-info-text">
                          {session.professeurs.length > 1
                            ? t("courses.enrollment.instructors")
                            : t("courses.enrollment.instructor")}
                          :
                        </span>
                        <div className="inscription-professeurs-container">
                          {session.professeurs.map((prof, idx) => (
                            <span key={idx} className="inscription-professeur-badge">
                              {prof.prenom} {prof.nom}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with action buttons */}
                <div className="inscription-card-footer">
                  <div className="inscription-actions">
                    {enrolled ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUnenrollment(session.id)}
                        isDisabled={unenrolling}
                        isLoading={unenrolling}
                      >
                        {t("courses.enrollment.unenroll")}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEnrollment(session.id)}
                        isDisabled={enrolling}
                        isLoading={enrolling}
                      >
                        {t("courses.enrollment.enroll")}
                      </Button>
                    )}

                    {/* View participants button - hidden for regular users */}
                    {canViewParticipants && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/pages/cours/${session.id}/participants`)}
                      >
                        {t("courses.enrollment.viewParticipants")}
                      </Button>
                    )}
                  </div>

                  {/* Enrollment count */}
                  {enrollmentCount > 0 && (
                    <span className="inscription-participants-count">
                      {t("courses.enrollment.participantsCount", { count: enrollmentCount })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="inscription-empty-state">
            <Title headingLevel="h3" style={{ color: "#6c757d", marginBottom: "1rem" }}>
              {t("courses.enrollment.noCourses")}
            </Title>
            <p>{t("courses.enrollment.noCoursesMessage")}</p>
          </div>
        )}
      </PageSection>
    </div>
  );
};

// Export with HOCs: Auth protection, Tracking, Error boundary
export default withAuth(withTracking(withErrorBoundary(InscriptionPage), "InscriptionPage"));
