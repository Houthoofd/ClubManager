import React, { useState, useEffect } from "react";
import {
  PageSection,
  Card,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  Grid,
  GridItem,
  Select,
  SelectOption,
  SelectVariant,
  Modal,
  ModalVariant,
  List,
  ListItem,
  DatePicker,
} from "@patternfly/react-core";
import { UserPlusIcon } from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";
import { withAuthRole } from "@/core/hocs/withAuthRole";
import { useLoadingWrapper } from "@/core/hocs/withLoading";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useNavigate } from "react-router-dom";
import { apolloClient } from "@/core/api/apollo/apollo-client";
import {
  useAjouterUtilisateur,
  useAbonnements,
  useGrades,
  useStatus,
  useGenres,
} from "@/features/users/hooks";
import { useCheckEmail } from "@/features/auth/hooks/useCheckEmail";

interface FormData {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  date_naissance: string;
  genres: string;
  grades: string;
  abonnement: string;
  statut: string;
}

interface FormErrors {
  prenom?: string;
  nom?: string;
  email?: string;
  date_naissance?: string;
  [key: string]: string | undefined;
}

const AddUserPage: React.FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent, trackError } = useTracking();
  const { wrapAsync, isLoading: submitting } = useLoadingWrapper();

  const checkEmail = useCheckEmail();
  const { user: currentUser } = useAuthStore();
  const { addNotification } = useUiStore();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    prenom: "",
    nom: "",
    nom_utilisateur: "",
    email: "",
    date_naissance: "",
    genres: "",
    grades: "",
    abonnement: "",
    statut: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [existingUserModalOpen, setExistingUserModalOpen] = useState(false);

  // Select states
  const [genreSelectOpen, setGenreSelectOpen] = useState(false);
  const [gradeSelectOpen, setGradeSelectOpen] = useState(false);
  const [abonnementSelectOpen, setAbonnementSelectOpen] = useState(false);
  const [statutSelectOpen, setStatutSelectOpen] = useState(false);

  // Data hooks
  const ajouterUtilisateur = useAjouterUtilisateur();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: statuts = [] } = useStatus();
  const { data: genres = [] } = useGenres();

  // Track page view
  useEffect(() => {
    trackEvent({
      category: "Users",
      action: "View Add User Page",
      label: `Admin: ${currentUser?.id}`,
    });
  }, [trackEvent, currentUser]);

  // Validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.prenom.trim()) {
      newErrors.prenom = t("users.create.errors.firstNameRequired");
    }

    if (!formData.nom.trim()) {
      newErrors.nom = t("users.create.errors.lastNameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("users.create.errors.emailRequired");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("users.create.errors.emailInvalid");
    }

    if (!formData.date_naissance) {
      newErrors.date_naissance = t("users.create.errors.birthDateRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleEmailChange = async (value: string) => {
    handleChange("email", value);

    if (value && validateEmail(value)) {
      try {
        const exists = await checkEmail.mutateAsync(value);
        setEmailExists(exists);
      } catch (error) {
        console.error("Error checking email:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      trackEvent({
        category: "Users",
        action: "Add User Validation Failed",
        label: "Form has errors",
      });
      return;
    }

    // Check email before showing confirm modal
    if (formData.email) {
      try {
        const exists = await checkEmail.mutateAsync(formData.email);
        if (exists) {
          setExistingUserModalOpen(true);
          trackEvent({
            category: "Users",
            action: "Add User Email Exists",
            label: formData.email,
          });
          return;
        }
      } catch (error) {
        trackError(error as Error, {
          context: "AddUserPage - Email Check",
          email: formData.email,
        });
      }
    }

    setShowConfirmModal(true);
  };

  const confirmAddUser = async () => {
    setShowConfirmModal(false);

    trackEvent({
      category: "Users",
      action: "Confirm Add User",
      label: `${formData.prenom} ${formData.nom}`,
    });

    await wrapAsync(async () => {
      try {
        const userData = {
          first_name: formData.prenom,
          last_name: formData.nom,
          nom_utilisateur: formData.nom_utilisateur || `${formData.prenom}.${formData.nom}`,
          email: formData.email,
          date_of_birth: formData.date_naissance,
          genres: formData.genres,
          grades: formData.grades,
          abonnement: formData.abonnement,
          status: formData.statut,
        };

        await ajouterUtilisateur.mutateAsync(userData as any);

        // Refetch Apollo queries to update cache
        apolloClient.refetchQueries({
          include: ["GetUtilisateurs", "GetUsers"],
        });

        // Success notification
        addNotification({
          type: "success",
          message: t("users.create.success", {
            name: `${formData.prenom} ${formData.nom}`,
          }),
        });

        trackEvent({
          category: "Users",
          action: "Add User Success",
          label: `${formData.prenom} ${formData.nom}`,
        });

        // Reset form
        setFormData({
          prenom: "",
          nom: "",
          nom_utilisateur: "",
          email: "",
          date_naissance: "",
          genres: "",
          grades: "",
          abonnement: "",
          statut: "",
        });

        // Navigate to users list or show success message
        setTimeout(() => {
          navigate("/pages/utilisateurs");
        }, 2000);
      } catch (error: any) {
        addNotification({
          type: "error",
          message: error?.message || t("users.create.error"),
        });

        trackError(error, {
          context: "AddUserPage - Create User",
          userData: formData,
        });
      }
    });
  };

  const cancelAddUser = () => {
    setShowConfirmModal(false);
    trackEvent({
      category: "Users",
      action: "Cancel Add User",
      label: "User cancelled confirmation",
    });
  };

  const closeExistingUserModal = () => {
    setExistingUserModalOpen(false);
  };

  const handleCancel = () => {
    trackEvent({
      category: "Users",
      action: "Cancel Add User Form",
      label: "User clicked cancel",
    });
    navigate("/pages/utilisateurs");
  };

  return (
    <>
      <PageHeader
        title={t("users.create.title")}
        subtitle={t("users.create.subtitle")}
        icon={<UserPlusIcon />}
      />

      <PageSection>
        <Card>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <Grid hasGutter>
                {/* First Name */}
                <GridItem span={6}>
                  <FormGroup
                    label={t("users.create.fields.firstName")}
                    isRequired
                    fieldId="prenom"
                    validated={errors.prenom ? "error" : "default"}
                    helperTextInvalid={errors.prenom}
                  >
                    <TextInput
                      id="prenom"
                      type="text"
                      value={formData.prenom}
                      onChange={(_event, value) => handleChange("prenom", value)}
                      validated={errors.prenom ? "error" : "default"}
                      isRequired
                    />
                  </FormGroup>
                </GridItem>

                {/* Last Name */}
                <GridItem span={6}>
                  <FormGroup
                    label={t("users.create.fields.lastName")}
                    isRequired
                    fieldId="nom"
                    validated={errors.nom ? "error" : "default"}
                    helperTextInvalid={errors.nom}
                  >
                    <TextInput
                      id="nom"
                      type="text"
                      value={formData.nom}
                      onChange={(_event, value) => handleChange("nom", value)}
                      validated={errors.nom ? "error" : "default"}
                      isRequired
                    />
                  </FormGroup>
                </GridItem>

                {/* Username */}
                <GridItem span={6}>
                  <FormGroup
                    label={t("users.create.fields.username")}
                    fieldId="nom_utilisateur"
                    helperText={t("users.create.fields.usernameHelper")}
                  >
                    <TextInput
                      id="nom_utilisateur"
                      type="text"
                      value={formData.nom_utilisateur}
                      onChange={(_event, value) => handleChange("nom_utilisateur", value)}
                      placeholder={`${formData.prenom}.${formData.nom}`}
                    />
                  </FormGroup>
                </GridItem>

                {/* Email */}
                <GridItem span={6}>
                  <FormGroup
                    label={t("users.create.fields.email")}
                    isRequired
                    fieldId="email"
                    validated={errors.email || emailExists ? "error" : "default"}
                    helperTextInvalid={
                      errors.email || (emailExists ? t("users.create.errors.emailExists") : "")
                    }
                  >
                    <TextInput
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(_event, value) => handleEmailChange(value)}
                      validated={errors.email || emailExists ? "error" : "default"}
                      isRequired
                    />
                  </FormGroup>
                </GridItem>

                {/* Birth Date */}
                <GridItem span={6}>
                  <FormGroup
                    label={t("users.create.fields.birthDate")}
                    isRequired
                    fieldId="date_naissance"
                    validated={errors.date_naissance ? "error" : "default"}
                    helperTextInvalid={errors.date_naissance}
                  >
                    <TextInput
                      id="date_naissance"
                      type="date"
                      value={formData.date_naissance}
                      onChange={(_event, value) => handleChange("date_naissance", value)}
                      validated={errors.date_naissance ? "error" : "default"}
                      isRequired
                    />
                  </FormGroup>
                </GridItem>

                {/* Gender */}
                <GridItem span={6}>
                  <FormGroup label={t("users.create.fields.gender")} fieldId="genres">
                    <Select
                      variant={SelectVariant.single}
                      onToggle={(_event, isOpen) => setGenreSelectOpen(isOpen)}
                      onSelect={(_event, selection) => {
                        handleChange("genres", String(selection));
                        setGenreSelectOpen(false);
                      }}
                      selections={formData.genres}
                      isOpen={genreSelectOpen}
                      placeholderText={t("users.create.fields.genderPlaceholder")}
                    >
                      {genres.map((genre: any) => (
                        <SelectOption key={genre.id} value={genre.id}>
                          {genre.label || genre.nom}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                </GridItem>

                {/* Grade */}
                <GridItem span={6}>
                  <FormGroup label={t("users.create.fields.grade")} fieldId="grades">
                    <Select
                      variant={SelectVariant.single}
                      onToggle={(_event, isOpen) => setGradeSelectOpen(isOpen)}
                      onSelect={(_event, selection) => {
                        handleChange("grades", String(selection));
                        setGradeSelectOpen(false);
                      }}
                      selections={formData.grades}
                      isOpen={gradeSelectOpen}
                      placeholderText={t("users.create.fields.gradePlaceholder")}
                    >
                      {grades.map((grade: any) => (
                        <SelectOption key={grade.id} value={grade.id}>
                          {grade.label || grade.nom}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                </GridItem>

                {/* Subscription */}
                <GridItem span={6}>
                  <FormGroup label={t("users.create.fields.subscription")} fieldId="abonnement">
                    <Select
                      variant={SelectVariant.single}
                      onToggle={(_event, isOpen) => setAbonnementSelectOpen(isOpen)}
                      onSelect={(_event, selection) => {
                        handleChange("abonnement", String(selection));
                        setAbonnementSelectOpen(false);
                      }}
                      selections={formData.abonnement}
                      isOpen={abonnementSelectOpen}
                      placeholderText={t("users.create.fields.subscriptionPlaceholder")}
                    >
                      {abonnements.map((abonnement: any) => (
                        <SelectOption key={abonnement.id} value={abonnement.id}>
                          {abonnement.label || abonnement.nom}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                </GridItem>

                {/* Status */}
                <GridItem span={6}>
                  <FormGroup label={t("users.create.fields.status")} fieldId="statut">
                    <Select
                      variant={SelectVariant.single}
                      onToggle={(_event, isOpen) => setStatutSelectOpen(isOpen)}
                      onSelect={(_event, selection) => {
                        handleChange("statut", String(selection));
                        setStatutSelectOpen(false);
                      }}
                      selections={formData.statut}
                      isOpen={statutSelectOpen}
                      placeholderText={t("users.create.fields.statusPlaceholder")}
                    >
                      {statuts.map((statut: any) => (
                        <SelectOption key={statut.id} value={statut.id}>
                          {statut.label || statut.nom}
                        </SelectOption>
                      ))}
                    </Select>
                  </FormGroup>
                </GridItem>

                {/* Actions */}
                <GridItem span={12}>
                  <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={submitting}
                      isDisabled={submitting}
                    >
                      {submitting ? t("users.create.creating") : t("users.create.submit")}
                    </Button>
                    <Button variant="secondary" onClick={handleCancel} isDisabled={submitting}>
                      {t("common.actions.cancel")}
                    </Button>
                  </div>
                </GridItem>
              </Grid>
            </Form>
          </CardBody>
        </Card>
      </PageSection>

      {/* Confirmation Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("users.create.confirmTitle")}
        isOpen={showConfirmModal}
        onClose={cancelAddUser}
        actions={[
          <Button key="confirm" variant="primary" onClick={confirmAddUser}>
            {t("common.actions.confirm")}
          </Button>,
          <Button key="cancel" variant="link" onClick={cancelAddUser}>
            {t("common.actions.cancel")}
          </Button>,
        ]}
      >
        <p>{t("users.create.confirmMessage")}</p>
        <List>
          <ListItem>
            <strong>{t("common.labels.name")}:</strong> {formData.prenom} {formData.nom}
          </ListItem>
          <ListItem>
            <strong>{t("common.labels.email")}:</strong> {formData.email}
          </ListItem>
          <ListItem>
            <strong>{t("users.create.fields.birthDate")}:</strong> {formData.date_naissance}
          </ListItem>
        </List>
      </Modal>

      {/* Existing User Modal */}
      <Modal
        variant={ModalVariant.small}
        title={t("users.create.existingUser.title")}
        isOpen={existingUserModalOpen}
        onClose={closeExistingUserModal}
        actions={[
          <Button key="ok" variant="primary" onClick={closeExistingUserModal}>
            {t("common.actions.close")}
          </Button>,
        ]}
      >
        <Alert variant="warning" title={t("users.create.existingUser.message")} isInline>
          {t("users.create.existingUser.description", { email: formData.email })}
        </Alert>
      </Modal>
    </>
  );
};

// Export with HOCs - Admin/Teacher only
export default withAuthRole(
  withErrorBoundary(
    withTracking(AddUserPage, {
      componentName: "AddUserPage",
    }),
    {
      componentName: "AddUserPage",
    },
  ),
  ["admin", "super-administrateur", "professeur"],
);
