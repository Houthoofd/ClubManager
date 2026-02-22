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
} from "@patternfly/react-core";
import { UserIcon, SearchIcon } from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import ResultModal from "@/shared/components/common-legacy/modal/ResultModal";
import { useInstructors } from "../hooks";
import { TEACHER_TABS, TEACHER_TAB_LABELS, ERROR_MESSAGES, INFO_MESSAGES } from "../constants";
import type { TeachersManagePageState, TeacherListItem } from "@clubmanager/types";

const TeachersManagePage: React.FC = () => {
  const [state, setState] = useState<TeachersManagePageState>({
    activeTabKey: TEACHER_TABS.LIST,
    selectedUsers: [],
    searchValue: "",
    showPromoteModal: false,
    promoteResult: null,
    verifMessage: null,
    verifChecked: false,
    showRemoveModal: false,
    teacherToRemove: null,
    showResultModal: false,
    resultModalMessage: "",
    resultModalSuccess: false,
  });

  // Fetch teachers
  const { instructors, isLoading, error } = useInstructors();

  // Transform instructors to teacher list items
  const teachers: TeacherListItem[] = useMemo(() => {
    return instructors.map((instructor: any) => ({
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
  }, [instructors]);

  // Filter teachers based on search
  const filteredTeachers = useMemo(() => {
    if (!state.searchValue.trim()) {
      return teachers;
    }

    const searchTerm = state.searchValue.toLowerCase().trim();
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
  }, [teachers, state.searchValue]);

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    if (typeof tabIndex === "number") {
      setState((prev) => ({
        ...prev,
        activeTabKey: tabIndex,
      }));
    }
  };

  const handleSearchChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      searchValue: value,
    }));
  };

  const handleClearSearch = () => {
    setState((prev) => ({
      ...prev,
      searchValue: "",
    }));
  };

  if (isLoading) {
    return (
      <div className="teachers-page">
        <PageHeader
          title="Gestion des professeurs"
          subtitle="Gérez les professeurs et leurs cours"
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
            <p style={{ marginLeft: "1rem" }}>Chargement des professeurs...</p>
          </div>
        </PageSection>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teachers-page">
        <PageHeader
          title="Gestion des professeurs"
          subtitle="Gérez les professeurs et leurs cours"
          variant="teachers"
        />
        <PageSection>
          <Alert variant="danger" title="Erreur de chargement" isInline>
            {ERROR_MESSAGES.LOAD_TEACHERS_FAILED}
          </Alert>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="teachers-page">
      <PageHeader
        title="Gestion des professeurs"
        subtitle="Gérez les professeurs et leurs cours"
        variant="teachers"
      />

      <PageSection className="teachers-content">
        <Tabs activeKey={state.activeTabKey} onSelect={handleTabClick} className="modern-tabs">
          {/* Tab: Liste des professeurs */}
          <Tab
            eventKey={TEACHER_TABS.LIST}
            title={
              <TabTitleText>
                <span>{TEACHER_TAB_LABELS.LIST}</span>
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
                        placeholder="Rechercher un professeur (nom, email, spécialisation)..."
                        value={state.searchValue}
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
                {state.searchValue && (
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6a6e73" }}>
                      {filteredTeachers.length} professeur
                      {filteredTeachers.length > 1 ? "s" : ""} trouvé
                      {filteredTeachers.length > 1 ? "s" : ""} sur {teachers.length}
                    </span>
                  </div>
                )}

                {/* Teachers list */}
                {filteredTeachers.length === 0 ? (
                  <EmptyState>
                    {state.searchValue ? (
                      <SearchIcon size="xl" style={{ marginBottom: "16px", fontSize: "48px" }} />
                    ) : (
                      <UserIcon size="xl" style={{ marginBottom: "16px", fontSize: "48px" }} />
                    )}
                    <Title headingLevel="h4" size="lg">
                      {state.searchValue
                        ? INFO_MESSAGES.NO_SEARCH_RESULTS
                        : INFO_MESSAGES.NO_TEACHERS}
                    </Title>
                    <EmptyStateBody>
                      {state.searchValue
                        ? "Essayez de modifier votre recherche"
                        : "Aucun professeur n'a encore été ajouté au système"}
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
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <Title headingLevel="h4" size="md">
                                <UserIcon style={{ marginRight: "0.5rem" }} />
                                {teacher.first_name} {teacher.last_name}
                                {!teacher.active && (
                                  <span
                                    style={{
                                      marginLeft: "0.5rem",
                                      fontSize: "0.875rem",
                                      color: "#6c757d",
                                    }}
                                  >
                                    (Inactif)
                                  </span>
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
                                  <strong>Email:</strong> {teacher.email}
                                </div>
                                {teacher.specialization && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>Spécialisation:</strong> {teacher.specialization}
                                  </div>
                                )}
                                {teacher.certifications && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>Certifications:</strong> {teacher.certifications}
                                  </div>
                                )}
                                {teacher.hire_date && (
                                  <div style={{ marginTop: "0.25rem" }}>
                                    <strong>Date d'embauche:</strong>{" "}
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
                                  <strong>Bio:</strong>
                                  <div style={{ marginTop: "0.25rem" }}>{teacher.bio}</div>
                                </div>
                              )}
                            </div>
                          </div>
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
                <span>{TEACHER_TAB_LABELS.ADD}</span>
              </TabTitleText>
            }
          >
            <Card>
              <CardBody>
                <Alert variant="info" title="Fonctionnalité en cours de développement" isInline>
                  Cette fonctionnalité nécessite l'implémentation des hooks de promotion et de
                  gestion des utilisateurs.
                </Alert>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        <ResultModal
          isOpen={state.showResultModal}
          onClose={() => setState((prev) => ({ ...prev, showResultModal: false }))}
          title={state.resultModalSuccess ? "Succès" : "Erreur"}
          message={state.resultModalMessage}
          isSuccess={state.resultModalSuccess}
        />
      </PageSection>
    </div>
  );
};

export default TeachersManagePage;
