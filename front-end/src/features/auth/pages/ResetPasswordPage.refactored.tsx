import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  PageSection,
  Bullseye,
  Spinner,
  Progress,
  List,
  ListItem,
} from "@patternfly/react-core";
import { CheckCircleIcon, CheckIcon, TimesIcon } from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { apiUrl } from "@/shared/utils/apiUrl";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useLoadingWrapper } from "@/core/hocs/withLoading";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";

interface PasswordStrength {
  criteria: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    numbers: boolean;
    symbols: boolean;
    noCommon: boolean;
  };
  score: number;
  strength: "weak" | "fair" | "good" | "strong";
  color: "red" | "orange" | "blue" | "green";
  percentage: number;
  isValid: boolean;
}

// Fonction pour analyser la force du mot de passe
const analyzePasswordStrength = (password: string): PasswordStrength => {
  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !["password", "123456", "qwerty", "abc123", "password123"].includes(
      password.toLowerCase(),
    ),
  };

  const score = Object.values(criteria).filter(Boolean).length;

  let strength: "weak" | "fair" | "good" | "strong";
  let color: "red" | "orange" | "blue" | "green";
  let percentage: number;

  if (score <= 2) {
    strength = "weak";
    color = "red";
    percentage = 25;
  } else if (score <= 3) {
    strength = "fair";
    color = "orange";
    percentage = 50;
  } else if (score <= 4) {
    strength = "good";
    color = "blue";
    percentage = 75;
  } else {
    strength = "strong";
    color = "green";
    percentage = 100;
  }

  return {
    criteria,
    score,
    strength,
    color,
    percentage,
    isValid: score >= 3 && criteria.length,
  };
};

