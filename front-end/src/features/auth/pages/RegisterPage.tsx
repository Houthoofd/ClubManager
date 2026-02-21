import React, { useState, useEffect } from "react";
import { Form, Button, Alert, PageSection, Bullseye, AlertVariant } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import {
  userInscriptionSchema,
  InscriptionFormData as FormData,
  InscriptionInformationModalData as InformationModalData,
  InscriptionValidationState as ValidationState,
} from "@clubmanager/types";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { FormStatusAlerts } from "@/features/courses/components/inscription/FormStatusAlerts";
import { InscriptionFormFields } from "@/features/courses/components/inscription/InscriptionFormFields";
import { RecapModal } from "@/features/courses/components/inscription/RecapModal";
import { SuccessModal } from "@/features/courses/components/inscription/SuccessModal";
import InformationModal from "@/shared/components/modals/InformationModal";
import {
  useAbonnementOptions,
  useGenreOptions,
  useVerifierUtilisateur,
  useInscrireUtilisateur,
} from "@/features/courses/hooks/useInscriptions";
import { useInscriptionValidation } from "@/features/courses/hooks/useInscriptionValidation";
import { clearAllAuthData } from "@/shared/utils/authCleaner";

export const InscriptionPage: React.FC = () => {
  // États du formulaire
  const [form, setForm] = useState<FormData>({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    date_naissance: "",
    abonnement: "",
    genre: "",
    nom_utilisateur: "",
  });

  // États de l'interface
  const [error, setError] = useState("");
  const [showRecap, setShowRecap] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);
  const [informationModalData, setInformationModalData] = useState<InformationModalData | null>(
    null,
  );

  // États de vérification backend
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [backendVerificationDone, setBackendVerificationDone] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // Hooks
  const { data: abonnementOptionsRaw = [] } = useAbonnementOptions();
  const { data: genreOptionsRaw = [] } = useGenreOptions();
  const verifierUtilisateur = useVerifierUtilisateur();
  const inscrireUtilisateur = useInscrireUtilisateur();

  const { validation, validateField, checkFormComplete } = useInscriptionValidation(
    form,
    setPasswordStrength,
  );

  // Nettoyer l'authentification au chargement
  useEffect(() => {
    clearAllAuthData();
  }, []);

  // Mapper les données des options
  const abonnementOptions = React.useMemo(() => {
    if (!Array.isArray(abonnementOptionsRaw)) return [];

    return abonnementOptionsRaw
      .filter((option) => option?.id && option?.nom_plan)
      .map((option: any) => ({
        value: String(option.id),
        label: String(option.nom_plan),
        prix: Number(option.prix || 0),
        description: String(option.description || ""),
      }))
      .filter(Boolean);
  }, [abonnementOptionsRaw]);

  const genreOptions = React.useMemo(() => {
    if (!Array.isArray(genreOptionsRaw)) return [];

    return genreOptionsRaw
      .filter((option) => option?.id && option?.genre_name)
      .map((option: any) => ({
        value: String(option.id),
        label: String(option.genre_name),
      }))
      .filter(Boolean);
  }, [genreOptionsRaw]);

  // Logique de validation et vérification - FLUX AMÉLIORÉ
  useEffect(() => {
    const isComplete = checkFormComplete();
    setIsFormComplete(isComplete);

    // ÉTAPE 1 : Vérifier d'abord si le formulaire est complet
    if (isComplete && !isCheckingUser) {
      const criticalFields = [form.nom, form.prenom, form.date_naissance];
      const allCriticalFieldsValid = criticalFields.every(
        (field) =>
          field !== undefined &&
          field !== null &&
          String(field).trim() !== "" &&
          String(field).trim().length >= 2,
      );

      if (allCriticalFieldsValid) {
        console.log("🔍 Déclenchement de la vérification utilisateur...");

        // ÉTAPE 2 : Vérifier si l'utilisateur existe en DB (avec délai)
        setTimeout(() => {
          if (isFormComplete && !backendVerificationDone && !isCheckingUser) {
            triggerBackendVerification();
          }
        }, 500);
      }
    }

    // Réinitialiser si le formulaire devient incomplet
    if (!isComplete && (backendVerificationDone || isCheckingUser)) {
      console.log("🔄 Réinitialisation - formulaire incomplet");
      resetVerificationState();
    }
  }, [
    form,
    validation,
    isFormComplete,
    checkFormComplete,
    backendVerificationDone,
    isCheckingUser,
  ]);

  // Fonction utilitaire pour réinitialiser l'état de vérification
  const resetVerificationState = () => {
    setBackendVerificationDone(false);
    setUserExists(false);
    setCanSubmit(false);
    setIsCheckingUser(false);
    setExistingUserData(null);
    setError("");
  };

  // ÉTAPE 2 : Vérification d'existence en base de données
  const triggerBackendVerification = async () => {
    try {
      console.log("🔍 [ÉTAPE 2] Début de la vérification d'existence en DB");

      // Vérifications préalables
      if (isCheckingUser) {
        console.log("⏳ Vérification déjà en cours");
        return;
      }

      if (backendVerificationDone) {
        console.log("✅ Vérification déjà effectuée");
        return;
      }

      const criticalFields = [form.nom, form.prenom, form.date_naissance];
      const allCriticalFieldsPresent = criticalFields.every(
        (field) =>
          field !== undefined &&
          field !== null &&
          String(field).trim() !== "" &&
          String(field).trim().length >= 2,
      );

      if (!allCriticalFieldsPresent || !isFormComplete) {
        console.log("❌ Conditions non remplies pour la vérification");
        return;
      }

      // Démarrer la vérification
      setIsCheckingUser(true);
      setBackendVerificationDone(false);
      setCanSubmit(false);
      setError("");

      console.log("📡 Envoi de la requête de vérification:", {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        date_naissance: form.date_naissance.trim(),
      });

      const verificationData = {
        nom: String(form.nom).trim(),
        prenom: String(form.prenom).trim(),
        date_naissance: String(form.date_naissance).trim(),
      };

      // APPEL API : Vérifier l'existence en base
      await verifierUtilisateur.mutateAsync(verificationData);

      // Si on arrive ici, l'utilisateur n'existe PAS en base
      console.log("✅ [ÉTAPE 2] Utilisateur disponible - passage à la validation Zod");
      setUserExists(false);
      setExistingUserData(null);

      // ÉTAPE 3 : Validation finale avec schéma Zod
      const zodValidationResult = validateWithZodSchema();

      if (zodValidationResult.success) {
        console.log("✅ [ÉTAPE 3] Validation Zod réussie - autorisation d'inscription");
        setCanSubmit(true);
        setError("");
      } else {
        console.log("❌ [ÉTAPE 3] Validation Zod échouée:", zodValidationResult.error);
        setCanSubmit(false);
        setError(`Validation échouée: ${zodValidationResult.error}`);
      }
    } catch (error: any) {
      console.log("🚨 [ÉTAPE 2] Erreur lors de la vérification en DB:", error);

      // Analyser le type d'erreur
      if (
        error.response?.status === 409 ||
        (error.message && error.message.includes("existe déjà")) ||
        (error.message && error.message.includes("USER_EXISTS"))
      ) {
        console.log("👤 [ÉTAPE 2] Utilisateur existe déjà - BLOCAGE inscription");
        setUserExists(true);
        setExistingUserData({
          nom: form.nom || "",
          prenom: form.prenom || "",
          date_naissance: form.date_naissance || "",
          status: "Utilisateur existant",
        });

        setCanSubmit(false);
        setError("Une personne avec ces informations est déjà inscrite.");

        // Afficher le modal d'information
        setInformationModalData({
          title: "Utilisateur déjà existant",
          message:
            "Une personne avec ce nom, prénom et date de naissance est déjà inscrite dans notre système.",
          type: "warning",
          details: {
            actions: [
              {
                label: "Aller à la connexion",
                action: () => {
                  window.location.href = `${window.location.origin}/pages/connexion`;
                },
                variant: "primary" as const,
              },
              {
                label: "Modifier les données",
                action: () => {
                  resetVerificationState();
                  setShowInformationModal(false);
                  setInformationModalData(null);
                  setTimeout(() => {
                    document.getElementById("prenom")?.focus();
                  }, 100);
                },
                variant: "secondary" as const,
              },
            ],
          },
        });
        setShowInformationModal(true);
      } else {
        // Erreur technique - on peut continuer mais avec avertissement
        console.log("⚠️ [ÉTAPE 2] Erreur technique, mais on continue avec validation Zod");
        setUserExists(false);
        setExistingUserData(null);

        // Tenter quand même la validation Zod
        const zodValidationResult = validateWithZodSchema();

        if (zodValidationResult.success) {
          setCanSubmit(true);
          setError(""); // Pas d'erreur si Zod valide
        } else {
          setCanSubmit(false);
          setError(`Validation échouée: ${zodValidationResult.error}`);
        }

        // Afficher l'erreur technique seulement si critique
        if (error.message && !error.message.includes("Network Error")) {
          console.warn(`Erreur technique lors de la vérification: ${error.message}`);
        }
      }
    } finally {
      setIsCheckingUser(false);
      setBackendVerificationDone(true);

      console.log("🏁 [ÉTAPE 2] Vérification d'existence terminée");
    }
  };

  // ÉTAPE 3 : Validation avec le schéma Zod
  const validateWithZodSchema = (): { success: boolean; error?: string } => {
    try {
      console.log("🔍 [ÉTAPE 3] Validation avec schéma Zod...");

      // CORRECTION FINALE: Utiliser les bons noms de champs pour le schéma
      const zodData = {
        prenom: String(form.prenom).trim(),
        nom: String(form.nom).trim(),
        nom_utilisateur: String(form.nom_utilisateur || `${form.prenom}.${form.nom}`)
          .toLowerCase()
          .replace(/\s/g, ""),
        email: String(form.email).toLowerCase().trim(),
        password: String(form.password),
        // Le schéma userInscriptionSchema attend 'date' pas 'date_naissance'
        date: String(form.date_naissance),
        // CORRECTION CRITIQUE: Le schéma attend 'abonnement' et 'genre' comme nombres
        abonnement: parseInt(String(form.abonnement), 10),
        genre: parseInt(String(form.genre), 10),
        date_inscription: new Date().toISOString().split("T")[0],
        status_id: 1,
        grade_id: 1,
      };

      // Vérifications renforcées avant validation Zod
      if (isNaN(zodData.genre) || zodData.genre <= 0) {
        console.log("❌ Genre invalide:", form.genre, "->", zodData.genre);
        return { success: false, error: "Genre invalide" };
      }

      if (isNaN(zodData.abonnement) || zodData.abonnement <= 0) {
        console.log("❌ Abonnement invalide:", form.abonnement, "->", zodData.abonnement);
        return { success: false, error: "Abonnement invalide" };
      }

      if (!zodData.date || !/^\d{4}-\d{2}-\d{2}$/.test(zodData.date)) {
        console.log("❌ Date invalide:", form.date_naissance, "->", zodData.date);
        return { success: false, error: "Date de naissance invalide (format requis: YYYY-MM-DD)" };
      }

      console.log("🔍 [ÉTAPE 3] Données formatées pour Zod (CORRIGÉES):", zodData);
      console.log("🔍 [ÉTAPE 3] Types finaux:", {
        date: typeof zodData.date,
        genre: typeof zodData.genre,
        abonnement: typeof zodData.abonnement,
        values: {
          genre: zodData.genre,
          abonnement: zodData.abonnement,
        },
      });

      const result = userInscriptionSchema.safeParse(zodData);

      if (result.success) {
        console.log("✅ [ÉTAPE 3] Validation Zod réussie");
        return { success: true };
      } else {
        // CORRECTION: Gestion correcte des erreurs Zod
        let errorMessage = "Erreur de validation inconnue";

        if (
          result.error &&
          result.error.errors &&
          Array.isArray(result.error.errors) &&
          result.error.errors.length > 0
        ) {
          const firstError = result.error.errors[0];
          errorMessage = `${firstError.path ? firstError.path.join(".") : "champ inconnu"} : ${firstError.message || "erreur inconnue"}`;
          console.log("❌ [ÉTAPE 3] Validation Zod échouée:", errorMessage);
          console.log("❌ Toutes les erreurs Zod:", result.error.errors);
        } else if (result.error) {
          console.log("❌ [ÉTAPE 3] Erreur Zod structure différente:", result.error);
          errorMessage = "Erreur de validation des données";
        }

        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      console.error("🚨 [ÉTAPE 3] Erreur lors de la validation Zod:", error);
      return { success: false, error: "Erreur lors de la validation des données" };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("🚀 [SOUMISSION] Tentative de soumission du formulaire");
    console.log("📊 État actuel:", {
      isFormComplete,
      isCheckingUser,
      backendVerificationDone,
      userExists,
      canSubmit,
      formData: {
        genre: form.genre,
        abonnement: form.abonnement,
        date_naissance: form.date_naissance,
      },
    });

    // VÉRIFICATION FINALE AVANT SOUMISSION

    // 1. Formulaire complet ?
    if (!isFormComplete) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // 2. Vérification en cours ?
    if (isCheckingUser) {
      setError("Vérification en cours, veuillez patienter...");
      return;
    }

    // 3. Vérification backend effectuée ?
    if (!backendVerificationDone) {
      setError("Vérification de l'utilisateur en cours...");
      console.log("🔄 Déclenchement manuel de la vérification");
      await triggerBackendVerification();
      return;
    }

    // 4. Utilisateur existe déjà ?
    if (userExists) {
      setError("BLOCAGE: Une personne avec ces informations existe déjà.");
      setInformationModalData({
        title: "Inscription impossible",
        message: "Une personne avec ces informations existe déjà dans notre système.",
        type: "error",
        details: {
          actions: [
            {
              label: "Aller à la connexion",
              action: handleGoToLogin,
              variant: "primary" as const,
            },
            {
              label: "Modifier les données",
              action: handleModifyData,
              variant: "secondary" as const,
            },
          ],
        },
      });
      setShowInformationModal(true);
      return;
    }

    // 5. Autorisation finale ?
    if (!canSubmit) {
      setError("Le formulaire n'est pas autorisé pour la soumission. Vérifiez tous les champs.");
      return;
    }

    // VALIDATION FINALE avec Zod (double vérification avec données corrigées)
    const finalValidation = validateWithZodSchema();
    if (!finalValidation.success) {
      console.error("🚨 [SOUMISSION] Validation finale échouée:", finalValidation.error);
      setError(finalValidation.error || "Validation finale échouée.");
      return;
    }

    console.log("✅ [SOUMISSION] Toutes les vérifications passées:");
    console.log("  ✓ Formulaire complet");
    console.log("  ✓ Utilisateur vérifié (n'existe pas)");
    console.log("  ✓ Schéma Zod validé");
    console.log("  ✓ Autorisation accordée");
    console.log("🎉 Ouverture du récapitulatif...");

    setShowRecap(true);
  };

  const handleConfirm = async () => {
    setModalMessage(null);

    try {
      // NOUVEAU: Le backend s'occupe maintenant automatiquement de l'envoi d'email
      const dataToSend = {
        prenom: form.prenom,
        nom: form.nom,
        nom_utilisateur: form.nom_utilisateur,
        email: form.email,
        password: form.password,
        genre_id: Number(form.genre),
        abonnement_id: Number(form.abonnement),
        date_naissance: form.date_naissance,
        date_inscription: new Date().toISOString().split("T")[0],
        status_id: 1,
        grade_id: 1,
      };

      console.log("📤 [Inscription] Envoi des données:", dataToSend);

      const result = await inscrireUtilisateur.mutateAsync(dataToSend);

      console.log("📨 [Inscription] Réponse reçue:", result);

      // Construire le message de succès SANS l'userId
      let message = "Inscription réussie ! Bienvenue dans notre club.";

      // Informations sur l'email
      if (result.emailStatus?.sent) {
        message += "\n📧 Un email de bienvenue vous a été envoyé à votre adresse.";
        if (result.emailStatus.messageId) {
          console.log("✅ Email envoyé avec ID:", result.emailStatus.messageId);
        }
      } else if (result.emailStatus?.error) {
        message += "\n⚠️ Inscription réussie mais l'email de bienvenue n'a pas pu être envoyé.";
        message += "\n💡 Vous pouvez demander un renvoi depuis la page de connexion.";
        console.warn("⚠️ Erreur email:", result.emailStatus.error);
      } else {
        message += "\n⚠️ Statut de l'email de bienvenue non disponible.";
      }

      // Nettoyer les données d'authentification
      clearAllAuthData();

      setModalMessage(message);
      setShowRecap(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("❌ [Inscription] Erreur:", err);

      let errorMessage = "Erreur lors de l'inscription.";

      // Gestion des erreurs spécifiques
      if (err.response?.status === 409) {
        if (err.response.data?.error === "USER_EXISTS") {
          errorMessage =
            "Un utilisateur avec ces informations existe déjà. Veuillez vous connecter.";
        } else if (err.response.data?.error === "EMAIL_EXISTS") {
          errorMessage = "Cette adresse email est déjà utilisée.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setModalMessage(errorMessage);
    }
  };

  // Handlers pour les actions des alertes
  const handleCloseUserExistsAlert = () => {
    setBackendVerificationDone(false);
    setUserExists(false);
    setExistingUserData(null);
    setCanSubmit(false);
  };

  const handleGoToLogin = () => {
    window.location.href = `${window.location.origin}/pages/connexion`;
  };

  const handleModifyData = () => {
    setBackendVerificationDone(false);
    setUserExists(false);
    setExistingUserData(null);
    setCanSubmit(false);
    document.getElementById("prenom")?.focus();
  };

  // Gestionnaire pour les changements de champs
  const handleChange = (value: string, name: string) => {
    const safeValue = value || "";

    setForm((prevForm) => ({
      ...prevForm,
      [name]: safeValue,
    }));
    setError("");

    // Si on modifie un champ critique, réinitialiser TOUT le processus de vérification
    if (["prenom", "nom", "date_naissance"].includes(name)) {
      console.log(`🔄 Champ critique modifié: ${name} - Réinitialisation complète`);
      resetVerificationState();

      // Fermer le modal si ouvert
      if (showInformationModal) {
        setShowInformationModal(false);
        setInformationModalData(null);
      }
    }

    // Validation des champs en temps réel avec Zod
    if (
      [
        "prenom",
        "nom",
        "email",
        "password",
        "confirmPassword",
        "date_naissance",
        "abonnement",
        "genre",
      ].includes(name)
    ) {
      setTimeout(() => {
        validateField(name, safeValue);
      }, 300);
    }
  };

  // Génération automatique du nom d'utilisateur
  useEffect(() => {
    if (form.prenom && form.nom) {
      const nom_utilisateur = `${form.prenom.toLowerCase().replace(/\s/g, "")}.${form.nom.toLowerCase().replace(/\s/g, "")}`;
      setForm((prev) => ({ ...prev, nom_utilisateur }));
    }
  }, [form.prenom, form.nom]);

  return (
    <div className="inscription-page">
      <div className="login-background-decoration" />

      <PageHeader
        title="Club Manager"
        subtitle="Inscrivez-vous pour rejoindre notre club"
        variant="inscription"
      />

      <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
        <Bullseye style={{ width: "100%" }}>
          <div className="login-container" style={{ maxWidth: "600px" }}>
            <div className="login-header">
              <div className="login-logo">🥋</div>
              <h1 className="login-title">Rejoignez-nous</h1>
              <p className="login-subtitle">Créez votre compte pour commencer votre parcours</p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert variant={AlertVariant.danger} title="Erreur d'inscription" isInline>
                  {error}
                </Alert>
              )}

              {/* Alertes de statut du formulaire */}
              <FormStatusAlerts
                isFormComplete={isFormComplete}
                isCheckingUser={isCheckingUser}
                backendVerificationDone={backendVerificationDone}
                userExists={userExists}
                existingUserData={existingUserData}
                onCloseUserExistsAlert={handleCloseUserExistsAlert}
                onGoToLogin={handleGoToLogin}
                onModifyData={handleModifyData}
              />

              {/* Champs du formulaire */}
              <InscriptionFormFields
                form={form}
                validation={validation}
                passwordStrength={passwordStrength}
                showPasswordRequirements={showPasswordRequirements}
                abonnementOptions={abonnementOptions}
                genreOptions={genreOptions}
                onFieldChange={handleChange}
                onPasswordFocus={() => setShowPasswordRequirements(true)}
                onPasswordBlur={() => setShowPasswordRequirements(false)}
              />

              {/* Bouton de soumission */}
              <div className="login-actions">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={inscrireUtilisateur.isPending}
                  isDisabled={
                    inscrireUtilisateur.isPending ||
                    !isFormComplete ||
                    !backendVerificationDone ||
                    userExists ||
                    isCheckingUser ||
                    !canSubmit
                  }
                  className="login-button"
                >
                  {isCheckingUser
                    ? "Vérification..."
                    : inscrireUtilisateur.isPending
                      ? "Création du compte..."
                      : canSubmit
                        ? "S'inscrire"
                        : "En attente..."}
                </Button>
              </div>

              <div className="login-footer">
                <p>
                  Déjà un compte ?{" "}
                  <Link to="/pages/connexion" className="login-link">
                    Connectez-vous ici
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </Bullseye>
      </PageSection>

      {/* Modals */}
      <RecapModal
        isOpen={showRecap}
        onClose={() => setShowRecap(false)}
        onConfirm={handleConfirm}
        form={form}
        abonnementOptions={abonnementOptions}
        genreOptions={genreOptions}
        modalMessage={modalMessage}
        isLoading={inscrireUtilisateur.isPending}
      />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />

      {informationModalData && (
        <InformationModal
          isOpen={showInformationModal}
          onClose={() => setShowInformationModal(false)}
          title={informationModalData.title}
          message={informationModalData.message}
          type={informationModalData.type}
          details={informationModalData.details}
        />
      )}
    </div>
  );
};

export default InscriptionPage;
