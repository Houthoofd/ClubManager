/**
 * ============================================================================
 * TeachersManagePage - Refactored
 * ============================================================================
 *
 * Admin page for managing instructors/teachers.
 *
 * Features:
 * - GraphQL typed hooks (useGetInstructorsQuery, useCreateInstructorMutation, etc.)
 * - Zustand stores (authStore, uiStore)
 * - react-i18next for translations
 * - PatternFly UI components
 * - Sentry tracking via withTracking HOC
 * - HOCs: withAuth, withAuthRole, withTracking, withErrorBoundary
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
  Card,
  CardBody,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  EmptyState,
  Title,
  EmptyStateBody,
  EmptyStateIcon,
  Button,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  ActionList,
  ActionListItem,
  Label,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { UserIcon, SearchIcon, PlusCircleIcon, EditIcon, TrashIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";
import { useTracking } from "@/shared/hooks/useTracking";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { withAuth } from "@/shared/hocs/withAuth";
import { withAuthRole } from "@/shared/hocs/withAuthRole";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useAuthStore } from "@/core/stores/authStore";
import { useUiStore } from "@/core/stores/uiStore";
import {
  useGetInstructorsQuery,
  useCreateInstructorMutation,
  useUpdateInstructorMutation,
  useDeleteInstructorMutation,
} from "@/core/api/apollo/generated/graphql";
import type { TeacherListItem } from "@clubmanager/types";

// ============================================================================
// Constants
// ============================================================================

const TEACHER_TABS = {
  LIST: 0,
  ADD: 1,
} as const;

// ============================================================================
// Component
// ============================================================================

const TeachersManagePage: React.FC = () => {
  const { t } = useTranslation();
  const { trackEvent } = useTracking();
  const { user } = useAuthStore();
  const { showNotification } = useUiStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<number>(TEACHER_TABS.LIST);
  const [searchValue, setSearchValue] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherListItem | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    specialization: "",
    bio: "",
    certifications: "",
  });

  // GraphQL queries and mutations
  const {
    data: instructorsData,
    loading,
    error,
    refetch,
  } = useGetInstructorsQuery({
    onError: (err) => {
      console.error("❌ Error fetching instructors:", err);
      trackEvent("teachers_load_error", {
        error: err.message,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.errors.loadFailed", "Erreur lors du chargement des professeurs"),
        "danger",
      );
    },
  });

  const [createInstructor, { loading: creating }] = useCreateInstructorMutation({
    onCompleted: (data) => {
      trackEvent("teacher_created", {
        instructor_id: data.createInstructor?.id,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.success.created", "Professeur créé avec succès"),
        "success",
      );
      refetch();
    },
    onError: (err) => {
      console.error("❌ Error creating instructor:", err);
      trackEvent("teacher_create_error", {
        error: err.message,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.errors.createFailed", "Erreur lors de la création du professeur"),
        "danger",
      );
    },
  });

  const [updateInstructor, { loading: updating }] = useUpdateInstructorMutation({
    onCompleted: (data) => {
      trackEvent("teacher_updated", {
        instructor_id: data.updateInstructor?.id,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.success.updated", "Professeur mis à jour avec succès"),
        "success",
      );
      setShowEditModal(false);
      setSelectedTeacher(null);
      refetch();
    },
    onError: (err) => {
      console.error("❌ Error updating instructor:", err);
      trackEvent("teacher_update_error", {
        error: err.message,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.errors.updateFailed", "Erreur lors de la mise à jour du professeur"),
        "danger",
      );
    },
  });

  const [deleteInstructor, { loading: deleting }] = useDeleteInstructorMutation({
    onCompleted: () => {
      trackEvent("teacher_deleted", {
        instructor_id: selectedTeacher?.id,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.success.deleted", "Professeur supprimé avec succès"),
        "success",
      );
      setShowDeleteModal(false);
      setSelectedTeacher(null);
      refetch();
    },
    onError: (err) => {
      console.error("❌ Error deleting instructor:", err);
      trackEvent("teacher_delete_error", {
        error: err.message,
        admin_id: user?.id,
      });
      showNotification(
        t("teachers.manage.errors.deleteFailed", "Erreur lors de la suppression du professeur"),
        "danger",
      );
    },
  });

  // Transform instructors to teacher list items
  const teachers: TeacherListItem[] = useMemo(() => {
    if (!instructorsData?.instructors) return [];

    return instructorsData.instructors.map((instructor: any) => ({
      id: instructor.id,
      user_id: instructor.user_id,
      first_name: instructor.user?.first_name || "",
      last_name: instructor.user?.last_name || "",
      email: instructor.user?.email || "",
      specialization: instructor.specialization,
      bio: instructor.bio,
      certifications: instructor.certifications,
      active: instructor.active ?? true,
      hire_date: instructor.hire_date,
    }));
  }, [instructorsData]);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    if (!searchValue.trim()) return teachers;

    const searchTerm = searchValue.toLowerCase().trim();
    return teachers.filter((teacher) => {
      const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase();
      const email = teacher.email?.toLowerCase() || "";
      const specialization = teacher.specialization?.toLowerCase() || "";

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        specialization.includes(searchTerm)
      );
    });
  }, [teachers, searchValue]);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent("teachers_manage_page_view", {
      admin_id: user?.id,
      teachers_count: teachers.length,
    });
  }, [trackEvent, user?.id, teachers.length]);

  // Event handlers
  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === "number") {
      setActiveTabKey(tabIndex);
      trackEvent("teachers_tab_change", {
        tab: tabIndex === TEACHER_TABS.LIST ? "list" : "add",
        admin_id: user?.id,
      });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    trackEvent("teachers_search", {
      query: value,
      results_count: filteredTeachers.length,
    });
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  const handleEditClick = (teacher: TeacherListItem) => {
    setSelectedTeacher(teacher);
    setFormData({
      specialization: teacher.specialization || "",
      bio: teacher.bio || "",
      certifications: teacher.certifications || "",
    });
    setShowEditModal(true);
    trackEvent("teacher_edit_modal_open", {
      instructor_id: teacher.id,
    });
  };

  const handleDeleteClick = (teacher: TeacherListItem) => {
    setSelectedTeacher(teacher);
    setShowDeleteModal(true);
    trackEvent("teacher_delete_modal_open", {
      instructor_id: teacher.id,
    });
  };

  const handleUpdateSubmit = async () => {
    if (!selectedTeacher) return;

    try {
      await updateInstructor({
        variables: {
          id: selectedTeacher.id,
          input: {
            specialization: formData.specialization,
            bio: formData.bio,
            certifications: formData.certifications,
          },
        },
      });
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;

    try {
      await deleteInstructor({
        variables: {
          id: selectedTeacher.id,
        },
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="teachers-page">
        <PageHeader
          title={t("teachers.manage.title", "Gestion des professeurs")}
          subtitle={t("teachers.manage.subtitle", "Gérez les professeurs et leurs informations")}
          variant="teachers"
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
              {t("teachers.manage.loading", "Chargement des professeurs...")}
            </p>
          </div>
        </PageSection>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="teachers-page">
        <PageHeader
          title={t("teachers.manage.title", "Gestion des professeurs")}
          subtitle={t("teachers.manage.subtitle", "Gérez les professeurs et leurs informations")}
          variant="teachers"
        />
        <PageSection>
          <Alert
            variant="danger"
            title={t("teachers.manage.errors.loadTitle", "Erreur de chargement")}
            isInline
            actionClose={
              <Button variant="link" onClick={() => refetch()}>
                {t("common.actions.retry", "Réessayer")}
              </Button>
            }
          >
            {t(
              "teachers.manage.errors.loadFailed",
              "Impossible de charger les professeurs. Veuillez réessayer.",
            )}
          </Alert>
        </PageSection>
      </div>
    );
  }

  // Main render
  return (
    <div className="teachers-page">
      <PageHeader
        title={t("teachers.manage.title", "Gestion des professeurs")}
        subtitle={t("teachers.manage.subtitle", "Gérez les professeurs et leurs informations")}
        variant="teachers"
      />

      <PageSection className="teachers-content">
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick} className="modern-tabs">
          {/* Tab: Liste des professeurs */}
          <Tab
            eventKey={TEACHER_TABS.LIST}
            title={
              <TabTitleText>
                <span>{t("teachers.manage.tabs.list", "Liste des professeurs")}</span>
              </TabTitleText>
            }
          >
            <Card>
              <CardBody>
                {/* Toolbar with search */}
                <Toolbar style={{ marginBottom: "1rem" }}>
                  <ToolbarContent>
                    <ToolbarItem style={{ flexGrow: 1, width: "100%" }}>
                      <SearchInput
                        placeholder={t(
                          "teachers.manage.searchPlaceholder",
                          "Rechercher un professeur (nom, email, spécialisation)...",
                        )}
                        value={searchValue}
                        onChange={(_event: React.FormEvent<HTMLInputElement>, value: string) =>
                          handleSearchChange(value)
                        }
                        onClear={handleClearSearch}
                        style={{ width: "100%" }}
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </Toolbar>

                {/* Search results info */}
                {searchValue && (
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      {t(
                        "teachers.manage.searchResults",
                        "{{count}} professeur(s) trouvé(s) sur {{total}}",
                        { count: filteredTeachers.length, total: teachers.length },
                      )}
                    </span>
                  </div>
                )}

                {/* Teachers list */}
                {filteredTeachers.length === 0 ? (
                  <EmptyState>
                    {searchValue ? (
                      <EmptyStateIcon icon={SearchIcon} />
                    ) : (
                      <EmptyStateIcon icon={UserIcon} />
                    )}
                    <Title headingLevel="h4" size="lg">
                      {searchValue
                        ? t("teachers.manage.empty.noResults", "Aucun résultat")
                        : t("teachers.manage.empty.noTeachers", "Aucun professeur")}
                    </Title>
                    <EmptyStateBody>
                      {searchValue
                        ? t(
                            "teachers.manage.empty.tryDifferent",
                            "Essayez de modifier votre recherche",
                          )
                        : t(
                            "teachers.manage.empty.addFirst",
                            "Aucun professeur n'a encore été ajouté au système",
                          )}
                    </EmptyStateBody>
                  </EmptyState>
                ) : (
                  <div className="teachers-list">
                    {filteredTeachers.map((teacher) => (
                      <Card
                        key={teacher.id}
                        className="teacher-card"
                        style={{ marginBottom: "1rem" }}
                      >
                        <CardBody>
                          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
                            <FlexItem flex={{ default: "flex_1" }}>
                              <Title headingLevel="h4" size="md">
                                <UserIcon style={{ marginRight: "0.5rem" }} />
                                {teacher.first_name} {teacher.last_name}
                                {!teacher.active && (
                                  <Label color="grey" style={{ marginLeft: "0.5rem" }}>
                                    {t("teachers.manage.inactive", "Inactif")}
                                  </Label>
                                )}
                              </Title>

                              <div
                                style={{
                                  marginTop: "0.5rem",
                                  color: "#6a6e73",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <div>
                                  <strong>{t("teachers.manage.email", "Email")}:</strong>{" "}
                                  {teacher.email}
                                </div>
                                {teacher.specialization && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>
                                      {t("teachers.manage.specialization", "Spécialisation")}:
                                    </strong>{" "}
                                    {teacher.specialization}
                                  </div>
                                )}
                                {teacher.certifications && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>
                                      {t("teachers.manage.certifications", "Certifications")}:
                                    </strong>{" "}
                                    {teacher.certifications}
                                  </div>
                                )}
                                {teacher.hire_date && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>
                                      {t("teachers.manage.hireDate", "Date d'embauche")}:
                                    </strong>{" "}
                                    {new Date(teacher.hire_date).toLocaleDateString("fr-FR")}
                                  </div>
                                )}
                              </div>

                              {teacher.bio && (
                                <div
                                  style={{
                                    marginTop: "0.75rem",
                                    padding: "0.75rem",
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: "4px",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  <strong>{t("teachers.manage.bio", "Bio")}:</strong>
                                  <div style={{ marginTop: "0.25rem" }}>{teacher.bio}</div>
                                </div>
                              )}
                            </FlexItem>

                            <FlexItem>
                              <ActionList>
                                <ActionListItem>
                                  <Button
                                    variant="link"
                                    icon={<EditIcon />}
                                    onClick={() => handleEditClick(teacher)}
                                  >
                                    {t("common.actions.edit", "Modifier")}
                                  </Button>
                                </ActionListItem>
                                <ActionListItem>
                                  <Button
                                    variant="link"
                                    isDanger
                                    icon={<TrashIcon />}
                                    onClick={() => handleDeleteClick(teacher)}
                                  >
                                    {t("common.actions.delete", "Supprimer")}
                                  </Button>
                                </ActionListItem>
                              </ActionList>
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Tab>

          {/* Tab: Ajouter un professeur */}
          <Tab
            eventKey={TEACHER_TABS.ADD}
            title={
              <TabTitleText>
                <span>
                  <PlusCircleIcon style={{ marginRight: "0.5rem" }} />
                  {t("teachers.manage.tabs.add", "Ajouter un professeur")}
                </span>
              </TabTitleText>
            }
          >
            <Card>
              <CardBody>
                <Alert
                  variant="info"
                  title={t("teachers.manage.info.addTitle", "Information")}
                  isInline
                >
                  {t(
                    "teachers.manage.info.addDescription",
                    "Pour ajouter un professeur, vous devez d'abord créer un compte utilisateur, puis promouvoir cet utilisateur au rôle d'instructeur depuis la page de gestion des utilisateurs.",
                  )}
                </Alert>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        {/* Edit Modal */}
        <Modal
          variant={ModalVariant.medium}
          title={t("teachers.manage.editModal.title", "Modifier le professeur")}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          actions={[
            <Button
              key="confirm"
              variant="primary"
              onClick={handleUpdateSubmit}
              isLoading={updating}
              isDisabled={updating}
            >
              {t("common.actions.save", "Enregistrer")}
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => setShowEditModal(false)}
              isDisabled={updating}
            >
              {t("common.actions.cancel", "Annuler")}
            </Button>,
          ]}
        >
          {selectedTeacher && (
            <Form>
              <FormGroup label={t("teachers.manage.form.name", "Nom")} fieldId="teacher-name">
                <TextInput
                  id="teacher-name"
                  value={`${selectedTeacher.first_name} ${selectedTeacher.last_name}`}
                  isDisabled
                />
              </FormGroup>

              <FormGroup label={t("teachers.manage.form.email", "Email")} fieldId="teacher-email">
                <TextInput id="teacher-email" value={selectedTeacher.email} isDisabled />
              </FormGroup>

              <FormGroup
                label={t("teachers.manage.form.specialization", "Spécialisation")}
                fieldId="teacher-specialization"
              >
                <TextInput
                  id="teacher-specialization"
                  value={formData.specialization}
                  onChange={(_e, value) =>
                    setFormData((prev) => ({ ...prev, specialization: value }))
                  }
                  placeholder={t(
                    "teachers.manage.form.specializationPlaceholder",
                    "Ex: Yoga, Pilates, Musculation...",
                  )}
                />
              </FormGroup>

              <FormGroup
                label={t("teachers.manage.form.certifications", "Certifications")}
                fieldId="teacher-certifications"
              >
                <TextInput
                  id="teacher-certifications"
                  value={formData.certifications}
                  onChange={(_e, value) =>
                    setFormData((prev) => ({ ...prev, certifications: value }))
                  }
                  placeholder={t(
                    "teachers.manage.form.certificationsPlaceholder",
                    "Ex: Certifié BPJEPS, Diplôme d'état...",
                  )}
                />
              </FormGroup>

              <FormGroup label={t("teachers.manage.form.bio", "Biographie")} fieldId="teacher-bio">
                <TextArea
                  id="teacher-bio"
                  value={formData.bio}
                  onChange={(_e, value) => setFormData((prev) => ({ ...prev, bio: value }))}
                  placeholder={t(
                    "teachers.manage.form.bioPlaceholder",
                    "Décrivez l'expérience et les compétences du professeur...",
                  )}
                  rows={4}
                />
              </FormGroup>
            </Form>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          variant={ModalVariant.small}
          title={t("teachers.manage.deleteModal.title", "Confirmer la suppression")}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          actions={[
            <Button
              key="confirm"
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={deleting}
              isDisabled={deleting}
            >
              {t("common.actions.delete", "Supprimer")}
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => setShowDeleteModal(false)}
              isDisabled={deleting}
            >
              {t("common.actions.cancel", "Annuler")}
            </Button>,
          ]}
        >
          {selectedTeacher && (
            <p>
              {t(
                "teachers.manage.deleteModal.confirm",
                "Êtes-vous sûr de vouloir supprimer le professeur {{name}} ? Cette action est irréversible.",
                { name: `${selectedTeacher.first_name} ${selectedTeacher.last_name}` },
              )}
            </p>
          )}
        </Modal>
      </PageSection>
    </div>
  );
};

// ============================================================================
// Exports with HOCs
// ============================================================================

export default withErrorBoundary(
  withTracking(
    withAuthRole(
      withAuth(TeachersManagePage, {
        requireAuth: true,
        redirectTo: "/login",
      }),
      ["admin"],
    ),
    "teachers_manage",
  ),
);
