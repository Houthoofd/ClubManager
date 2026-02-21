import React, { useEffect, useState } from "react";
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Label,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
} from "@patternfly/react-core";
import { CheckCircleIcon, TimesCircleIcon, ExclamationTriangleIcon } from "@patternfly/react-icons";
import { env } from "@/core/config";

interface StartupHealthCheckProps {
  onHealthStatus?: (isHealthy: boolean) => void;
}

const StartupHealthCheck: React.FC<StartupHealthCheckProps> = ({ onHealthStatus }) => {
  const [healthStatus, setHealthStatus] = useState<{
    frontend: {
      stripe_key: boolean;
      api_url: boolean;
      config_loaded: boolean;
    };
    backend?: {
      reachable: boolean;
      stripe_diagnostic?: any;
    };
    overall: boolean;
    loading: boolean;
    error?: string;
  }>({
    frontend: {
      stripe_key: false,
      api_url: false,
      config_loaded: false,
    },
    overall: false,
    loading: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log("🔍 [StartupHealthCheck] Vérification santé au démarrage...");

        // 1. Vérifier la configuration frontend
        const frontendHealth = {
          stripe_key: !!(
            env.stripe.publicKey &&
            env.stripe.publicKey.length > 50 &&
            env.stripe.publicKey.startsWith("pk_")
          ),
          api_url: !!(env.api.baseUrl && env.api.baseUrl.includes("http")),
          config_loaded: !!(env.stripe.publicKey || env.api.baseUrl),
        };

        console.log("✅ [StartupHealthCheck] Frontend:", frontendHealth);

        // 2. Tester la connectivité backend
        let backendHealth = {
          reachable: false,
          stripe_diagnostic: null,
        };

        try {
          // Test de base - endpoint health
          const healthResponse = await fetch(`${env.api.baseUrl}/health/database`, {
            method: "GET",
            credentials: "include",
          });

          backendHealth.reachable = healthResponse.ok;

          // Test diagnostic Stripe si backend accessible
          if (backendHealth.reachable) {
            try {
              const token =
                localStorage.getItem("token") ||
                JSON.parse(localStorage.getItem("userData") || "{}").token;

              if (token) {
                const stripeResponse = await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/paiements/stripe/diagnostic`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                  },
                );

                if (stripeResponse.ok) {
                  backendHealth.stripe_diagnostic = await stripeResponse.json();
                }
              }
            } catch (stripeError) {
              console.warn(
                "⚠️ [StartupHealthCheck] Diagnostic Stripe non disponible:",
                stripeError,
              );
            }
          }
        } catch (backendError) {
          console.warn("⚠️ [StartupHealthCheck] Backend non accessible:", backendError);
        }

        // 3. Évaluation globale
        const overallHealth =
          frontendHealth.stripe_key &&
          frontendHealth.api_url &&
          backendHealth.reachable &&
          (!backendHealth.stripe_diagnostic || backendHealth.stripe_diagnostic.overall_health);

        const newHealthStatus = {
          frontend: frontendHealth,
          backend: backendHealth,
          overall: overallHealth,
          loading: false,
        };

        setHealthStatus(newHealthStatus);
        onHealthStatus?.(overallHealth);

        console.log("🏥 [StartupHealthCheck] Santé globale:", {
          overall: overallHealth,
          frontend: frontendHealth,
          backend: backendHealth,
        });
      } catch (error: any) {
        console.error("❌ [StartupHealthCheck] Erreur vérification santé:", error);
        setHealthStatus({
          frontend: {
            stripe_key: false,
            api_url: false,
            config_loaded: false,
          },
          overall: false,
          loading: false,
          error: error.message,
        });
        onHealthStatus?.(false);
      }
    };

    checkHealth();
  }, [onHealthStatus]);

  if (healthStatus.loading) {
    return (
      <Card>
        <CardBody>
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <Spinner size="lg" />
            <div style={{ marginTop: "1rem" }}>Vérification de la santé du système...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (healthStatus.error) {
    return (
      <Alert variant="danger" title="Erreur de vérification">
        <p>{healthStatus.error}</p>
      </Alert>
    );
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <Label color="green" icon={<CheckCircleIcon />}>
        OK
      </Label>
    ) : (
      <Label color="red" icon={<TimesCircleIcon />}>
        KO
      </Label>
    );
  };

  return (
    <Card>
      <CardTitle>🏥 Santé du Système au Démarrage</CardTitle>
      <CardBody>
        <div style={{ marginBottom: "1rem" }}>
          {healthStatus.overall ? (
            <Label color="green" icon={<CheckCircleIcon />} size="lg">
              SYSTÈME OPÉRATIONNEL
            </Label>
          ) : (
            <Label color="red" icon={<ExclamationTriangleIcon />} size="lg">
              PROBLÈME DÉTECTÉ
            </Label>
          )}
        </div>

        <DescriptionList>
          {/* Frontend */}
          <DescriptionListGroup>
            <DescriptionListTerm>🌐 Configuration Frontend</DescriptionListTerm>
            <DescriptionListDescription>
              <div>
                <strong>Clé Stripe:</strong> {getStatusIcon(healthStatus.frontend.stripe_key)}
                <div style={{ fontSize: "12px", marginTop: "2px" }}>
                  {env.stripe.publicKey.substring(0, 25)}...
                </div>
              </div>
              <div style={{ marginTop: "5px" }}>
                <strong>URL API:</strong> {getStatusIcon(healthStatus.frontend.api_url)}
                <div style={{ fontSize: "12px", marginTop: "2px" }}>
                  {import.meta.env.VITE_API_BASE_URL}
                </div>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Backend */}
          <DescriptionListGroup>
            <DescriptionListTerm>🔧 Backend</DescriptionListTerm>
            <DescriptionListDescription>
              <div>
                <strong>Accessibilité:</strong>{" "}
                {getStatusIcon(healthStatus.backend?.reachable || false)}
              </div>
              {healthStatus.backend?.stripe_diagnostic && (
                <div style={{ marginTop: "5px" }}>
                  <strong>Stripe Backend:</strong>{" "}
                  {getStatusIcon(healthStatus.backend.stripe_diagnostic.overall_health)}
                  <div style={{ fontSize: "12px", marginTop: "2px" }}>
                    Status: {healthStatus.backend.stripe_diagnostic.status}
                  </div>
                </div>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Compatibilité */}
          {healthStatus.backend?.stripe_diagnostic && (
            <DescriptionListGroup>
              <DescriptionListTerm>🔗 Compatibilité Stripe</DescriptionListTerm>
              <DescriptionListDescription>
                <div>
                  <strong>Comptes:</strong>{" "}
                  {getStatusIcon(
                    healthStatus.backend.stripe_diagnostic.diagnostic?.compatibility
                      ?.account_match || false,
                  )}
                </div>
                <div style={{ marginTop: "5px" }}>
                  <strong>Types:</strong>{" "}
                  {getStatusIcon(
                    healthStatus.backend.stripe_diagnostic.diagnostic?.compatibility
                      ?.both_test_mode ||
                      healthStatus.backend.stripe_diagnostic.diagnostic?.compatibility
                        ?.both_live_mode ||
                      false,
                  )}
                </div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>

        {/* Recommandations */}
        {!healthStatus.overall && (
          <Alert variant="warning" title="Actions recommandées" style={{ marginTop: "1rem" }}>
            <ul>
              {!healthStatus.frontend.stripe_key && (
                <li>Vérifiez la variable VITE_STRIPE_PUBLIC_KEY dans votre configuration</li>
              )}
              {!healthStatus.frontend.api_url && <li>Vérifiez la variable VITE_API_BASE_URL</li>}
              {!healthStatus.backend?.reachable && (
                <li>Vérifiez que le serveur backend est démarré</li>
              )}
              {healthStatus.backend?.stripe_diagnostic &&
                !healthStatus.backend.stripe_diagnostic.overall_health && (
                  <li>Consultez le diagnostic Stripe pour plus de détails</li>
                )}
            </ul>
          </Alert>
        )}

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
          >
            <strong>Debug Info:</strong>
            <br />
            Mode: {import.meta.env.MODE}
            <br />
            Timestamp: {new Date().toISOString()}
            <br />
            Health Check Version: 1.0
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default StartupHealthCheck;
