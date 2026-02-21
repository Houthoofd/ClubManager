import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageSection,
  Form,
  FormGroup,
  TextInput,
  Button,
  Select,
  SelectOption,
  SelectVariant,
  Alert,
  Modal,
  ModalVariant,
  List,
  ListItem,
} from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useGetSessionTypesQuery,
  useGetInstructorsQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useGetSessionQuery,
} from "@/core/api/graphql/generated/graphql";
import { useCheckCoursePlanning } from "@/features/auth/hooks/useVerification";

interface Instructor {
  id: number;
  name: string;
}

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

/**
 * AddCoursePage Component
 *
 * Form to create or edit a course session
 * Supports both create and edit modes via URL parameter ?id=X
 *
 * @architecture
 * - GraphQL: useCreateSessionMutation, useUpdateSessionMutation, useGetSessionQuery
 * - Zustand: uiStore (notifications)
 * - HOCs: withAuthRole (admin/teacher), withAuth, withTracking, withErrorBoundary
 * - i18n: courses.add.*
 *
 * @permissions Admin, Teacher only
 */
const AddCoursePage = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("id");
  const isEditMode = !!sessionId;
  const { trackEvent } = useTracking();

  // Zustand store
  const addNotification = useUiStore((state) => state.addNotification);

  // Form state
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [courseName, setCourseName] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedInstructors, setSelectedInstructors] = useState<Instructor[]>([]);

  // UI state
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false);
  const [showModificationsModal, setShowModificationsModal] = useState(false);
  const [modifications, setModifications] = useState<ModificationItem[]>([]);
  const [originalData, setOriginalData] = useState<any>(null);

  // GraphQL queries
  const { data: typesData } = useGetSessionTypesQuery();
  const { data: instructorsData } = useGetInstructorsQuery();
  const {
    data: sessionData,
    loading: loadingSession,
    error: sessionError,
  } = useGetSessionQuery({
    variables: { id: Number(sessionId) },
    skip: !isEditMode || !sessionId,
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [createSession, { loading: creating }] = useCreateSessionMutation();
  const [updateSession, { loading: updating }] = useUpdateSessionMutation();
  const checkCoursePlanning = useCheckCoursePlanning();

  // Extract data from queries
  const sessionTypes = useMemo(() => {
    return (typesData?.sessionTypes || []).map((type: any) => type.name || type);
  }, [typesData]);

  const instructors = useMemo(() => {
    return (instructorsData?.instructors || []).map((instructor: any) => ({
      id: instructor.id,
      name: `${instructor.prenom || instructor.first_name} ${instructor.nom || instructor.last_name}`,
    }));
  }, [instructorsData]);

  const days = useMemo(
    () => [
      t("courses.add.days.Monday"),
      t("courses.add.days.Tuesday"),
      t("courses.add.days.Wednesday"),
      t("courses.add.days.Thursday"),
      t("courses.add.days.Friday"),
      t("courses.add.days.Saturday"),
      t("courses.add.days.Sunday"),
    ],
    [t]
  );

  // Load existing session data in edit mode
  useEffect(() => {
    if (isEditMode && sessionData?.session) {
      const session = sessionData.session;

      setSelectedType(session.type_cours || "");
      setSelectedDay(session.jour_semaine || session.jour || "");
      setCourseName(
        session.nom || `${session.type_cours} - ${session.jour_semaine || session.jour}`
      );
      setStartTime(session.heure_debut?.substring(0, 5) || "");
      setEndTime(session.heure_fin?.substring(0, 5) || "");

      const sessionInstructors =
        session.professeurs?.map((prof: any) => ({
          id: prof.id,
          name: `${prof.prenom || prof.first_name} ${prof.nom || prof.last_name}`,
        })) || [];
      setSelectedInstructors(sessionInstructors);

      setOriginalData({
        type: session.type_cours,
        day: session.jour_semaine || session.jour,
        name: session.nom,
        startTime: session.heure_debut?.substring(0, 5),
        endTime: session.heure_fin?.substring(0, 5),
        instructors: sessionInstructors,
      });

      trackEvent("course_edit_started", { sessionId });
    }
  }, [isEditMode, sessionData, trackEvent, sessionId]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    if (!selectedType) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.typeRequired"),
      });
      return false;
    }

    if (!selectedDay) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.dayRequired"),
      });
      return false;
    }

    if (!courseName.trim()) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.nameRequired"),
      });
      return false;
    }

    if (!startTime) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.startTimeRequired"),
      });
      return false;
    }

    if (!endTime) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.endTimeRequired"),
      });
      return false;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.invalidTimeFormat"),
      });
      return false;
    }

    // Validate end time is after start time
    if (startTime >= endTime) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.endTimeBeforeStart"),
      });
      return false;
    }

    if (selectedInstructors.length === 0) {
      addNotification({
        type: "error",
        message: t("courses.add.validation.instructorsRequired"),
      });
      return false;
    }

    return true;
  };

  /**
   * Detect modifications for edit mode
   */
  const detectModifications = (): ModificationItem[] => {
    if (!originalData) return [];

    const changes: ModificationItem[] = [];

    if (selectedType !== originalData.type) {
      changes.push({
        field: t("courses.add.modifications.type"),
        oldValue: originalData.type,
        newValue: selectedType,
      });
    }

    if (selectedDay !== originalData.day) {
      changes.push({
        field: t("courses.add.modifications.day"),
        oldValue: originalData.day,
        newValue: selectedDay,
      });
    }

    if (courseName !== originalData.name) {
      changes.push({
        field: t("courses.add.modifications.name"),
        oldValue: originalData.name,
        newValue: courseName,
      });
    }

    if (startTime !== originalData.startTime) {
      changes.push({
        field: t("courses.add.modifications.startTime"),
        oldValue: originalData.startTime,
        newValue: startTime,
      });
    }

    if (endTime !== originalData.endTime) {
      changes.push({
        field: t("courses.add.modifications.endTime"),
        oldValue: originalData.endTime,
        newValue: endTime,
      });
    }

    // Check instructor changes
    const originalInstructorIds = originalData.instructors.map((i: Instructor) => i.id).sort();
    const currentInstructorIds = selectedInstructors.map((i) => i.id).sort();

    if (JSON.stringify(originalInstructorIds) !== JSON.stringify(currentInstructorIds)) {
      const added = selectedInstructors.filter(
        (i) => !originalData.instructors.some((orig: Instructor) => orig.id === i.id)
      );
      const removed = originalData.instructors.filter(
        (i: Instructor) => !selectedInstructors.some((curr) => curr.id === i.id)
      );

      if (added.length > 0) {
        changes.push({
          field: t("courses.add.modifications.instructorsAdded"),
          oldValue: "",
          newValue: added.map((i) => i.name).join(", "),
        });
      }

      if (removed.length > 0) {
        changes.push({
          field: t("courses.add.modifications.instructorsRemoved"),
          oldValue: removed.map((i: Instructor) => i.name).join(", "),
          newValue: "",
        });
      }
    }

    return changes;
  };

  /**
   * Check for schedule conflicts
   */
  const checkScheduleConflict = async (): Promise<boolean> => {
    try {
      const conflict = await checkCoursePlanning(
        selectedDay,
        startTime,
        endTime,
        selectedType,
        isEditMode
          ? {
              excludeOriginal: true,
              originalJour: originalData?.day,
              originalType: originalData?.type,
              originalHeureDebut: originalData?.startTime,
              originalHeureFin: originalData?.endTime,
            }
          : undefined
      );

      if (conflict) {
        addNotification({
          type: "error",
          message: t("courses.add.error.conflict", {
            day: selectedDay,
            startTime,
            endTime,
          }),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking schedule conflict:", error);
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode) {
      // Detect modifications
      const detectedChanges = detectModifications();

      if (detectedChanges.length === 0) {
        addNotification({
          type: "info",
          message: t("courses.add.modifications.noChanges"),
        });
        return;
      }

      // Show confirmation modal for modifications
      setModifications(detectedChanges);
      setShowModificationsModal(true);
    } else {
      // Check for conflicts before creating
      const hasConflict = await checkScheduleConflict();
      if (hasConflict) {
        return;
      }

      await executeCreate();
    }
  };

  /**
   * Execute course creation
   */
  const executeCreate = async () => {
    try {
      await createSession({
        variables: {
          input: {
            type_cours: selectedType,
            jour_semaine: selectedDay,
            nom: courseName,
            heure_debut: startTime,
            heure_fin: endTime,
            professeurs: selectedInstructors.map((i) => i.name),
          },
        },
      });

      addNotification({
        type: "success",
        message: t("courses.add.success.created", {
          type: selectedType,
          day: selectedDay,
        }),
      });

      trackEvent("course_created", {
        type: selectedType,
        day: selectedDay,
        instructorCount: selectedInstructors.length,
      });

      // Redirect to manage page
      setTimeout(() => {
        navigate("/pages/cours/gerer");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating course:", error);

      addNotification({
        type: "error",
        message: error?.message || t("courses.add.error.createFailed"),
      });

      trackEvent("course_create_failed", {
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Execute course update
   */
  const executeUpdate = async () => {
    try {
      // Check for conflicts
      const hasConflict = await checkScheduleConflict();
      if (hasConflict) {
        setShowModificationsModal(false);
        return;
      }

      await updateSession({
        variables: {
          id: Number(sessionId),
          input: {
            type_cours: selectedType,
            jour: selectedDay,
            nom: courseName,
            heure_debut: startTime,
            heure_fin: endTime,
            professeurs: selectedInstructors.map((i) => i.name),
          },
        },
      });

      addNotification({
        type: "success",
        message: t("courses.add.success.updated"),
      });

      trackEvent("course_updated", {
        sessionId,
        modificationsCount: modifications.length,
      });

      setShowModificationsModal(false);

      // Redirect to manage page
      setTimeout(() => {
        navigate("/pages/cours/gerer");
      }, 1500);
    } catch (error: any) {
      console.error("Error updating course:", error);

      addNotification({
        type: "error",
        message: error?.message || t("courses.add.error.updateFailed"),
      });

      trackEvent("course_update_failed", {
        sessionId,
        error: error?.message || "unknown",
      });

      setShowModificationsModal(false);
    }
  };

  /**
   * Toggle instructor selection
   */
  const toggleInstructor = (instructor: Instructor) => {
    const isSelected = selectedInstructors.some((i) => i.id === instructor.id);

    if (isSelected) {
      setSelectedInstructors(selectedInstructors.filter((i) => i.id !== instructor.id));
    } else {
      setSelectedInstructors([...selectedInstructors, instructor]);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    if (isEditMode && originalData) {
      setSelectedType(originalData.type);
      setSelectedDay(originalData.day);
      setCourseName(originalData.name);
      setStartTime(originalData.startTime);
      setEndTime(originalData.endTime);
      setSelectedInstructors(originalData.instructors);
    } else {
      setSelectedType("");
      setSelectedDay("");
      setCourseName("");
      setStartTime("");
      setEndTime("");
      setSelectedInstructors([]);
    }
  };

  // Loading state
  if (isEditMode && loadingSession) {
    return (
      <div>
        <PageHeader
          title={t("courses.add.titleEdit")}
          subtitle={t("courses.add.subtitleEdit")}
          variant="courses"
        />
        <PageSection>
          <Alert variant="info" title={t("common.loading")} />
        </PageSection>
      </div>
    );
  }

  // Error state
  if (isEditMode && sessionError) {
    return (
      <div>
        <PageHeader
          title={t("courses.add.titleEdit")}
          subtitle={t("courses.add.subtitleEdit")}
          variant="courses"
        />
        <PageSection>
          <Alert variant="danger" title={t("courses.add.error.loadFailed")} />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? t("courses.add.titleEdit") : t("courses.add.title")}
        subtitle={isEditMode ? t("courses.add.subtitleEdit") : t("courses.add.subtitle")}
        variant="courses"
      />

      <PageSection>
        <Form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
          {/* Course Type */}
          <FormGroup label={t("courses.add.form.type")} isRequired>
            <Select
              variant={SelectVariant.single}
              onToggle={() => setIsTypeOpen(!isTypeOpen)}
              onSelect={(_, value) => {
                setSelectedType(value as string);
                setIsTypeOpen(false);
              }}
              selections={selectedType}
              isOpen={isTypeOpen}
              placeholderText={t("courses.add.form.typePlaceholder")}
            >
              {sessionTypes.map((type: string) => (
                <SelectOption key={type} value={type}>
                  {type}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {/* Day of Week */}
          <FormGroup label={t("courses.add.form.day")} isRequired>
            <Select
              variant={SelectVariant.single}
              onToggle={() => setIsDayOpen(!isDayOpen)}
              onSelect={(_, value) => {
                setSelectedDay(value as string);
                setIsDayOpen(false);
              }}
              selections={selectedDay}
              isOpen={isDayOpen}
              placeholderText={t("courses.add.form.dayPlaceholder")}
            >
              {days.map((day) => (
                <SelectOption key={day} value={day}>
                  {day}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {/* Course Name */}
          <FormGroup label={t("courses.add.form.name")} isRequired>
            <TextInput
              type="text"
              value={courseName}
              onChange={(value) => setCourseName(value)}
              placeholder={t("courses.add.form.namePlaceholder")}
            />
          </FormGroup>

          {/* Start Time */}
          <FormGroup label={t("courses.add.form.startTime")} isRequired>
            <TextInput
              type="time"
              value={startTime}
              onChange={(value) => setStartTime(value)}
              placeholder={t("courses.add.form.startTimePlaceholder")}
            />
          </FormGroup>

          {/* End Time */}
          <FormGroup label={t("courses.add.form.endTime")} isRequired>
            <TextInput
              type="time"
              value={endTime}
              onChange={(value) => setEndTime(value)}
              placeholder={t("courses.add.form.endTimePlaceholder")}
            />
          </FormGroup>

          {/* Instructors */}
          <FormGroup label={t("courses.add.form.instructors")} isRequired>
            <Select
              variant={SelectVariant.checkbox}
              onToggle={() => setIsInstructorsOpen(!isInstructorsOpen)}
              onSelect={(_, value) => {
                const instructor = instructors.find((i) => i.name === value);
                if (instructor) {
                  toggleInstructor(instructor);
                }
              }}
              selections={selectedInstructors.map((i) => i.name)}
              isOpen={isInstructorsOpen}
              placeholderText={
                selectedInstructors.length > 0
                  ? `${selectedInstructors.length} sélectionné(s)`
                  : t("courses.add.form.instructorsPlaceholder")
              }
            >
              {instructors.map((instructor) => (
                <SelectOption key={instructor.id} value={instructor.name}>
                  {instructor.name}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <Button
              type="submit"
              variant="primary"
              isDisabled={creating || updating}
              isLoading={creating || updating}
            >
              {isEditMode ? t("courses.add.submitEdit") : t("courses.add.submit")}
            </Button>

            <Button variant="secondary" onClick={resetForm} isDisabled={creating || updating}>
              {t("courses.add.reset")}
            </Button>

            <Button
              variant="link"
              onClick={() => navigate("/pages/cours/gerer")}
              isDisabled={creating || updating}
            >
              {t("courses.add.cancel")}
            </Button>
          </div>
        </Form>
      </PageSection>

      {/* Modifications confirmation modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("courses.add.modifications.title")}
        isOpen={showModificationsModal}
        onClose={() => setShowModificationsModal(false)}
        actions={[
          <Button key="confirm" variant="primary" onClick={executeUpdate} isLoading={updating}>
            {t("courses.add.modifications.confirm")}
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={() => setShowModificationsModal(false)}
            isDisabled={updating}
          >
            {t("courses.add.modifications.cancel")}
          </Button>,
        ]}
      >
        <div>
          <p style={{ marginBottom: "1rem" }}>{t("courses.add.modifications.subtitle")}</p>
          <List>
            {modifications.map((mod, idx) => (
              <ListItem key={idx}>
                <strong>{mod.field}:</strong>{" "}
                {mod.oldValue && (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#6a6e73" }}>
                      {mod.oldValue}
                    </span>{" "}
                    →{" "}
                  </>
                )}
                <span style={{ color: "#06c" }}>{mod.newValue}</span>
              </ListItem>
            ))}
          </List>
        </div>
      </Modal>
    </div>
  );
};

// Export with HOCs: Role-based auth, Auth, Tracking, Error boundary
export default withAuthRole(
  withAuth(withTracking(withErrorBoundary(AddCoursePage), "AddCoursePage")),
  ["admin", "teacher"]
);
