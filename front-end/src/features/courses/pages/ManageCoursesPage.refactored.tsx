import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  Button,
  Alert,
  Modal,
  ModalVariant,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Title,
  Divider,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { PlusCircleIcon, TrashIcon, EditIcon } from "@patternfly/react-icons";
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
import { CourseList, CourseSearch } from "../components";
import { useCourseSearch } from "../hooks";
import { formatTime } from "../utils";
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

/**
 * ManageCoursesPage Component
 *
 * Displays and manages all scheduled courses using atomic components.
 * Refactored to use CourseList, CourseSearch, and useCourseSearch hook.
 *
 * @architecture
 * - GraphQL: useGetSessionsQuery, useDeleteSessionMutation
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin/teacher), withAuth, withTracking, withErrorBoundary
 * - i18n: courses.manage.*
 * - Atomic Components: CourseList, CourseSearch
 * - Custom Hooks: useCourseSearch
 *
 * @permissions Admin, Teacher only
 */
const ManageCoursesPage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state: any) => state.addNotification);

  // Local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
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

  // Custom hook for search functionality
  const { searchValue, setSearchValue, clearSearch, filterCourses, hasSearch } = useCourseSearch();

  // Extract and transform sessions from query
  const sessions = useMemo(() => {
    return (sessionsData?.sessions || []) as Session[];
  }, [sessionsData]);

  // Apply search filter
  const filteredSessions = useMemo(() => {
    return filterCourses(sessions);
  }, [sessions, filterCourses]);

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
  const handleEditCourse = (courseId: string | number) => {
    trackEvent("course_edit_clicked", { sessionId: courseId });
    navigate(`/pages/cours/ajouter?id=${courseId}`);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteCourse = (courseId: string | number) => {
    const session = sessions.find((s) => s.id === Number(courseId));
    if (session) {
      setSessionToDelete(session);
      setShowDeleteModal(true);
      trackEvent("course_delete_clicked", { sessionId: session.id });
    }
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
   * Get type badge color
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

  /**
   * Render action buttons for each course card
   */
  const renderCourseActions = (course: any) => {
    return (
      <Dropdown
        onSelect={() => toggleActionDropdown(course.id)}
        toggle={
          <KebabToggle
            onToggle={() => toggleActionDropdown(course.id)}
            id={`toggle-${course.id}`}
          />
        }
        isOpen={actionDropdownOpen[course.id] || false}
        isPlain
        dropdownItems={[
          <DropdownItem
            key="edit"
            icon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditCourse(course.id);
            }}
          >
            {t("courses.manage.actions.edit")}
          </DropdownItem>,
          <DropdownItem
            key="delete"
            icon={<TrashIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCourse(course.id);
            }}
          >
            {t("courses.manage.actions.delete")}
          </DropdownItem>,
        ]}
      />
    );
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

        {/* Search Component */}
        {sessions.length > 0 && (
          <CourseSearch
            value={searchValue}
            onChange={setSearchValue}
            onClear={clearSearch}
            resultsCount={filteredSessions.length}
            totalCount={sessions.length}
            showResultsInfo={hasSearch}
          />
        )}

        {/* Course List Component */}
        <CourseList
          courses={filteredSessions}
          groupByDay={true}
          isFiltered={hasSearch}
          onCourseClick={handleEditCourse}
          renderActions={renderCourseActions}
          isLoading={loadingSessions}
        />
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

export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(ManageCoursesPage), "ManageCoursesPage")),
  ["admin", "teacher"],
);