const ResetPasswordPage: React.FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { trackEvent, trackError } = useTracking();
  const { wrapAsync, isLoading: submitting } = useLoadingWrapper();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; userName: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(analyzePasswordStrength(""));
  const [showStrengthDetails, setShowStrengthDetails] = useState(false);

  // Track page view
  useEffect(() => {
    trackEvent({
      category: "Auth",
      action: "View Reset Password Page",
      label: "User accessed reset password page",
    });
  }, [trackEvent]);

  // Mettre à jour la force du mot de passe
  useEffect(() => {
    setPasswordStrength(analyzePasswordStrength(password));
    setShowStrengthDetails(password.length > 0);
  }, [password]);

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError(t("auth.resetPassword.missingToken"));
        setLoading(false);
        trackError(new Error("Missing reset token"), { context: "ResetPasswordPage" });
        return;
      }

      try {
        console.log("🔍 [ResetPassword] Vérification du token:", token.substring(0, 10) + "...");

        const response = await fetch(apiUrl(`auth/verify-token/${token}`));
        const data = await response.json();

        console.log("🔍 [ResetPassword] Réponse vérification:", { status: response.status, data });

        if (response.ok && data.valid) {
          setTokenValid(true);
          setUserInfo({
            email: data.email,
            userName: data.userName,
          });
          console.log("✅ [ResetPassword] Token valide pour:", data.userName);
          trackEvent({
            category: "Auth",
            action: "Token Verified",
            label: `User: ${data.userName}`,
          });
        } else {
          console.error("❌ [ResetPassword] Token invalide:", data);
          setError(data.error || t("auth.resetPassword.invalidToken"));
          trackError(new Error(`Invalid token: ${data.error}`), {
            context: "ResetPasswordPage",
            tokenProvided: !!token,
          });
        }
      } catch (err) {
        console.error("❌ [ResetPassword] Erreur vérification token:", err);
        setError(t("auth.resetPassword.connectionError"));
        trackError(err as Error, { context: "ResetPasswordPage - Token Verification" });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, t, trackEvent, trackError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordStrength.isValid) {
      setError(t("auth.resetPassword.weakPassword"));
      return;
    }

    trackEvent({
      category: "Auth",
      action: "Submit Reset Password",
      label: `User: ${userInfo?.userName}`,
    });

    await wrapAsync(async () => {
      setError("");

      try {
        const response = await fetch(apiUrl("auth/reset-password"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(true);
          trackEvent({
            category: "Auth",
            action: "Reset Password Success",
            label: `User: ${userInfo?.userName}`,
          });

          setTimeout(() => {
            navigate("/pages/connexion?reset=success");
          }, 3000);
        } else {
          const errorMsg = data.error || t("auth.resetPassword.error");
          setError(errorMsg);
          trackError(new Error(`Reset password failed: ${errorMsg}`), {
            context: "ResetPasswordPage",
            statusCode: response.status,
          });
        }
      } catch (err) {
        const errorMsg = t("auth.resetPassword.connectionError");
        setError(errorMsg);
        trackError(err as Error, { context: "ResetPasswordPage - Submit Error" });
      }
    });
  };

  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordStrength.isValid && passwordsMatch && password && confirmPassword;

  // État de chargement
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />

        <PageHeader
          title={t("auth.resetPassword.verifying")}
          subtitle={t("auth.resetPassword.verifyingSubtitle")}
          variant="login"
        />

        <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
          <Bullseye style={{ width: "100%" }}>
            <div className="login-container" style={{ textAlign: "center" }}>
              <Spinner size="xl" />
              <div style={{ marginTop: "1rem", color: "#6c757d" }}>
                {t("auth.resetPassword.verifyingLink")}
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  // Token invalide
  if (!tokenValid) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />

        <PageHeader
          title={t("auth.resetPassword.invalidLinkTitle")}
          subtitle={t("auth.resetPassword.invalidLinkSubtitle")}
          variant="login"
        />

        <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
          <Bullseye style={{ width: "100%" }}>
            <div className="login-container">
              <div className="login-form" style={{ textAlign: "center" }}>
                <Alert variant="danger" title={t("common.error")} style={{ marginBottom: "1rem" }}>
                  {error}
                </Alert>
                <p style={{ marginBottom: "1rem", color: "#6c757d" }}>
                  {t("auth.resetPassword.invalidLinkMessage")}
                </p>
                <div className="login-actions">
                  <Button
                    variant="primary"
                    onClick={() => navigate("/pages/auth/forgot-password")}
                    className="login-button"
                  >
                    {t("auth.resetPassword.requestNewLink")}
                  </Button>
                </div>
              </div>

              <div className="login-footer">
                <p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/pages/connexion")}
                    style={{ padding: 0, fontSize: "inherit" }}
                  >
                    {t("auth.forgotPassword.backToLogin")}
                  </Button>
                </p>
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div className="login-page">
        <div className="login-background-decoration" />

        <PageHeader
          title={t("auth.resetPassword.successTitle")}
          subtitle={t("auth.resetPassword.successSubtitle")}
          variant="login"
        />

        <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
          <Bullseye style={{ width: "100%" }}>
            <div className="login-container">
              <div className="login-form" style={{ textAlign: "center" }}>
                <CheckCircleIcon size="xl" style={{ color: "#28a745", marginBottom: "2rem" }} />

                <Alert
                  variant="success"
                  title={t("common.success")}
                  style={{ marginBottom: "1rem" }}
                >
                  {t("auth.resetPassword.successMessage")}
                </Alert>

                <p style={{ marginBottom: "2rem", color: "#6c757d" }}>
                  {t("auth.resetPassword.redirecting")}
                </p>

                <div className="login-actions">
                  <Button
                    variant="primary"
                    onClick={() => navigate("/pages/connexion")}
                    className="login-button"
                  >
                    {t("auth.resetPassword.loginNow")}
                  </Button>
                </div>
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background-decoration" />

      <PageHeader
        title={t("auth.resetPassword.title")}
        subtitle={t("auth.resetPassword.subtitle", { userName: userInfo?.userName || "" })}
        variant="login"
      />

      <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
        <Bullseye style={{ width: "100%" }}>
          <div className="login-container">
            <Form onSubmit={handleSubmit} className="login-form">
              <FormGroup
                label={t("auth.resetPassword.newPassword")}
                isRequired
                fieldId="password"
                validated={password && !passwordStrength.isValid ? "error" : "default"}
                helperText={t("auth.resetPassword.passwordHelper")}
                helperTextInvalid={t("auth.resetPassword.passwordInvalid")}
                className="login-form-group"
              >
                <TextInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(_event, value) => setPassword(value)}
                  placeholder={t("auth.resetPassword.passwordPlaceholder")}
                  isRequired
                  validated={password && !passwordStrength.isValid ? "error" : "default"}
                  className="login-input"
                />

                {showStrengthDetails && (
                  <div style={{ marginTop: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#495057" }}>
                        {t("auth.resetPassword.strength.title")}
                      </span>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          color:
                            passwordStrength.color === "green"
                              ? "#28a745"
                              : passwordStrength.color === "blue"
                                ? "#007bff"
                                : passwordStrength.color === "orange"
                                  ? "#fd7e14"
                                  : "#dc3545",
                        }}
                      >
                        {t(`auth.resetPassword.strength.${passwordStrength.strength}`)}
                      </span>
                    </div>

                    <Progress
                      value={passwordStrength.percentage}
                      variant={
                        passwordStrength.color === "red"
                          ? "danger"
                          : passwordStrength.color === "orange"
                            ? "warning"
                            : passwordStrength.color === "blue"
                              ? "info"
                              : "success"
                      }
                      size="sm"
                      style={{ marginBottom: "1rem" }}
                    />

                    <div
                      style={{
                        background: "#f8f9fa",
                        border: "1px solid #dee2e6",
                        borderRadius: "6px",
                        padding: "1rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          marginBottom: "0.75rem",
                          color: "#495057",
                        }}
                      >
                        {t("auth.resetPassword.criteria.title")}
                      </div>

                      <List isPlain>
                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            color: passwordStrength.criteria.length ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.length ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.length")}
                        </ListItem>

                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            color: passwordStrength.criteria.lowercase ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.lowercase ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.lowercase")}
                        </ListItem>

                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            color: passwordStrength.criteria.uppercase ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.uppercase ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.uppercase")}
                        </ListItem>

                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            color: passwordStrength.criteria.numbers ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.numbers ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.numbers")}
                        </ListItem>

                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            color: passwordStrength.criteria.symbols ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.symbols ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.symbols")}
                        </ListItem>

                        <ListItem
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: passwordStrength.criteria.noCommon ? "#28a745" : "#6c757d",
                          }}
                        >
                          {passwordStrength.criteria.noCommon ? (
                            <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                          ) : (
                            <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                          )}
                          {t("auth.resetPassword.criteria.noCommon")}
                        </ListItem>
                      </List>
                    </div>
                  </div>
                )}
              </FormGroup>

              <FormGroup
                label={t("auth.resetPassword.confirmPassword")}
                isRequired
                fieldId="confirmPassword"
                validated={confirmPassword && !passwordsMatch ? "error" : "default"}
                helperTextInvalid={t("auth.resetPassword.passwordMismatch")}
                className="login-form-group"
              >
                <TextInput
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(_event, value) => setConfirmPassword(value)}
                  placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                  isRequired
                  validated={confirmPassword && !passwordsMatch ? "error" : "default"}
                  className="login-input"
                />

                {confirmPassword && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "0.85rem",
                    }}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckIcon style={{ color: "#28a745", marginRight: "0.5rem" }} />
                        <span style={{ color: "#28a745" }}>
                          {t("auth.resetPassword.passwordsMatch")}
                        </span>
                      </>
                    ) : (
                      <>
                        <TimesIcon style={{ color: "#dc3545", marginRight: "0.5rem" }} />
                        <span style={{ color: "#dc3545" }}>
                          {t("auth.resetPassword.passwordMismatch")}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </FormGroup>

              {error && (
                <Alert variant="danger" title={t("common.error")} style={{ marginBottom: "1rem" }}>
                  {error}
                </Alert>
              )}

              <div className="login-actions">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  isDisabled={!canSubmit || submitting}
                  className="login-button"
                >
                  {submitting ? t("auth.resetPassword.resetting") : t("auth.resetPassword.submit")}
                </Button>
              </div>
            </Form>

            <div className="login-footer">
              <p>
                <Button
                  variant="link"
                  onClick={() => navigate("/pages/connexion")}
                  style={{ padding: 0, fontSize: "inherit" }}
                >
                  {t("auth.forgotPassword.backToLogin")}
                </Button>
              </p>
            </div>
          </div>
        </Bullseye>
      </PageSection>
    </div>
  );
};

// Export with HOCs
export default withErrorBoundary(
  withTracking(ResetPasswordPage, {
    componentName: "ResetPasswordPage",
  }),
  {
    componentName: "ResetPasswordPage",
  },
);
