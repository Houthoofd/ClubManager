import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  Button,
  Alert,
  Card,
  CardBody,
  CardTitle,
  CardActions,
  CardHeader,
  Modal,
  ModalVariant,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  KebabToggle,
  Title,
  Divider,
  Label,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import {
  ClockIcon,
  UserIcon,
  PlusCircleIcon,
  TrashIcon,
  EditIcon,
  UsersIcon,
} from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { SkeletonDataList } from "@/shared/components/ui";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetSessionsQuery,
  useDeleteSessionMutation,
} from "@/core/api/graphql/generated/graphql";
import "@/styles/inscription.css";

interface Instructor {
  id: number;
  nom: string;
  prenom: string;
}

interface Session {
  id: number;
  type_cours: string;
  jour_semaine?: string;
  jour?: string;
  heure_debut: string;
  heure_fin: string;
  nom?: string;
  professeurs?: Instructor[];
}

interface GroupedSessions {
  [day: string]: Session[];
}

/**
 * ManageCoursesPage Component
 *
 * Displays and manages all scheduled courses
 * Allows editing, deleting, and managing instructors
 *
 * @architecture
 * - GraphQL: useGetSessionsQuery, useDeleteSessionMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin/teacher), withAuth, withTracking, withErrorBoundary
 * - i18n: courses.manage.*
 *
 * @permissions Admin, Teacher only
 */
const ManageCoursesPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // Local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [showLastInstructorWarning, setShowLastInstructorWarning] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<{ [key: number]: boolean }>({});

  // GraphQL queries
  const {
    data: sessionsData,
    loading: loadingSessions,
    error: errorSessions,
    refetch: refetchSessions,
  } = useGetSessionsQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [deleteSession, { loading: deleting }] = useDeleteSessionMutation();

  // Extract sessions from query
  const sessions = useMemo(() => {
    return (sessionsData?.sessions || []) as Session[];
  }, [sessionsData]);

  // Group sessions by day
  const groupedSessions = useMemo(() => {
    const groups: GroupedSessions = {};

    const dayOrder = [
      t("courses.manage.group.monday"),
      t("courses.manage.group.tuesday"),
      t("courses.manage.group.wednesday"),
      t("courses.manage.group.thursday"),
      t("courses.manage.group.friday"),
      t("courses.manage.group.saturday"),
      t("courses.manage.group.sunday"),
    ];

    sessions.forEach((session) => {
      const day = session.jour_semaine || session.jour || "Unknown";
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(session);
    });

    // Sort sessions within each day by start time
    Object.keys(groups).forEach((day) => {
      groups[day].sort((a, b) => {
        return (a.heure_debut || "").localeCompare(b.heure_fin || "");
      });
    });

    // Return groups sorted by day order
    const sortedGroups: GroupedSessions = {};
    dayOrder.forEach((day) => {
      if (groups[day]) {
        sortedGroups[day] = groups[day];
      }
    });

    // Add any remaining days not in the standard order
    Object.keys(groups).forEach((day) => {
      if (!sortedGroups[day]) {
        sortedGroups[day] = groups[day];
      }
    });

    return sortedGroups;
  }, [sessions, t]);

  // Calculate stats
  const stats = useMemo(() => {
    const uniqueInstructors = new Set<number>();
    sessions.forEach((session) => {
      session.professeurs?.forEach((prof) => {
        uniqueInstructors.add(prof.id);
      });
    });

    return {
      totalCourses: sessions.length,
      totalInstructors: uniqueInstructors.size,
    };
  }, [sessions]);

  /**
   * Toggle action dropdown for a session
   */
  const toggleActionDropdown = (sessionId: number) => {
    setActionDropdownOpen((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  /**
   * Navigate to edit course page
   */
  const handleEditCourse = (session: Session) => {
    trackEvent("course_edit_clicked", { sessionId: session.id });
    navigate(`/pages/cours/ajouter?id=${session.id}`);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteCourse = (session: Session) => {
    setSessionToDelete(session);
    setShowDeleteModal(true);
    trackEvent("course_delete_clicked", { sessionId: session.id });
  };

  /**
   * Execute course deletion
   */
  const executeDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSession({
        variables: {
          id: sessionToDelete.id,
        },
      });

      addNotification({
        type: "success",
        message: t("courses.manage.delete.success"),
      });

      trackEvent("course_deleted", {
        sessionId: sessionToDelete.id,
        type: sessionToDelete.type_cours,
        day: sessionToDelete.jour_semaine || sessionToDelete.jour,
      });

      setShowDeleteModal(false);
      setSessionToDelete(null);

      // Refetch sessions
      await refetchSessions();
    } catch (error: any) {
      console.error("Error deleting course:", error);

      addNotification({
        type: "error",
        message: error?.message || t("courses.manage.delete.error"),
      });

      trackEvent("course_delete_failed", {
        sessionId: sessionToDelete.id,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Format time for display (HH:MM)
   */
  const formatTime = (time: string): string => {
    return time?.substring(0, 5) || "";
  };

  /**
   * Get type badge variant
   */
  const getTypeBadgeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      Judo: "blue",
      Karate: "orange",
      Taekwondo: "purple",
      Aikido: "green",
      "Jiu-Jitsu": "red",
    };
    return typeColors[type] || "grey";
  };

  // Loading state
  if (loadingSessions) {
    return (
      <div>
        <PageHeader
          title={t("courses.manage.title")}
          subtitle={t("courses.manage.subtitle")}
          variant="courses"
        />
        <PageSection>
          <div className="pf-v5-u-p-lg">
            <Title headingLevel="h2" className="pf-v5-u-mb-md">
              {t("courses.manage.loading")}
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
      <div>
        <PageHeader
          title={t("courses.manage.title")}
          subtitle={t("courses.manage.subtitle")}
          variant="courses"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("courses.manage.loadingError")}
            style={{ borderRadius: "8px" }}
          />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("courses.manage.title")}
        subtitle={t("courses.manage.subtitle")}
        variant="courses"
      />

      <PageSection>
        {/* Stats and Add button */}
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          style={{ marginBottom: "2rem" }}
        >
          <FlexItem>
            <Flex spaceItems={{ default: "spaceItemsLg" }}>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem" }}>
                    {stats.totalCourses}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("courses.manage.stats.totalCourses")}
                  </p>
                </div>
              </FlexItem>
              <FlexItem>
                <div>
                  <Title headingLevel="h3" size="md" style={{ marginBottom: "0.25rem" }}>
                    {stats.totalInstructors}
                  </Title>
                  <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                    {t("courses.manage.stats.totalInstructors")}
                  </p>
                </div>
              </FlexItem>
            </Flex>
          </FlexItem>

          <FlexItem>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate("/pages/cours/ajouter")}
            >
              {t("courses.manage.createFirst")}
            </Button>
          </FlexItem>
        </Flex>

        <Divider style={{ marginBottom: "2rem" }} />

        {/* Course groups by day */}
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="inscription-empty-state">
            <Title headingLevel="h3" style={{ color: "#6c757d", marginBottom: "1rem" }}>
              {t("courses.manage.noCourses")}
            </Title>
            <p style={{ marginBottom: "1.5rem" }}>{t("courses.manage.noCoursesMessage")}</p>
            <Button
              variant="primary"
              icon={<PlusCircleIcon />}
              onClick={() => navigate("/pages/cours/ajouter")}
            >
              {t("courses.manage.createFirst")}
            </Button>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([day, daySessions]) => (
            <div key={day} style={{ marginBottom: "2rem" }}>
              {/* Day header */}
              <div style={{ marginBottom: "1rem" }}>
                <Title headingLevel="h2" size="lg">
                  {day}
                </Title>
                <p style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                  {daySessions.length} {t("courses.manage.stats.coursesPerDay")}
                </p>
              </div>

              {/* Sessions for this day */}
              <div style={{ display: "grid", gap: "1rem" }}>
                {daySessions.map((session) => (
                  <Card key={session.id} isRounded isCompact>
                    <CardHeader>
                      <CardTitle>
                        <Flex
                          justifyContent={{ default: "justifyContentSpaceBetween" }}
                          alignItems={{ default: "alignItemsCenter" }}
                        >
                          <FlexItem>
                            <Label color={getTypeBadgeColor(session.type_cours) as any}>
                              {session.type_cours}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Dropdown
                              onSelect={() => toggleActionDropdown(session.id)}
                              toggle={
                                <KebabToggle
                                  onToggle={() => toggleActionDropdown(session.id)}
                                  id={`toggle-${session.id}`}
                                />
                              }
                              isOpen={actionDropdownOpen[session.id] || false}
                              isPlain
                              dropdownItems={[
                                <DropdownItem
                                  key="edit"
                                  icon={<EditIcon />}
                                  onClick={() => handleEditCourse(session)}
                                >
                                  {t("courses.manage.actions.edit")}
                                </DropdownItem>,
                                <DropdownItem
                                  key="delete"
                                  icon={<TrashIcon />}
                                  onClick={() => handleDeleteCourse(session)}
                                >
                                  {t("courses.manage.actions.delete")}
                                </DropdownItem>,
                              ]}
                            />
                          </FlexItem>
                        </Flex>
                      </CardTitle>
                    </CardHeader>

                    <CardBody>
                      <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsSm" }}>
                        {/* Course name */}
                        {session.nom && (
                          <FlexItem>
                            <strong>{session.nom}</strong>
                          </FlexItem>
                        )}

                        {/* Schedule */}
                        <FlexItem>
                          <Flex alignItems={{ default: "alignItemsCenter" }}>
                            <FlexItem>
                              <ClockIcon style={{ marginRight: "0.5rem", color: "#6a6e73" }} />
                            </FlexItem>
                            <FlexItem>
                              {formatTime(session.heure_debut)} - {formatTime(session.heure_fin)}
                            </FlexItem>
                          </Flex>
                        </FlexItem>

                        {/* Instructors */}
                        {session.professeurs && session.professeurs.length > 0 && (
                          <FlexItem>
                            <Flex alignItems={{ default: "alignItemsCenter" }}>
                              <FlexItem>
                                {session.professeurs.length > 1 ? (
                                  <UsersIcon style={{ marginRight: "0.5rem", color: "#6a6e73" }} />
                                ) : (
                                  <UserIcon style={{ marginRight: "0.5rem", color: "#6a6e73" }} />
                                )}
                              </FlexItem>
                              <FlexItem>
                                <Flex spaceItems={{ default: "spaceItemsXs" }}>
                                  {session.professeurs.map((prof, idx) => (
                                    <FlexItem key={prof.id}>
                                      <Label color="blue" isCompact>
                                        {prof.prenom} {prof.nom}
                                      </Label>
                                    </FlexItem>
                                  ))}
                                </Flex>
                              </FlexItem>
                            </Flex>
                          </FlexItem>
                        )}
                      </Flex>
                    </CardBody>

                    <CardActions>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<EditIcon />}
                        onClick={() => handleEditCourse(session)}
                      >
                        {t("courses.manage.actions.edit")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<TrashIcon />}
                        onClick={() => handleDeleteCourse(session)}
                      >
                        {t("courses.manage.actions.delete")}
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </PageSection>

      {/* Delete confirmation modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("courses.manage.delete.confirmTitle")}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        actions={[
          <Button key="confirm" variant="danger" onClick={executeDelete} isLoading={deleting}>
            {t("courses.manage.delete.confirm")}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setShowDeleteModal(false)}
            isDisabled={deleting}
          >
            {t("courses.manage.delete.cancel")}
          </Button>,
        ]}
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>{t("courses.manage.delete.confirmMessage")}</p>
          {sessionToDelete && (
            <>
              <Alert
                variant="warning"
                isInline
                title={t("courses.manage.delete.confirmMessageDetails", {
                  day: sessionToDelete.jour_semaine || sessionToDelete.jour,
                  type: sessionToDelete.type_cours,
                  startTime: formatTime(sessionToDelete.heure_debut),
                  endTime: formatTime(sessionToDelete.heure_fin),
                })}
              />
              <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6a6e73" }}>
                {t("courses.manage.delete.allOccurrences")}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Export with HOCs: Role-based auth, Auth, Tracking, Error boundary
export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(ManageCoursesPage), "ManageCoursesPage")),
  ["admin", "teacher"]
);
