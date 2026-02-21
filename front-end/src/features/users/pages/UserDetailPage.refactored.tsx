import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PageSection,
  Card,
  CardBody,
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  Grid,
  GridItem,
  Spinner,
  Modal,
  ModalVariant,
  List,
  ListItem,
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";
import {
  UserIcon,
  ChartLineIcon,
  CreditCardIcon,
  EditIcon,
  CheckIcon,
  TimesIcon,
} from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";
import { withAuth } from "@/core/hocs/withAuth";
import { useLoadingWrapper } from "@/core/hocs/withLoading";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { formatDate, formatCurrency } from "@/core/i18n/helpers";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUtilisateurById,
  useUpdateUtilisateur,
  useAbonnements,
  useGrades,
  useStatus,
  useGenres,
  usePaiementsEcheances,
  useStatFrequentation,
} from "@/features/users/hooks";
import { useCheckEmail } from "@/features/auth/hooks/useCheckEmail";

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

interface EditingFields {
  [key: string]: boolean;
}

interface FormData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  date_naissance: string;
  abonnement: string;
  genres: string;
  grades: string;
  nom_utilisateur: string;
  status: string;
}

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const UserDetailPage: React.FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent, trackError } = useTracking();
  const { wrapAsync } = useLoadingWrapper();
  const queryClient = useQueryClient();
  const checkEmail = useCheckEmail();

  // Zustand stores
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useUiStore();

  // Get user ID from location state or URL
  const userId = (location.state as any)?.userId || new URLSearchParams(location.search).get("id");

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<string>("0");
  const [editingFields, setEditingFields] = useState<EditingFields>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalSuccess, setResultModalSuccess] = useState(false);
  const [modificationsResume, setModificationsResume] = useState<ModificationItem[]>([]);
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");

  // Select states
  const [genreSelectOpen, setGenreSelectOpen] = useState(false);
  const [gradeSelectOpen, setGradeSelectOpen] = useState(false);
  const [abonnementSelectOpen, setAbonnementSelectOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);

  const [form, setForm] = useState<FormData>({
    id: "",
    prenom: "",
    nom: "",
    email: "",
    date_naissance: "",
    abonnement: "",
    genres: "",
    grades: "",
    nom_utilisateur: "",
    status: "",
  });

  // Data hooks - GraphQL queries
  const { data: userData, isLoading: loadingUser, error: userError } = useUtilisateurById(userId);
  const { data: statFrequentation = [], isLoading: loadingStats } = useStatFrequentation(userId);
  const { data: abonnements = [] } = useAbonnements();
  const { data: gradesList = [] } = useGrades();
  const { data: statusList = [] } = useStatus();
  const { data: paiementsEcheances = [] } = usePaiementsEcheances(userId);
  const { data: genresList = [] } = useGenres();

  // GraphQL mutation
  const updateUtilisateur = useUpdateUtilisateur();

  // Track page view
  useEffect(() => {
    if (userId) {
      trackEvent({
        category: "Users",
        action: "View User Detail",
        label: `User ID: ${userId}`,
      });
    }
  }, [trackEvent, userId]);

  // Check if current user can edit status
  const canEditStatus = useMemo(() => {
    return currentUser?.status === "super-administrateur";
  }, [currentUser]);

  // Initialize form when user data loads
  useEffect(() => {
    if (userData?.utilisateur) {
      const utilisateur = userData.utilisateur;
      setForm({
        id: utilisateur.id || userId,
        prenom: utilisateur.prenom || "",
        nom: utilisateur.nom || "",
        email: utilisateur.email || "",
        date_naissance: formatDateForInput(utilisateur.date_naissance || ""),
        abonnement: utilisateur.abonnement?.id || utilisateur.abonnement_id || "",
        genres: utilisateur.genres?.id || utilisateur.genre_id || "",
        grades: utilisateur.grades?.id || utilisateur.grade_id || "",
        nom_utilisateur: utilisateur.nom_utilisateur || "",
        status: utilisateur.status?.id || utilisateur.status_id || "",
      });
    }
  }, [userData, userId]);

  // Stats data ready
  const statsDataReady = !loadingStats && statFrequentation.length > 0;

  const statFrequentationForGraph = useMemo(() => {
    if (!statsDataReady) return [];
    return {
      mois: statFrequentation.map((stat: any) => ({
        mois: stat.mois,
        frequentation: stat.frequentation || 0,
        pourcentage_de_cours_valides: stat.pourcentage_de_cours_valides || 0,
        nombres_total_de_cours_du_mois: stat.nombres_total_de_cours_du_mois || 0,
      })),
    };
  }, [statFrequentation, statsDataReady]);

  // Handlers
  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(String(tabIndex));
    trackEvent({
      category: "Users",
      action: "Switch Tab",
      label: `Tab: ${tabIndex}`,
    });
  };

  const handleEditClick = (field: string) => {
    setEditingFields({ ...editingFields, [field]: !editingFields[field] });
    trackEvent({
      category: "Users",
      action: editingFields[field] ? "Cancel Edit" : "Start Edit",
      label: `Field: ${field}`,
    });
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleEmailChange = async (value: string) => {
    setForm({ ...form, email: value });
  };

  const getChangesSummary = (): ModificationItem[] => {
    const changes: ModificationItem[] = [];
    const originalData = userData?.utilisateur;

    if (!originalData) return changes;

    // Compare each field
    Object.keys(form).forEach((key) => {
      const formKey = key as keyof FormData;
      const formValue = form[formKey];
      let originalValue = "";

      // Get original value based on field
      switch (formKey) {
        case "prenom":
        case "nom":
        case "email":
        case "nom_utilisateur":
          originalValue = originalData[formKey] || "";
          break;
        case "date_naissance":
          originalValue = formatDateForInput(originalData.date_naissance || "");
          break;
        case "genres":
          originalValue = originalData.genres?.id || originalData.genre_id || "";
          break;
        case "grades":
          originalValue = originalData.grades?.id || originalData.grade_id || "";
          break;
        case "abonnement":
          originalValue = originalData.abonnement?.id || originalData.abonnement_id || "";
          break;
        case "status":
          originalValue = originalData.status?.id || originalData.status_id || "";
          break;
        default:
          originalValue = "";
      }

      if (String(formValue) !== String(originalValue) && formValue !== "") {
        // Get display names for select fields
        let oldDisplay = originalValue;
        let newDisplay = formValue;

        if (formKey === "genres") {
          const oldGenre = genresList.find((g: any) => String(g.id) === String(originalValue));
          const newGenre = genresList.find((g: any) => String(g.id) === String(formValue));
          oldDisplay = oldGenre?.nom || oldGenre?.label || originalValue;
          newDisplay = newGenre?.nom || newGenre?.label || formValue;
        } else if (formKey === "grades") {
          const oldGrade = gradesList.find((g: any) => String(g.id) === String(originalValue));
          const newGrade = gradesList.find((g: any) => String(g.id) === String(formValue));
          oldDisplay = oldGrade?.nom || oldGrade?.label || originalValue;
          newDisplay = newGrade?.nom || newGrade?.label || formValue;
        } else if (formKey === "abonnement") {
          const oldAbo = abonnements.find((a: any) => String(a.id) === String(originalValue));
          const newAbo = abonnements.find((a: any) => String(a.id) === String(formValue));
          oldDisplay = oldAbo?.nom || oldAbo?.label || originalValue;
          newDisplay = newAbo?.nom || newAbo?.label || formValue;
        } else if (formKey === "status") {
          const oldStatus = statusList.find((s: any) => String(s.id) === String(originalValue));
          const newStatus = statusList.find((s: any) => String(s.id) === String(formValue));
          oldDisplay = oldStatus?.nom || oldStatus?.label || originalValue;
          newDisplay = newStatus?.nom || newStatus?.label || formValue;
        }

        changes.push({
          field: formKey,
          oldValue: oldDisplay,
          newValue: newDisplay,
        });
      }
    });

    return changes;
  };

  const handleApplyChanges = async () => {
    const changes = getChangesSummary();

    if (changes.length === 0) {
      addNotification({
        type: "info",
        message: t("users.details.noChanges"),
      });
      return;
    }

    trackEvent({
      category: "Users",
      action: "Apply Changes",
      label: `Changes count: ${changes.length}`,
    });

    setModificationsResume(changes);
    setShowConfirmModal(true);
  };

  const confirmerModifications = async () => {
    setShowConfirmModal(false);

    await wrapAsync(async () => {
      try {
        const changes = getChangesSummary();
        const changesToSend: any = {
          id: userId,
        };

        // Map changes to API format
        changes.forEach((change) => {
          changesToSend[change.field] = form[change.field as keyof FormData];
        });

        await updateUtilisateur.mutateAsync(changesToSend);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["utilisateur", userId] });
        queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });

        setResultModalMessage(t("users.details.updateSuccess"));
        setResultModalSuccess(true);
        setIsResultModalOpen(true);
        setEditingFields({});

        addNotification({
          type: "success",
          message: t("users.details.updateSuccess"),
        });

        trackEvent({
          category: "Users",
          action: "Update Success",
          label: `User ID: ${userId}`,
        });
      } catch (error: any) {
        setResultModalMessage(error?.message || t("users.details.updateError"));
        setResultModalSuccess(false);
        setIsResultModalOpen(true);

        addNotification({
          type: "error",
          message: error?.message || t("users.details.updateError"),
        });

        trackError(error, {
          context: "UserDetailPage - Update Failed",
          userId,
        });
      }
    });
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    trackEvent({
      category: "Users",
      action: "Cancel Changes",
      label: "User cancelled modification confirmation",
    });
  };

  const userName = userData?.utilisateur
    ? `${userData.utilisateur.prenom} ${userData.utilisateur.nom}`
    : t("users.details.loading");

  // Loading state
  if (loadingUser) {
    return (
      <PageSection>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Spinner size="xl" />
          <p style={{ marginTop: "1rem" }}>{t("common.loading")}</p>
        </div>
      </PageSection>
    );
  }

  // Error state
  if (userError) {
    return (
      <PageSection>
        <Alert variant="danger" title={t("common.error")}>
          {(userError as any)?.message || t("users.details.loadError")}
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageHeader
        title={t("users.details.title", { name: userName })}
        subtitle={t("users.details.subtitle")}
      />

      <PageSection>
        <Card>
          <CardBody>
            <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
              {/* Personal Info Tab */}
              <Tab
                eventKey={0}
                title={
                  <TabTitleText icon={<UserIcon />}>
                    {t("users.details.tabs.personalInfo")}
                  </TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <Form>
                    <Grid hasGutter>
                      {/* First Name */}
                      <GridItem span={6}>
                        <FormGroup label={t("users.details.fields.firstName")} fieldId="prenom">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <TextInput
                              id="prenom"
                              type="text"
                              value={form.prenom}
                              onChange={(_event, value) => handleFormChange("prenom", value)}
                              isDisabled={!editingFields.prenom}
                            />
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("prenom")}
                              icon={editingFields.prenom ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Last Name */}
                      <GridItem span={6}>
                        <FormGroup label={t("users.details.fields.lastName")} fieldId="nom">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <TextInput
                              id="nom"
                              type="text"
                              value={form.nom}
                              onChange={(_event, value) => handleFormChange("nom", value)}
                              isDisabled={!editingFields.nom}
                            />
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("nom")}
                              icon={editingFields.nom ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Email */}
                      <GridItem span={6}>
                        <FormGroup label={t("common.labels.email")} fieldId="email">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <TextInput
                              id="email"
                              type="email"
                              value={form.email}
                              onChange={(_event, value) => handleEmailChange(value)}
                              isDisabled={!editingFields.email}
                            />
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("email")}
                              icon={editingFields.email ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Birth Date */}
                      <GridItem span={6}>
                        <FormGroup
                          label={t("users.details.fields.birthDate")}
                          fieldId="date_naissance"
                        >
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <TextInput
                              id="date_naissance"
                              type="date"
                              value={form.date_naissance}
                              onChange={(_event, value) =>
                                handleFormChange("date_naissance", value)
                              }
                              isDisabled={!editingFields.date_naissance}
                            />
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("date_naissance")}
                              icon={editingFields.date_naissance ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Gender */}
                      <GridItem span={6}>
                        <FormGroup label={t("users.details.fields.gender")} fieldId="genres">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Select
                              variant={SelectVariant.single}
                              onToggle={(_event, isOpen) => setGenreSelectOpen(isOpen)}
                              onSelect={(_event, selection) => {
                                handleFormChange("genres", String(selection));
                                setGenreSelectOpen(false);
                              }}
                              selections={form.genres}
                              isOpen={genreSelectOpen}
                              isDisabled={!editingFields.genres}
                            >
                              {genresList.map((genre: any) => (
                                <SelectOption key={genre.id} value={genre.id}>
                                  {genre.label || genre.nom}
                                </SelectOption>
                              ))}
                            </Select>
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("genres")}
                              icon={editingFields.genres ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Grade */}
                      <GridItem span={6}>
                        <FormGroup label={t("users.details.fields.grade")} fieldId="grades">
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Select
                              variant={SelectVariant.single}
                              onToggle={(_event, isOpen) => setGradeSelectOpen(isOpen)}
                              onSelect={(_event, selection) => {
                                handleFormChange("grades", String(selection));
                                setGradeSelectOpen(false);
                              }}
                              selections={form.grades}
                              isOpen={gradeSelectOpen}
                              isDisabled={!editingFields.grades}
                            >
                              {gradesList.map((grade: any) => (
                                <SelectOption key={grade.id} value={grade.id}>
                                  {grade.label || grade.nom}
                                </SelectOption>
                              ))}
                            </Select>
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("grades")}
                              icon={editingFields.grades ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Subscription */}
                      <GridItem span={6}>
                        <FormGroup
                          label={t("users.details.fields.subscription")}
                          fieldId="abonnement"
                        >
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Select
                              variant={SelectVariant.single}
                              onToggle={(_event, isOpen) => setAbonnementSelectOpen(isOpen)}
                              onSelect={(_event, selection) => {
                                handleFormChange("abonnement", String(selection));
                                setAbonnementSelectOpen(false);
                              }}
                              selections={form.abonnement}
                              isOpen={abonnementSelectOpen}
                              isDisabled={!editingFields.abonnement}
                            >
                              {abonnements.map((abonnement: any) => (
                                <SelectOption key={abonnement.id} value={abonnement.id}>
                                  {abonnement.label || abonnement.nom}
                                </SelectOption>
                              ))}
                            </Select>
                            <Button
                              variant="plain"
                              onClick={() => handleEditClick("abonnement")}
                              icon={editingFields.abonnement ? <CheckIcon /> : <EditIcon />}
                            />
                          </div>
                        </FormGroup>
                      </GridItem>

                      {/* Status - Only if admin */}
                      {canEditStatus && (
                        <GridItem span={6}>
                          <FormGroup label={t("users.details.fields.status")} fieldId="status">
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <Select
                                variant={SelectVariant.single}
                                onToggle={(_event, isOpen) => setStatusSelectOpen(isOpen)}
                                onSelect={(_event, selection) => {
                                  handleFormChange("status", String(selection));
                                  setStatusSelectOpen(false);
                                }}
                                selections={form.status}
                                isOpen={statusSelectOpen}
                                isDisabled={!editingFields.status}
                              >
                                {statusList.map((status: any) => (
                                  <SelectOption key={status.id} value={status.id}>
                                    {status.label || status.nom}
                                  </SelectOption>
                                ))}
                              </Select>
                              <Button
                                variant="plain"
                                onClick={() => handleEditClick("status")}
                                icon={editingFields.status ? <CheckIcon /> : <EditIcon />}
                              />
                            </div>
                          </FormGroup>
                        </GridItem>
                      )}

                      {/* Actions */}
                      <GridItem span={12}>
                        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                          <Button variant="primary" onClick={handleApplyChanges}>
                            {t("common.actions.save")}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingFields({});
                              trackEvent({
                                category: "Users",
                                action: "Cancel All Edits",
                                label: "User cancelled all edits",
                              });
                            }}
                          >
                            {t("common.actions.cancel")}
                          </Button>
                        </div>
                      </GridItem>
                    </Grid>
                  </Form>
                </div>
              </Tab>

              {/* Statistics Tab */}
              <Tab
                eventKey={1}
                title={
                  <TabTitleText icon={<ChartLineIcon />}>
                    {t("users.details.tabs.statistics")}
                  </TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <h3>{t("users.details.statisticsTitle")}</h3>
                  {statsDataReady ? (
                    <p>{t("users.details.statisticsPlaceholder")}</p>
                  ) : (
                    <p>{t("users.details.noStatistics")}</p>
                  )}
                </div>
              </Tab>

              {/* Payments Tab */}
              <Tab
                eventKey={2}
                title={
                  <TabTitleText icon={<CreditCardIcon />}>
                    {t("users.details.tabs.payments")}
                  </TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <h3>{t("users.details.paymentsTitle")}</h3>
                  {paiementsEcheances && paiementsEcheances.length > 0 ? (
                    <List>
                      {paiementsEcheances.map((paiement: any, idx: number) => (
                        <ListItem key={idx}>
                          {formatDate(paiement.date)} - {formatCurrency(paiement.montant)}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <p>{t("users.details.noPayments")}</p>
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </PageSection>

      {/* Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("users.details.confirmChanges")}
        isOpen={showConfirmModal}
        onClose={annulerModifications}
        actions={[
          <Button key="confirm" variant="primary" onClick={confirmerModifications}>
            {t("common.actions.confirm")}
          </Button>,
          <Button key="cancel" variant="link" onClick={annulerModifications}>
            {t("common.actions.cancel")}
          </Button>,
        ]}
      >
        <p>{t("users.details.confirmMessage")}</p>
        <List>
          {modificationsResume.map((mod, idx) => (
            <ListItem key={idx}>
              <strong>{mod.field}:</strong> {mod.oldValue} → {mod.newValue}
            </ListItem>
          ))}
        </List>
      </Modal>

      {/* Result Modal */}
      <Modal
        variant={ModalVariant.small}
        title={resultModalSuccess ? t("common.success") : t("common.error")}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        actions={[
          <Button key="ok" variant="primary" onClick={() => setIsResultModalOpen(false)}>
            {t("common.actions.close")}
          </Button>,
        ]}
      >
        <Alert
          variant={resultModalSuccess ? "success" : "danger"}
          title={resultModalMessage}
          isInline
        />
      </Modal>
    </>
  );
};

// Export with HOCs - Auth required
export default withAuth(
  withErrorBoundary(
    withTracking(UserDetailPage, {
      componentName: "UserDetailPage",
    }),
    {
      componentName: "UserDetailPage",
    },
  ),
);
