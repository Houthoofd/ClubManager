import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Page,
  PageSection,
  Title,
  Card,
  CardBody,
  Button,
  Alert,
  Flex,
  FlexItem,
  Badge,
  Spinner,
  Bullseye,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ShieldAltIcon,
} from "@patternfly/react-icons";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/shared/components/forms/PaymentForm";
import { apiUrl } from "@/shared/utils/apiUrl";
import { env } from "@/core/config";

// AJOUTÉ: Import des hooks de paiement
import {
  useEcheanceDetails,
  useCreatePaymentIntentSecurise,
  useConfirmPayment,
  obtenirIdUtilisateur,
} from "@/features/shop/hooks/usePaiements";

// Charger Stripe avec votre clé publique
const stripePromise = loadStripe(env.stripe.publicKey);

const PaiementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ====================== TOUS LES HOOKS EN PREMIER ======================
  // États locaux
  const [loading, setLoading] = useState(true);
  const [commandeData, setCommandeData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"echeance" | "commande">("echeance");
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(true);
  const [userIdMismatch, setUserIdMismatch] = useState<boolean>(false);
  const [connectedUserId, setConnectedUserId] = useState<number | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [securityModalData, setSecurityModalData] = useState<{
    userConnected: number;
    userTarget: number;
    echeanceId?: string;
    commandeId?: string;
  } | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Paramètres URL (pas des hooks, juste des getters)
  const echeanceId = searchParams.get("echeance");
  const commandeId = searchParams.get("commande");
  const userId = searchParams.get("userId") || searchParams.get("user");
  const token = searchParams.get("token");

  // Conversions (calculs simples)
  const userIdNumber = userId ? parseInt(userId) : null;
  const echeanceIdNumber = echeanceId ? parseInt(echeanceId) : null;

  // HOOKS DE DONNÉES - TOUJOURS APPELÉS INCONDITIONNELLEMENT
  const {
    data: echeanceData,
    isLoading: echeanceLoading,
    error: echeanceError,
    isError: echeanceIsError,
  } = useEcheanceDetails(
    echeanceId && paymentType === "echeance" ? echeanceId : null,
    userIdNumber,
  );

  const createPaymentIntentEcheance = useCreatePaymentIntentSecurise(
    echeanceId && paymentType === "echeance" ? echeanceId : "",
    echeanceData?.montant || 0,
    userIdNumber || 0,
  );

  const confirmPaymentMutation = useConfirmPayment();

  // Configuration Stripe (useMemo)
  const options = useMemo(() => {
    if (!clientSecret) return {};
    return { clientSecret };
  }, [clientSecret]);

  // ====================== TOUS LES useEffect ======================
  // 1. Détection du type de paiement
  useEffect(() => {
    console.log("🎯 [PaiementPage] Détection type de paiement:", {
      commandeId,
      echeanceId,
    });

    if (commandeId && commandeId !== "null" && !echeanceId) {
      setPaymentType("commande");
    } else if (echeanceId && echeanceId !== "null" && !commandeId) {
      setPaymentType("echeance");
    } else if (commandeId && commandeId !== "null") {
      setPaymentType("commande");
    } else if (echeanceId && echeanceId !== "null") {
      setPaymentType("echeance");
    } else {
      setPaymentType("echeance");
    }
  }, [commandeId, echeanceId]);

  // 2. Vérification de l'identité utilisateur
  useEffect(() => {
    const verifierIdentiteUtilisateur = () => {
      try {
        const userIdFromSession = obtenirIdUtilisateur();
        setConnectedUserId(userIdFromSession);

        if (!userIdFromSession) {
          setSecurityError("Session expirée. Veuillez vous reconnecter.");
          setLoading(false);
          setTimeout(() => navigate("/pages/connexion"), 2000);
          return;
        }

        if (userId) {
          const userIdFromUrl = parseInt(userId);
          if (userIdFromUrl !== userIdFromSession) {
            setLoading(false);
            setIsVerifyingAccess(false);
            setSecurityModalData({
              userConnected: userIdFromSession,
              userTarget: userIdFromUrl,
              echeanceId: echeanceId || undefined,
              commandeId: commandeId || undefined,
            });
            setShowSecurityModal(true);
            setUserIdMismatch(true);
            return;
          }
        }
      } catch (error) {
        setLoading(false);
        setSecurityError("Erreur de vérification d'identité. Veuillez vous reconnecter.");
        setTimeout(() => navigate("/pages/connexion"), 2000);
      }
    };

    verifierIdentiteUtilisateur();
  }, [userId, navigate, echeanceId, commandeId]);

  // 3. Gestion des données d'échéance
  useEffect(() => {
    if (paymentType === "echeance") {
      if (echeanceIsError && echeanceError) {
        setError(`Erreur de chargement de l'échéance: ${echeanceError.message}`);
        setLoading(false);
        return;
      }

      if (!echeanceLoading && echeanceData) {
        setLoading(false);
      }

      if (!echeanceLoading && !echeanceData && !echeanceIsError && echeanceId && userIdNumber) {
        setError("Impossible de charger l'échéance - paramètres manquants");
        setLoading(false);
      }
    } else {
      if (paymentType === "commande" && commandeId && userIdNumber && connectedUserId) {
        setLoading(false);
      }
    }
  }, [
    paymentType,
    echeanceData,
    echeanceLoading,
    echeanceError,
    echeanceIsError,
    echeanceId,
    userIdNumber,
    commandeId,
    connectedUserId,
  ]);

  // 4. Création du PaymentIntent
  useEffect(() => {
    const creerPaymentIntent = async () => {
      if (
        userIdMismatch ||
        securityError ||
        showSecurityModal ||
        !connectedUserId ||
        !userIdNumber
      ) {
        return;
      }

      try {
        if (paymentType === "echeance" && echeanceData && !clientSecret) {
          const result = await createPaymentIntentEcheance.mutateAsync({
            currency: "eur",
            description: `Paiement échéance #${echeanceId} - ${echeanceData.description || "Cotisation"}`,
          });

          setClientSecret(result.client_secret);
          setPaymentIntentId(result.payment_intent_id);
        } else if (paymentType === "commande" && commandeId && !clientSecret) {
          console.log("🛒 [PaiementPage] Création PaymentIntent pour commande ID:", commandeId);

          let token =
            localStorage.getItem("token") ||
            JSON.parse(localStorage.getItem("userData") || "{}").token ||
            localStorage.getItem("authToken");

          if (!token) {
            throw new Error("Token d'authentification manquant - reconnectez-vous");
          }

          setLoading(false);

          // CORRIGÉ: Valider que commandeId est un nombre valide
          const commandeIdNumber = parseInt(commandeId);
          if (isNaN(commandeIdNumber) || commandeIdNumber <= 0) {
            throw new Error(`ID de commande invalide: ${commandeId}`);
          }

          // CORRIGÉ: Envoyer l'ID de commande comme nombre avec validation
          const requestBody = {
            commande: commandeIdNumber, // ID de commande existante
            currency: "eur",
            description: `Paiement commande #${commandeIdNumber}`,
          };

          console.log("📤 [PaiementPage] Données envoyées (corrigées):", requestBody);

          const response = await fetch(apiUrl("paiements/stripe/create-payment-intent-commande"), {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
          });

          console.log("📡 [PaiementPage] Réponse status:", response.status);

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (parseError) {
              errorData = {
                error: "Erreur de parsing de la réponse",
                status: response.status,
                statusText: response.statusText,
              };
            }

            console.error("❌ [PaiementPage] Erreur API commande détaillée:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              requestBody,
              commandeId,
              commandeIdNumber,
              url: apiUrl("paiements/stripe/create-payment-intent-commande"),
            });

            // CORRIGÉ: Messages d'erreur plus spécifiques
            if (response.status === 401) {
              throw new Error("Session expirée - veuillez vous reconnecter");
            } else if (response.status === 404) {
              throw new Error(
                `Commande #${commandeIdNumber} non trouvée - elle a peut-être été supprimée`,
              );
            } else if (response.status === 403) {
              throw new Error("Cette commande ne vous appartient pas");
            } else if (response.status === 400) {
              const errorMsg = errorData?.error || "Données de commande invalides";
              if (errorMsg.includes("Format de commande non reconnu")) {
                throw new Error(
                  `Format de commande incorrect. ID envoyé: ${commandeIdNumber} (type: ${typeof commandeIdNumber})`,
                );
              } else if (errorMsg.includes("déjà traitée") || errorMsg.includes("déjà payée")) {
                throw new Error(`Cette commande a déjà été payée ou traitée`);
              }
              throw new Error(errorMsg);
            } else {
              throw new Error(
                `Erreur serveur (${response.status}): ${errorData?.error || response.statusText}`,
              );
            }
          }

          const paymentIntentData = await response.json();
          console.log("✅ [PaiementPage] PaymentIntent commande créé:", paymentIntentData);

          if (!paymentIntentData.client_secret) {
            console.error(
              "❌ [PaiementPage] client_secret manquant dans la réponse:",
              paymentIntentData,
            );
            throw new Error("client_secret manquant dans la réponse du serveur");
          }

          setClientSecret(paymentIntentData.client_secret);
          setPaymentIntentId(paymentIntentData.payment_intent_id);

          // CORRIGÉ: Utiliser les données de commande de la réponse avec validation
          if (paymentIntentData.commande && paymentIntentData.commande.id) {
            setCommandeData({
              id: paymentIntentData.commande.id,
              total: paymentIntentData.commande.total,
              utilisateur_id: paymentIntentData.commande.utilisateur_id,
              statut: paymentIntentData.commande.statut,
              numero_commande: `CMD-${paymentIntentData.commande.id}`,
            });
            console.log(
              "📦 [PaiementPage] Données commande configurées depuis réponse:",
              paymentIntentData.commande,
            );
          } else {
            // Fallback avec les données de base
            setCommandeData({
              id: paymentIntentData.commande_id || commandeIdNumber,
              total: paymentIntentData.amount / 100,
              utilisateur_id: userIdNumber,
              statut: "en_attente",
              numero_commande: `CMD-${commandeIdNumber}`,
            });
            console.log("📦 [PaiementPage] Données commande configurées en fallback");
          }

          setLoading(false);
        }
      } catch (paymentIntentError: any) {
        console.error("❌ [PaiementPage] Erreur création PaymentIntent:", paymentIntentError);
        setError(`Erreur d'initialisation du paiement: ${paymentIntentError.message}`);
        setLoading(false);
      }
    };

    const shouldCreatePaymentIntent =
      paymentType &&
      connectedUserId &&
      userIdNumber &&
      !userIdMismatch &&
      !showSecurityModal &&
      !clientSecret &&
      ((paymentType === "echeance" && echeanceData) || (paymentType === "commande" && commandeId));

    if (shouldCreatePaymentIntent) {
      creerPaymentIntent();
    } else if (
      paymentType === "commande" &&
      commandeId &&
      connectedUserId &&
      userIdNumber &&
      !clientSecret
    ) {
      creerPaymentIntent();
    }
  }, [
    paymentType,
    echeanceData,
    commandeId,
    connectedUserId,
    userIdNumber,
    userIdMismatch,
    showSecurityModal,
    clientSecret,
    createPaymentIntentEcheance,
    echeanceId,
  ]);

  // ====================== FONCTIONS HANDLERS ======================
  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      let amount = 0;

      if (paymentType === "echeance" && echeanceData) {
        amount = echeanceData.montant;
      } else if (paymentType === "commande" && commandeData) {
        amount = commandeData.total;
      } else {
        amount = paymentResult?.amount || paymentResult?.paymentIntent?.amount / 100 || 0;
      }

      if (paymentType === "echeance") {
        const confirmData = {
          paymentIntentId: paymentResult.paymentIntent.id,
          echeanceId: echeanceId!,
          userId: userIdNumber!,
          amount: amount,
        };

        const result = await confirmPaymentMutation.mutateAsync(confirmData);
        setConfirmationResult(result);
        setPaymentSuccess(true);
      } else if (paymentType === "commande") {
        const token =
          localStorage.getItem("token") ||
          JSON.parse(localStorage.getItem("userData") || "{}").token;

        if (!token) {
          throw new Error("Token manquant pour la confirmation");
        }

        const realCommandeId = commandeData?.id || parseInt(commandeId!);

        const confirmData = {
          paymentIntentId: paymentResult.paymentIntent.id,
          commandeId: realCommandeId,
          userId: userIdNumber!,
          amount: amount,
        };

        const response = await fetch(apiUrl("paiements/confirmation/confirm-payment-commande"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(confirmData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 404) {
            throw new Error("Route de confirmation non trouvée - module confirmation non chargé");
          }
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setConfirmationResult(result);
        setPaymentSuccess(true);
      }

      setTimeout(() => {
        const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
        const isAdmin =
          currentUserData?.status === "administrateur" ||
          currentUserData?.status === "super-administrateur";

        if (paymentType === "commande") {
          navigate("/pages/magasin/magasin?payment_success=true");
        } else {
          if (isAdmin && currentUserData?.id !== parseInt(userId!)) {
            navigate(`/pages/utilisateurs/consulter/${userId}?tab=2&payment_success=true`);
          } else {
            navigate("/pages/compte?tab=2&success=true");
          }
        }
      }, 3000);
    } catch (error: any) {
      let displayAmount = 0;
      if (paymentType === "echeance" && echeanceData) {
        displayAmount = echeanceData.montant;
      } else if (paymentType === "commande" && commandeData) {
        displayAmount = commandeData.total;
      }

      const errorMessage = `⚠️ Paiement traité mais problème de confirmation
💳 Votre paiement Stripe a été effectué avec succès
📝 Référence : ${paymentResult.paymentIntent.id}
🔧 Erreur : ${error.message}
💡 Type : ${paymentType}
📊 Montant : ${displayAmount}€
🔄 Redirection vers votre espace...`;

      setError(errorMessage);

      setTimeout(() => {
        if (paymentType === "commande") {
          navigate(
            "/pages/magasin/magasin?payment_success=partial&ref=" + paymentResult.paymentIntent.id,
          );
        } else {
          navigate(
            "/pages/compte?tab=2&payment_success=partial&ref=" + paymentResult.paymentIntent.id,
          );
        }
      }, 3000);
    }
  };

  const handlePaymentError = (error: any) => {
    let errorMessage = "Erreur inconnue";

    if (error?.type === "card_error") {
      errorMessage = `Erreur de carte: ${error.message}`;
    } else if (error?.type === "validation_error") {
      errorMessage = `Erreur de validation: ${error.message}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    setError(`Erreur de paiement: ${errorMessage}`);
  };

  // ====================== FONCTIONS UTILITAIRES ======================
  const formatMontant = (montant: number) => {
    if (typeof montant !== "number" || isNaN(montant)) return "0,00 €";
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(montant);
    } catch (e) {
      return `${montant} €`;
    }
  };

  // ====================== VARIABLES CALCULÉES ======================
  const currentData = paymentType === "echeance" ? echeanceData : commandeData;
  const currentId =
    paymentType === "echeance"
      ? echeanceId
      : commandeData?.unique_id || commandeData?.numero_commande || commandeId;
  const currentAmount = paymentType === "echeance" ? currentData?.montant : currentData?.total;
  const currentDescription =
    paymentType === "echeance"
      ? currentData?.description || "Description non disponible"
      : `${currentData?.numero_commande || "Commande magasin"} #${commandeId}`;

  const isLoading =
    loading ||
    (paymentType === "echeance" && echeanceLoading) ||
    createPaymentIntentEcheance.isPending ||
    confirmPaymentMutation.isPending;

  // ====================== RENDERS CONDITIONNELS ======================

  // Modal de sécurité
  if (showSecurityModal && securityModalData) {
    return (
      <Page>
        <PageHeader
          title="⚠️ Accès non autorisé"
          subtitle="Vérification de sécurité"
          variant="danger"
        />
        <PageSection>
          <Alert variant="danger" title="Accès non autorisé">
            <p>Vous essayez d'accéder à un paiement qui ne vous appartient pas.</p>
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="primary"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate("/pages/compte");
                }}
              >
                🏠 Aller à mon compte
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSecurityModal(false);
                  navigate("/pages/connexion");
                }}
                style={{ marginLeft: "1rem" }}
              >
                🔐 Se reconnecter
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Erreur de sécurité ou paramètres manquants
  if (securityError || !userId || userId === "null" || userId === "" || userId === "undefined") {
    return (
      <Page>
        <PageHeader title="Paiement en ligne" subtitle="Erreur d'accès" variant="payment" />
        <PageSection>
          <Alert variant="danger" title="Accès non autorisé">
            <p>
              {securityError || "Impossible de vérifier votre identité. Veuillez vous reconnecter."}
            </p>
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate("/pages/connexion")}
              >
                Se connecter
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Échéance manquante
  if (paymentType === "echeance" && (!echeanceId || echeanceId === "null")) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement de l'échéance"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Échéance introuvable">
            <p>Impossible de charger les détails de l'échéance.</p>
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate("/pages/compte?tab=2")}
              >
                Retour à mon compte
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Commande manquante
  if (paymentType === "commande" && (!commandeId || commandeId === "null")) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement de la commande"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Commande introuvable">
            <p>Impossible de charger les détails de la commande.</p>
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() => navigate("/pages/magasin/magasin")}
              >
                Retour au magasin
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Régularisez votre situation rapidement et en toute sécurité"
          variant="payment"
        />
        <PageSection>
          <Bullseye>
            <div style={{ textAlign: "center" }}>
              <Spinner size="xl" />
              <div style={{ marginTop: "1rem" }}>
                {paymentType === "echeance" && echeanceLoading && "Chargement de l'échéance..."}
                {createPaymentIntentEcheance.isPending && "Initialisation du paiement..."}
                {confirmPaymentMutation.isPending && "Confirmation du paiement..."}
                {!echeanceLoading &&
                  !createPaymentIntentEcheance.isPending &&
                  !confirmPaymentMutation.isPending &&
                  "Chargement des informations de paiement..."}
              </div>
            </div>
          </Bullseye>
        </PageSection>
      </Page>
    );
  }

  // Données manquantes
  if (!currentData) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Erreur de chargement des données"
          variant="payment"
        />
        <PageSection>
          <Alert variant="danger" title="Données manquantes">
            <p>
              Impossible de charger les données de{" "}
              {paymentType === "echeance" ? "l'échéance" : "la commande"}.
            </p>
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="primary"
                icon={<ArrowLeftIcon />}
                onClick={() =>
                  navigate(
                    paymentType === "echeance" ? "/pages/compte?tab=2" : "/pages/magasin/magasin",
                  )
                }
              >
                Retour {paymentType === "echeance" ? "au compte" : "au magasin"}
              </Button>
            </div>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Erreur
  if (error) {
    return (
      <Page>
        <PageHeader
          title="Paiement en ligne"
          subtitle="Information sur le traitement de votre paiement"
          variant="payment"
        />
        <PageSection>
          <Alert
            variant={error.includes("⚠️") ? "warning" : "danger"}
            title={error.includes("⚠️") ? "Information importante" : "Erreur"}
            style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}
          >
            {error}
          </Alert>
          <div style={{ marginTop: "2rem" }}>
            <Button
              variant="primary"
              icon={<ArrowLeftIcon />}
              onClick={() =>
                navigate(
                  paymentType === "echeance" ? "/pages/compte?tab=2" : "/pages/magasin/magasin",
                )
              }
            >
              {paymentType === "echeance" ? "Accéder à mon compte" : "Retour au magasin"}
            </Button>
          </div>
        </PageSection>
      </Page>
    );
  }

  // Succès
  if (paymentSuccess) {
    return (
      <Page>
        <PageHeader
          title="Paiement réussi"
          subtitle="Votre paiement a été traité avec succès"
          variant="success"
        />
        <PageSection>
          <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
            <Card>
              <CardBody>
                <div style={{ padding: "2rem" }}>
                  <CheckCircleIcon
                    size="xl"
                    style={{
                      color: "#28a745",
                      fontSize: "4rem",
                      marginBottom: "1rem",
                    }}
                  />
                  <Title
                    headingLevel="h2"
                    size="xl"
                    style={{ marginBottom: "1rem", color: "#28a745" }}
                  >
                    Paiement confirmé !
                  </Title>
                  <Alert variant="success" title="Succès" style={{ marginBottom: "2rem" }}>
                    <p>
                      Votre paiement de <strong>{formatMontant(currentAmount || 0)}</strong> a été
                      traité avec succès.
                    </p>
                    <p>
                      Référence : <strong>#{currentId}</strong>
                    </p>
                  </Alert>
                  <Button
                    variant="primary"
                    onClick={() =>
                      navigate(
                        paymentType === "echeance"
                          ? "/pages/compte?tab=2&success=true"
                          : "/pages/magasin/magasin?payment_success=true",
                      )
                    }
                  >
                    {paymentType === "echeance" ? "Accéder à mon compte" : "Retour au magasin"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </PageSection>
      </Page>
    );
  }

  // Render principal - Paiement
  return (
    <Page>
      <PageHeader
        title="Paiement en ligne"
        subtitle={`Finalisez votre ${paymentType === "echeance" ? "paiement d'échéance" : "commande"} rapidement et en toute sécurité`}
        variant="payment"
      />
      <PageSection>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {clientSecret && stripePromise ? (
            <Elements options={options} stripe={stripePromise}>
              <PaymentForm
                clientSecret={clientSecret}
                amount={currentAmount}
                description={currentDescription}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                echeanceId={paymentType === "echeance" ? echeanceId : undefined}
                commandeId={paymentType === "commande" ? commandeId : undefined}
                userId={userId}
                returnUrl={`${window.location.origin}/pages/paiement?${paymentType}=${currentId}&userId=${userId}&payment_return=true`}
              />
            </Elements>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Spinner size="lg" />
              <div style={{ marginTop: "1rem" }}>Initialisation du paiement sécurisé...</div>
            </div>
          )}
        </div>
      </PageSection>
    </Page>
  );
};

export default PaiementPage;
