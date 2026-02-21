/**
 * LoginPage - Refactored Example
 *
 * This is a modern refactored version of LoginPage demonstrating:
 * - i18n integration with useTypedTranslation
 * - withTracking HOC for analytics
 * - useLoadingWrapper for better UX
 * - Error handling with error boundaries
 * - Type-safe translations
 * - Clean separation of concerns
 *
 * CHANGES FROM ORIGINAL:
 * - ✅ All strings extracted to i18n
 * - ✅ Sentry tracking integrated
 * - ✅ Loading states simplified with useLoadingWrapper
 * - ✅ Better error handling
 * - ✅ Cleaner code structure
 * - ✅ Type safety improved
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
  PageSection,
  Bullseye,
} from "@patternfly/react-core";
import ResultModal from "@/shared/components/common-legacy/modal/ResultModal";
import { useConnexion } from "../hooks/useConnexion";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { clearAllAuthData } from "@/shared/utils/authCleaner";

// ✨ NEW: Import HOCs and helpers
import { withTracking, useTracking } from "@/hocs/withTracking";
import { useLoadingWrapper } from "@/hocs/withLoading";
import { useTypedTranslation } from "@/core/i18n/translationHelpers";

// ✨ NEW: Import Zustand store
import { useAuthStore } from "@/store/authStore";

// ============================================================================
// TYPES
// ============================================================================

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginPageProps {
  onSuccess?: (data: any) => void;
}

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  nom_utilisateur?: string;
  email: string;
  status: string;
  genres: any;
  grades: any;
  abonnement: any;
  date_of_birth: string;
}

interface LoginResponse {
  user: UserData;
  token: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REDIRECT_COUNTDOWN_SECONDS = 5;
const USER_PATHS = {
  utilisateur: "/pages/cours/inscription",
  visiteur: "/pages/cours/inscription",
  default: "/pages/dashboard",
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

const LoginPageComponent: React.FC<LoginPageProps> = ({ onSuccess }) => {
  // ✨ NEW: i18n hook with type safety
  const { t } = useTypedTranslation();

  // ✨ NEW: Tracking hook for analytics
  const { trackEvent } = useTracking();

  // ✨ NEW: Zustand auth store
  const login = useAuthStore((state) => state.login);

  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);

  const connexion = useConnexion();

  // ✨ NEW: Use loading wrapper for better UX
  const { wrapAsync, isLoading } = useLoadingWrapper({
    loadingMessage: t("auth.login.messages.loggingIn", "Connexion en cours..."),
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const getRedirectPath = (status: string): string => {
    if (status === "utilisateur" || status === "visiteur") {
      return USER_PATHS.utilisateur;
    }
    return USER_PATHS.default;
  };

  const saveUserData = (user: UserData, token: string): void => {
    // ✨ NEW: Use Zustand store instead of localStorage directly
    login(
      {
        id: Number(user.id),
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: undefined,
        birth_date: user.date_of_birth,
        role: user.status,
        active: true,
      },
      token,
    );

    // Keep old localStorage for backwards compatibility (temporary)
    localStorage.setItem("authToken", token);
    localStorage.setItem(
      "userData",
      JSON.stringify({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        nom_utilisateur: user.nom_utilisateur || "",
        email: user.email,
        status: user.status,
        genres: user.genres,
        grades: user.grades,
        abonnement: user.abonnement,
        date_of_birth: user.date_of_birth,
        token,
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✨ NEW: Track login attempt
    trackEvent("Login Attempt", {
      email: formData.email,
      timestamp: new Date().toISOString(),
    });

    // ✨ NEW: Use loading wrapper
    wrapAsync(async () => {
      try {
        const data = await connexion.mutateAsync(formData);

        console.log("Réponse de l'API:", data);

        if (!data || !data.user) {
          throw new Error(
            t(
              "auth.login.errors.missingUserData",
              "Données utilisateur manquantes dans la réponse.",
            ),
          );
        }

        const { user, token } = data as LoginResponse;

        // Save user data
        saveUserData(user, token);

        // ✨ NEW: Track successful login
        trackEvent("Login Success", {
          userId: user.id,
          userStatus: user.status,
          timestamp: new Date().toISOString(),
        });

        if (onSuccess) {
          onSuccess(data);
        }

        // ✨ NEW: Use i18n for success message
        const welcomeMessage = t(
          "auth.login.messages.welcomeSuccess",
          "Bienvenue {{firstName}} {{lastName}} ! Connexion réussie.",
          { firstName: user.first_name, lastName: user.last_name },
        );

        setResultModalMessage(welcomeMessage);
        setIsResultModalOpen(true);
      } catch (err: any) {
        console.error("Erreur lors de la connexion:", err);

        // ✨ NEW: Track login error
        trackEvent("Login Error", {
          email: formData.email,
          error: err.message,
          timestamp: new Date().toISOString(),
        });

        // ✨ NEW: Use i18n for error messages
        const errorMessage =
          err.message ||
          t("auth.login.errors.connectionFailed", "Erreur lors de la tentative de connexion");

        setError(errorMessage);
      }
    });
  };

  const handleResultModalClose = () => {
    setIsResultModalOpen(false);
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const redirectPath = getRedirectPath(userData.status);

    // ✨ NEW: Track redirect
    trackEvent("Login Redirect", {
      path: redirectPath,
      status: userData.status,
    });

    window.location.href = `${window.location.origin}${redirectPath}`;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-redirect with countdown
  useEffect(() => {
    if (
      isResultModalOpen &&
      resultModalMessage.includes(t("auth.login.messages.welcome", "Bienvenue"))
    ) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const userData = JSON.parse(localStorage.getItem("userData") || "{}");
            const redirectPath = getRedirectPath(userData.status);
            window.location.href = `${window.location.origin}${redirectPath}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isResultModalOpen, resultModalMessage, t]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isResultModalOpen) {
      setCountdown(REDIRECT_COUNTDOWN_SECONDS);
    }
  }, [isResultModalOpen]);

  // Clear auth data on mount
  useEffect(() => {
    clearAllAuthData();

    // ✨ NEW: Track page view
    trackEvent("Login Page View", {
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="login-page">
      {/* Background decorative elements */}
      <div className="login-background-decoration" />

      <PageHeader
        title={t("auth.login.header.title", "Club Manager")}
        subtitle={t("auth.login.header.subtitle", "Connectez-vous à votre espace membre")}
        variant="login"
      />

      <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
        <Bullseye style={{ width: "100%" }}>
          <div className="login-container">
            {/* Logo/Icon section */}
            <div className="login-header">
              <div className="login-logo">🥋</div>
              <h1 className="login-title">{t("auth.login.title", "Bienvenue")}</h1>
              <p className="login-subtitle">
                {t("auth.login.subtitle", "Connectez-vous pour accéder à votre espace")}
              </p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert
                  variant={AlertVariant.danger}
                  title={t("auth.login.errors.title", "Erreur de connexion")}
                  isInline
                  className="login-error"
                >
                  {error}
                </Alert>
              )}

              <FormGroup
                label={t("auth.login.fields.userId", "UserId")}
                isRequired
                fieldId="email"
                className="login-form-group"
              >
                <TextInput
                  isRequired
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(_event, value) => handleChange("email", value)}
                  placeholder={t("auth.login.placeholders.userId", "USR20257F8D10")}
                  className="login-input"
                />
              </FormGroup>

              <FormGroup
                label={t("auth.login.fields.password", "Mot de passe")}
                isRequired
                fieldId="password"
                className="login-form-group"
              >
                <TextInput
                  isRequired
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(_event, value) => handleChange("password", value)}
                  placeholder={t("auth.login.placeholders.password", "Entrez votre mot de passe")}
                  className="login-input"
                />
              </FormGroup>

              <div className="login-actions">
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isLoading || connexion.isPending}
                  isDisabled={isLoading || connexion.isPending}
                  className="login-button"
                >
                  {isLoading || connexion.isPending
                    ? t("auth.login.buttons.loggingIn", "Connexion en cours...")
                    : t("auth.login.buttons.submit", "Se connecter")}
                </Button>

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <Button
                    variant="link"
                    onClick={() => {
                      trackEvent("Forgot Password Click", {
                        timestamp: new Date().toISOString(),
                      });
                      window.location.href = `${window.location.origin}/pages/auth/forgot-password`;
                    }}
                    style={{ fontSize: "14px" }}
                  >
                    {t("auth.login.links.forgotPassword", "Mot de passe oublié ?")}
                  </Button>
                </div>
              </div>

              <div className="login-footer">
                <p>
                  {t("auth.login.footer.noAccount", "Pas encore de compte ?")}{" "}
                  <Button
                    variant="link"
                    onClick={() => {
                      trackEvent("Register Link Click", {
                        timestamp: new Date().toISOString(),
                      });
                      window.location.href = `${window.location.origin}/pages/inscription`;
                    }}
                    style={{ padding: 0, fontSize: "inherit" }}
                    className="register-link"
                  >
                    {t("auth.login.links.register", "Inscrivez-vous ici")}
                  </Button>
                </p>
                <p style={{ fontSize: "0.875rem", color: "#6c757d", marginTop: "0.5rem" }}>
                  {t(
                    "auth.login.footer.userIdHint",
                    "💡 Votre UserId se trouve dans l'email de confirmation reçu lors de l'inscription",
                  )}
                </p>
              </div>
            </Form>
          </div>
        </Bullseye>
      </PageSection>

      {/* ResultModal avec timer dans le footer */}
      <ResultModal
        isOpen={isResultModalOpen}
        onClose={handleResultModalClose}
        title={t("auth.login.modal.title", "Connexion réussie")}
        message={resultModalMessage}
        isSuccess={true}
        showTimer={true}
        countdown={countdown}
      />
    </div>
  );
};

