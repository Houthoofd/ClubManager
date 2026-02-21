import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  PageSection,
  Bullseye,
} from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { apiUrl } from "@/shared/utils/apiUrl";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useLoadingWrapper } from "@/core/hocs/withLoading";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTypedTranslation();
  const navigate = useNavigate();
  const { trackEvent, trackError } = useTracking();
  const { wrapAsync, isLoading } = useLoadingWrapper();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent({
      category: "Auth",
      action: "View Forgot Password Page",
      label: "User accessed forgot password page",
    });
  }, [trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    trackEvent({
      category: "Auth",
      action: "Submit Forgot Password",
      label: `Email: ${email}`,
    });

    await wrapAsync(async () => {
      setError("");
      setMessage("");

      try {
        const response = await fetch(apiUrl("auth/forgot-password"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || t("auth.forgotPassword.success"));
          setEmailSent(true);

          trackEvent({
            category: "Auth",
            action: "Forgot Password Success",
            label: `Email sent to: ${email}`,
          });
        } else {
          const errorMsg = data.error || t("auth.forgotPassword.error");
          setError(errorMsg);

          trackError(new Error(`Forgot password failed: ${errorMsg}`), {
            context: "ForgotPasswordPage",
            email,
            statusCode: response.status,
          });
        }
      } catch (err) {
        const errorMsg = t("auth.forgotPassword.connectionError");
        setError(errorMsg);

        trackError(err as Error, {
          context: "ForgotPasswordPage - Network Error",
          email,
        });
      }
    });
  };

  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBackToLogin = () => {
    trackEvent({
      category: "Auth",
      action: "Click Back to Login",
      label: "From forgot password page",
    });
    navigate("/pages/connexion");
  };

  return (
    <div className="login-page">
      <div className="login-background-decoration" />

      <PageHeader
        title={t("auth.forgotPassword.title")}
        subtitle={t("auth.forgotPassword.subtitle")}
        variant="login"
      />

      <PageSection style={{ flex: 1, display: "flex", alignItems: "center", padding: "2rem" }}>
        <Bullseye style={{ width: "100%" }}>
          <div className="login-container">
            {!emailSent ? (
              <Form onSubmit={handleSubmit} className="login-form">
                <FormGroup
                  label={t("auth.forgotPassword.emailLabel")}
                  isRequired
                  fieldId="email"
                  validated={email && !isEmailValid(email) ? "error" : "default"}
                  helperTextInvalid={t("auth.forgotPassword.emailInvalid")}
                  className="login-form-group"
                >
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(_event, value) => setEmail(value)}
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    isRequired
                    validated={email && !isEmailValid(email) ? "error" : "default"}
                    className="login-input"
                  />
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
                    isLoading={isLoading}
                    isDisabled={!email || !isEmailValid(email) || isLoading}
                    className="login-button"
                  >
                    {isLoading
                      ? t("auth.forgotPassword.sending")
                      : t("auth.forgotPassword.sendLink")}
                  </Button>
                </div>
              </Form>
            ) : (
              <div className="login-form" style={{ textAlign: "center" }}>
                <Alert variant="success" title={t("auth.forgotPassword.emailSent")} style={{ marginBottom: "1rem" }}>
                  {message}
                </Alert>
                <p style={{ marginBottom: "1rem", color: "#6c757d" }}>
                  {t("auth.forgotPassword.checkEmail")}
                </p>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "1rem" }}>
                  {t("auth.forgotPassword.linkExpiry")}
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                  {t("auth.forgotPassword.checkSpam")}
                </p>
              </div>
            )}

            <div className="login-footer">
              <p>
                {t("auth.forgotPassword.rememberPassword")}{" "}
                <Button
                  variant="link"
                  onClick={handleBackToLogin}
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
  withTracking(ForgotPasswordPage, {
    componentName: "ForgotPasswordPage",
  }),
  {
    componentName: "ForgotPasswordPage",
  }
);
