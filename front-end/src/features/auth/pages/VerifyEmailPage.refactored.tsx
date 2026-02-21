import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useTracking } from "@/core/hocs/withTracking";
import { withTracking } from "@/core/hocs/withTracking";
import { withErrorBoundary } from "@/core/hocs/withErrorBoundary";

// ✅ URL API pour ClubManager
const getApiUrl = (endpoint: string) => {
  const baseUrl =
    process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3000";
  return `${baseUrl}/api/${endpoint}`;
};

interface VerificationDetails {
  userId?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  redirect?: string;
}

type VerificationStatus = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const { t } = useTypedTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackEvent, trackError } = useTracking();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<VerificationDetails | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    trackEvent({
      category: "Auth",
      action: "View Verify Email Page",
      label: "User accessed email verification page",
    });

    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const userId = searchParams.get("userId");

      console.log("🔍 [VerifyEmail] Paramètres reçus:", {
        token: token?.substring(0, 8) + "...",
        userId,
      });

      if (!token || !userId) {
        setStatus("error");
        setMessage(t("auth.verifyEmail.missingParams"));
        trackError(new Error("Missing verification parameters"), {
          context: "VerifyEmailPage",
          token: !!token,
          userId: !!userId,
        });
        return;
      }

      try {
        setMessage(t("auth.verifyEmail.verifying"));

        const response = await fetch(
          getApiUrl(`auth/confirm-email?token=${token}&userId=${userId}`),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            redirect: "manual", // Empêcher la redirection automatique
          },
        );

        console.log("🔍 [VerifyEmail] Réponse API:", response.status, response.statusText);

        // Si c'est une redirection (302), c'est un succès
        if (response.status === 302 || response.type === "opaqueredirect") {
          setStatus("success");
          setMessage(t("auth.verifyEmail.success"));
          setDetails({
            userId,
            email: t("auth.verifyEmail.emailVerified"),
            redirect: t("auth.verifyEmail.redirectEnabled"),
          });

          trackEvent({
            category: "Auth",
            action: "Email Verification Success",
            label: `User ID: ${userId}`,
          });

          // Démarrer le countdown
          let timeLeft = 5;
          const countdownInterval = setInterval(() => {
            timeLeft--;
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(countdownInterval);
              navigate("/pages/connexion?verified=true", { replace: true });
            }
          }, 1000);

          return;
        }

        // Sinon, traiter comme une réponse JSON normale
        const data = await response.json();
        console.log("🔍 [VerifyEmail] Données reçues:", data);

        if (data.success || response.ok) {
          setStatus("success");
          setMessage(data.message || t("auth.verifyEmail.success"));
          setDetails(data.data);

          trackEvent({
            category: "Auth",
            action: "Email Verification Success",
            label: `User ID: ${userId}`,
          });
        } else {
          setStatus("error");
          setMessage(data.error || data.message || t("auth.verifyEmail.error"));

          trackError(new Error(`Verification failed: ${data.error || data.message}`), {
            context: "VerifyEmailPage",
            userId,
            statusCode: response.status,
          });
        }
      } catch (error: any) {
        console.error("❌ [VerifyEmail] Erreur:", error);
        setStatus("error");
        setMessage(t("auth.verifyEmail.connectionError"));

        trackError(error, {
          context: "VerifyEmailPage - Network Error",
          userId,
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, t, trackEvent, trackError]);

  const handleRetry = () => {
    trackEvent({
      category: "Auth",
      action: "Retry Verification",
      label: "User clicked retry button",
    });
    setStatus("loading");
    setMessage(t("auth.verifyEmail.retrying"));
    window.location.reload();
  };

  const handleGoToLogin = () => {
    trackEvent({
      category: "Auth",
      action: "Go to Login from Verification",
      label: "User clicked login button",
    });
    navigate("/pages/connexion?verified=true", { replace: true });
  };

  const handleGoToRegister = () => {
    trackEvent({
      category: "Auth",
      action: "Go to Register from Verification",
      label: "User clicked register button",
    });
    navigate("/pages/inscription", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center p-4">
      {/* Animations de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-yellow-300/10 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-lg w-full space-y-8">
        {/* Header avec logo */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
            <span className="text-3xl animate-bounce font-bold text-white">CM</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">ClubManager</h1>
          <p className="text-xl text-indigo-200 font-medium">{t("auth.verifyEmail.title")}</p>
        </div>

        {/* Carte principale */}
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          {status === "loading" && (
            <div className="text-center">
              <div className="relative mx-auto mb-6">
                {/* Spinner personnalisé */}
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                ></div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {t("auth.verifyEmail.verifyingTitle")}
              </h3>
              <p className="text-gray-600 font-medium mb-4">{message}</p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">{t("auth.verifyEmail.validatingToken")}</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              {/* Animation de succès */}
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                {/* Particules de célébration */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-3 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-300"></div>
                <div className="absolute -bottom-2 left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-700"></div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {t("auth.verifyEmail.successTitle")}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">{message}</p>

              {details && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-inner">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center justify-center">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-2">
                      ✔
                    </span>
                    {t("auth.verifyEmail.accountVerified")}
                  </h4>
                  <div className="space-y-2 text-sm text-green-700">
                    {details.prenom && details.nom && (
                      <p>
                        <strong>{t("common.labels.name")}:</strong> {details.prenom} {details.nom}
                      </p>
                    )}
                    {details.email && (
                      <p>
                        <strong>{t("common.labels.email")}:</strong> {details.email}
                      </p>
                    )}
                    {details.userId && (
                      <p>
                        <strong>{t("auth.verifyEmail.userId")}:</strong> {details.userId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Countdown et boutons */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 mb-2">{t("auth.verifyEmail.autoRedirect")}</p>
                  <div className="text-2xl font-bold text-blue-600">{countdown}s</div>
                </div>

                <button
                  onClick={handleGoToLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {t("auth.verifyEmail.loginNow")}
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              {/* Animation d'erreur */}
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {t("auth.verifyEmail.errorTitle")}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">{message}</p>

              {/* Conseils d'aide */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-inner">
                <h4 className="font-bold text-amber-800 mb-3">{t("auth.verifyEmail.whatToDo")}</h4>
                <ul className="text-sm text-amber-700 space-y-2 text-left">
                  <li>{t("auth.verifyEmail.help.linkExpired")}</li>
                  <li>{t("auth.verifyEmail.help.correctLink")}</li>
                  <li>{t("auth.verifyEmail.help.checkConnection")}</li>
                  <li>{t("auth.verifyEmail.help.contactAdmin")}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {t("auth.verifyEmail.retry")}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGoToLogin}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-gray-200"
                  >
                    {t("auth.verifyEmail.login")}
                  </button>
                  <button
                    onClick={handleGoToRegister}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-gray-200"
                  >
                    {t("auth.verifyEmail.register")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-indigo-200">{t("auth.verifyEmail.footer.copyright")}</p>
          <p className="text-xs text-indigo-300">{t("auth.verifyEmail.footer.tagline")}</p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-yellow-300 bg-yellow-900/20 px-3 py-1 rounded-full inline-block">
              {t("auth.verifyEmail.footer.devMode")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Export with HOCs
export default withErrorBoundary(
  withTracking(VerifyEmailPage, {
    componentName: "VerifyEmailPage",
  }),
  {
    componentName: "VerifyEmailPage",
  },
);
