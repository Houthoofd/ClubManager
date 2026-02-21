import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { PageSection, Title, Alert } from "@patternfly/react-core";
import { SkeletonDataList } from "@/shared/components/ui";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetSessionEnrollmentsQuery,
  useUpdateEnrollmentStatusMutation,
} from "@/core/api/graphql/generated/graphql";
import ParticipantCard from "../components/ParticipantCard";
import ParticipantsStats from "../components/ParticipantsStats";

/**
 * Format ISO date string to French locale
 */
function formatDateFromISO(isoDateString: string): string {
  const date = new Date(isoDateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Participant {
  id: number;
  nom: string;
  prenom: string;
  presence: number | null;
  userId?: number;
  sessionId?: number;
}

interface SessionEnrollment {
  id: number;
  utilisateurs?: Participant[];
  date_cours?: string;
}

/**
 * ParticipantsPage Component
 *
 * Displays participants list for a specific course session
 * Allows instructors/admins to validate or cancel attendance
 *
 * @architecture
 * - GraphQL: useGetSessionEnrollmentsQuery, useUpdateEnrollmentStatusMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin/teacher), withTracking, withErrorBoundary
 * - i18n: courses.participants.*
 *
 * @permissions Admin, Teacher only
 */
const ParticipantsPage = () => {
  const { t } = useTypedTranslation();
  const { id } = useParams();
  const coursId = Number(id);
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // GraphQL query to fetch session enrollments
  const {
    data: sessionData,
    loading: isLoading,
    error,
    refetch,
  } = useGetSessionEnrollmentsQuery({
    variables: { sessionId: coursId },
    skip: !coursId || isNaN(coursId),
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutation to update enrollment status
  const [updateEnrollmentStatus, { loading: updatingStatus }] =
    useUpdateEnrollmentStatusMutation();

  // Extract session data
  const cours = useMemo(() => {
    return sessionData?.sessionEnrollments as SessionEnrollment | undefined;
  }, [sessionData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!cours?.utilisateurs) {
      return { total: 0, presents: 0, absents: 0, nonDefinis: 0 };
    }

    const total = cours.utilisateurs.length;
    const presents = cours.utilisateurs.filter((u) => u.presence === 1).length;
    const absents = cours.utilisateurs.filter((u) => u.presence === 0).length;
    const nonDefinis = cours.utilisateurs.filter((u) => u.presence === null).length;

    return { total, presents, absents, nonDefinis };
  }, [cours?.utilisateurs]);

  /**
   * Handle presence validation or cancellation
   */
  const handleStatus = async (utilisateur: Participant, action: "valider" | "annuler") => {
    try {
      // Find the enrollment ID for this user in this session
      const enrollmentId = utilisateur.id;

      if (!enrollmentId) {
        throw new Error("Enrollment ID not found");
      }

      const newStatus = action === "valider" ? "present" : "absent";

      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: newStatus,
        },
      });

      const successMessage =
        action === "valider"
          ? t("courses.participants.presence.validated")
          : t("courses.participants.presence.cancelled");

      addNotification({
        type: "success",
        message: successMessage,
      });

      trackEvent(`presence_${action}`, {
        sessionId: coursId,
        enrollmentId,
        participantName: `${utilisateur.prenom} ${utilisateur.nom}`,
      });

      // Refetch to update UI
      await refetch();
    } catch (err) {
      console.error("Error updating presence:", err);

      addNotification({
        type: "error",
        message: t("courses.participants.presence.error"),
      });

      trackEvent("presence_update_failed", {
        sessionId: coursId,
        action,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageSection className="pf-v5-u-p-lg">
        <Title headingLevel="h2" className="pf-v5-u-mb-md">
          {t("courses.participants.loading")}
        </Title>
        <SkeletonDataList items={8} />
      </PageSection>
    );
  }

  // Error state
  if (error) {
    return (
      <PageSection>
        <Alert
          variant="danger"
          title={t("courses.participants.loadingError")}
          style={{ borderRadius: "8px" }}
        />
      </PageSection>
    );
  }

  // Course not found
  if (!cours) {
    return (
      <PageSection>
        <Alert
          variant="warning"
          title={t("courses.participants.courseNotFound")}
          style={{ borderRadius: "8px" }}
        />
      </PageSection>
    );
  }

  return (
    <div className="participants-container">
      {/* Header */}
      <div className="participants-header">
        <Title headingLevel="h1" size="2xl" className="participants-header-title">
          {t("courses.participants.title")}
        </Title>
        <p className="participants-header-subtitle">
          {t("courses.participants.subtitle", {
            date: cours.date_cours
              ? formatDateFromISO(cours.date_cours)
              : t("courses.enrollment.unknownDate"),
          })}
        </p>
      </div>

      {/* Statistics */}
      <ParticipantsStats
        totalParticipants={stats.total}
        presents={stats.presents}
        absents={stats.absents}
        nonDefinis={stats.nonDefinis}
      />

      {/* Participants list */}
      {cours.utilisateurs && cours.utilisateurs.length > 0 ? (
        <div>
          {cours.utilisateurs.map((utilisateur, idx) => (
            <ParticipantCard
              key={utilisateur.id || idx}
              utilisateur={utilisateur}
              onValidatePresence={() => handleStatus(utilisateur, "valider")}
              onCancelPresence={() => handleStatus(utilisateur, "annuler")}
              isDisabled={updatingStatus}
            />
          ))}
        </div>
      ) : (
        <div className="participants-empty-state">
          <Title headingLevel="h3" style={{ color: "#6c757d", marginBottom: "1rem" }}>
            {t("courses.participants.noParticipants")}
          </Title>
          <p>{t("courses.participants.noParticipantsMessage")}</p>
        </div>
      )}
    </div>
  );
};

// Export with HOCs: Role-based auth (admin/teacher only), Tracking, Error boundary
export default withAuthRole(
  withTracking(withErrorBoundary(ParticipantsPage), "ParticipantsPage"),
  ["admin", "teacher"]
);