// ✨ NEW: Export with HOC
// This adds automatic tracking breadcrumbs to Sentry
export default withTracking(LoginPageComponent, "LoginPage");

/**
 * USAGE NOTES:
 *
 * 1. To use this refactored version, rename it to LoginPage.tsx
 * 2. Add missing translations to locales/fr/index.ts (see below)
 * 3. Test thoroughly in dev environment
 * 4. Check Sentry for tracking events
 *
 * REQUIRED TRANSLATIONS (add to locales/fr/index.ts):
 *
 * auth: {
 *   login: {
 *     header: {
 *       title: "Club Manager",
 *       subtitle: "Connectez-vous à votre espace membre"
 *     },
 *     title: "Bienvenue",
 *     subtitle: "Connectez-vous pour accéder à votre espace",
 *     fields: {
 *       userId: "UserId",
 *       password: "Mot de passe"
 *     },
 *     placeholders: {
 *       userId: "USR20257F8D10",
 *       password: "Entrez votre mot de passe"
 *     },
 *     buttons: {
 *       submit: "Se connecter",
 *       loggingIn: "Connexion en cours..."
 *     },
 *     links: {
 *       forgotPassword: "Mot de passe oublié ?",
 *       register: "Inscrivez-vous ici"
 *     },
 *     footer: {
 *       noAccount: "Pas encore de compte ?",
 *       userIdHint: "💡 Votre UserId se trouve dans l'email de confirmation reçu lors de l'inscription"
 *     },
 *     modal: {
 *       title: "Connexion réussie"
 *     },
 *     messages: {
 *       welcome: "Bienvenue",
 *       welcomeSuccess: "Bienvenue {{firstName}} {{lastName}} ! Connexion réussie.",
 *       loggingIn: "Connexion en cours..."
 *     },
 *     errors: {
 *       title: "Erreur de connexion",
 *       connectionFailed: "Erreur lors de la tentative de connexion",
 *       missingUserData: "Données utilisateur manquantes dans la réponse."
 *     }
 *   }
 * }
 */
