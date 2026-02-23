import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@patternfly/react-core";
import {
  UserIcon,
  ChartLineIcon,
  CreditCardIcon,
  EditIcon,
  CheckIcon,
  TimesIcon,
} from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";
import { withAuth } from "@/core/hocs/withAuth";
import { useLoadingWrapper } from "@/core/hocs/withLoading";
import { useAuthStore } from "@/store/authStore";
import { useCompteData } from "@/features/auth/hooks/useCompteData";
import { useCheckEmail } from "@/features/auth/hooks/useCheckEmail";
import { formatDate, formatCurrency } from "@/core/i18n/helpers";
import { apolloClient } from "@/core/api/apollo/apollo-client";

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

interface EditingFields {
  [key: string]: boolean;
}

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AccountPage: React.FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent, trackError } = useTracking();
  const { wrapAsync } = useLoadingWrapper();
  const checkEmail = useCheckEmail();

  // Zustand auth store
  const { user: authUser } = useAuthStore();

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<string>("0");
  const [editingFields, setEditingFields] = useState<EditingFields>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalSuccess, setResultModalSuccess] = useState(false);
  const [modificationsResume, setModificationsResume] = useState<ModificationItem[]>([]);
  const [form, setForm] = useState({
    email: "",
    date_naissance: "",
    genres: "",
    grades: "",
    abonnement: "",
    status: "",
    password: "",
  });

  // Data hooks
  const {
    userData,
    utilisateurId,
    compteInfo,
    paiementsEcheances,
    updateCompte,
    abonnements,
    grades,
    status,
    genres,
    isDataReady,
    statsDataReady,
    statFrequentationForGraph,
    errorCompte,
  } = useCompteData();

  // Track page view
  useEffect(() => {
    trackEvent({
      category: "Account",
      action: "View Account Page",
      label: `User ID: ${utilisateurId || "unknown"}`,
    });
  }, [trackEvent, utilisateurId]);

  // Check if user can edit status
  const canEditStatus = useMemo(() => {
    return authUser?.status === "super-administrateur";
  }, [authUser]);

  // Extract value helper
  const extractValue = (field: string): string => {
    if (!compteInfo) return "";
    const compteInfoAny = compteInfo as any;
    let value =
      compteInfoAny[field] ||
      compteInfo.utilisateur?.[field as keyof typeof compteInfo.utilisateur];

    if (typeof value === "object" && value !== null) {
      if (Object.prototype.hasOwnProperty.call(value, "id")) value = value.id;
      else if (Object.prototype.hasOwnProperty.call(value, "name")) value = value.name;
      else if (Object.prototype.hasOwnProperty.call(value, "nom")) value = value.nom;
      else if (Object.prototype.hasOwnProperty.call(value, "email")) value = value.email;
      else value = String(value);
    }

    return String(value || "");
  };

  // Initialize form
  useEffect(() => {
    if (compteInfo) {
      const formData = {
        email: extractValue("email"),
        date_naissance:
          formatDateForInput(
            (compteInfo as any).date_naissance || compteInfo.utilisateur?.date_naissance || "",
          ) || "",
        genres: extractValue("genres") || extractValue("genre_id"),
        grades: extractValue("grades") || extractValue("grade_id"),
        abonnement: extractValue("abonnement") || extractValue("abonnement_id"),
        status: extractValue("status") || extractValue("status_id"),
        password: "",
      };
      setForm(formData);
    }
  }, [compteInfo]);

  // Handlers
  const handleEmailChange = (value: string) => {
    setForm({ ...form, email: value });
  };

  const handleFormChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleTabClick = (_event: React.MouseEvent, tabIndex: string | number) => {
    setActiveTabKey(String(tabIndex));
    trackEvent({
      category: "Account",
      action: "Switch Tab",
      label: `Tab: ${tabIndex}`,
    });
  };

  const handleEditClick = (field: string) => {
    setEditingFields({ ...editingFields, [field]: !editingFields[field] });
    trackEvent({
      category: "Account",
      action: editingFields[field] ? "Cancel Edit" : "Start Edit",
      label: `Field: ${field}`,
    });
  };

  const getChangesSummary = (): ModificationItem[] => {
    const changes: ModificationItem[] = [];
    // Implementation of changes detection
    return changes;
  };

  const handleApplyChanges = async () => {
    const changes = getChangesSummary();

    if (changes.length === 0) {
      setResultModalMessage(t("account.noChanges"));
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
      return;
    }

    trackEvent({
      category: "Account",
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
        const changesToSend = {
          id: utilisateurId,
          ...Object.fromEntries(changes.map((c) => [c.field, c.newValue])),
        };

        await updateCompte.mutateAsync(changesToSend as any);

        // Refetch Apollo queries to update cache
        apolloClient.refetchQueries({
          include: ["GetCompte", "GetUtilisateur"],
        });

        setResultModalMessage(t("account.updateSuccess"));
        setResultModalSuccess(true);
        setIsResultModalOpen(true);
        setEditingFields({});

        trackEvent({
          category: "Account",
          action: "Update Success",
          label: `User ID: ${utilisateurId}`,
        });
      } catch (error: any) {
        setResultModalMessage(error?.message || t("account.updateError"));
        setResultModalSuccess(false);
        setIsResultModalOpen(true);

        trackError(error, {
          context: "AccountPage - Update Failed",
          userId: utilisateurId,
        });
      }
    });
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    trackEvent({
      category: "Account",
      action: "Cancel Changes",
      label: "User cancelled modification confirmation",
    });
  };

  // Loading state
  if (!isDataReady) {
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
  if (errorCompte) {
    return (
      <PageSection>
        <Alert variant="danger" title={t("common.error")}>
          {errorCompte.message || t("account.loadError")}
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />

      <PageSection>
        <Card>
          <CardBody>
            <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
              {/* Personal Info Tab */}
              <Tab
                eventKey={0}
                title={
                  <TabTitleText icon={<UserIcon />}>{t("account.tabs.personalInfo")}</TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <Form>
                    <Grid hasGutter>
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

                      <GridItem span={6}>
                        <FormGroup label={t("account.fields.birthDate")} fieldId="date_naissance">
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
                                category: "Account",
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
                    {t("account.tabs.statistics")}
                  </TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <p>{t("account.statisticsPlaceholder")}</p>
                </div>
              </Tab>

              {/* Payments Tab */}
              <Tab
                eventKey={2}
                title={
                  <TabTitleText icon={<CreditCardIcon />}>
                    {t("account.tabs.payments")}
                  </TabTitleText>
                }
              >
                <div style={{ padding: "2rem" }}>
                  <h3>{t("account.paymentsTitle")}</h3>
                  {paiementsEcheances && paiementsEcheances.length > 0 ? (
                    <List>
                      {paiementsEcheances.map((paiement: any, idx: number) => (
                        <ListItem key={idx}>
                          {formatDate(paiement.date)} - {formatCurrency(paiement.montant)}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <p>{t("account.noPayments")}</p>
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
        title={t("account.confirmChanges")}
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
        <p>{t("account.confirmMessage")}</p>
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

// Export with HOCs
export default withAuth(
  withErrorBoundary(
    withTracking(AccountPage, {
      componentName: "AccountPage",
    }),
    {
      componentName: "AccountPage",
    },
  ),
);
