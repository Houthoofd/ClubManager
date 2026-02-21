import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardBody,
  Title,
  Button,
  Alert,
  Flex,
  FlexItem,
  Badge,
  Divider,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import {
  EnvelopeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarAltIcon,
  DollarSignIcon, // CORRIGÉ: Utiliser DollarSignIcon au lieu de EuroIcon
} from "@patternfly/react-icons";
import { apiUrl } from "@/shared/utils/apiUrl";
import "@/styles/echeances.css";
import ResultModal from "@/shared/components/common-legacy/modal/ResultModal";

interface EcheancesPaiementProps {
  paiementsEcheances: any[];
  userId?: number;
}

const EcheancesPaiement: React.FC<EcheancesPaiementProps> = ({ paiementsEcheances, userId }) => {
  const location = useLocation();
  const [rappelLoading, setRappelLoading] = useState<{
    [key: number]: boolean;
  }>({});
  // MODIFIÉ: États pour les modals
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  // AJOUTÉ: Déterminer le type de page selon l'URL
  const isConsultationPage = location.pathname.includes("/utilisateurs/consulter/");
  const isComptePage = location.pathname.includes("/compte");

  console.log("🔍 [EcheancesPaiement] Type de page détecté:", {
    pathname: location.pathname,
    isConsultationPage,
    isComptePage,
    userId,
  });

  // AJOUTÉ: Vérifications de sécurité pour éviter l'erreur undefined.length
  console.log("🔍 [EcheancesPaiement] Props reçues:", {
    paiementsEcheances: paiementsEcheances,
    paiementsEcheances_type: typeof paiementsEcheances,
    paiementsEcheances_isArray: Array.isArray(paiementsEcheances),
    paiementsEcheances_length: paiementsEcheances?.length,
    userId: userId,
    location_pathname: location.pathname,
  });

  // AJOUTÉ: Vérification de sécurité critique
  if (!paiementsEcheances) {
    console.warn("⚠️ [EcheancesPaiement] paiementsEcheances est undefined/null");
    return (
      <Alert variant="info" title="Chargement des échéances...">
        <p>Les données des échéances sont en cours de chargement.</p>
      </Alert>
    );
  }

  if (!Array.isArray(paiementsEcheances)) {
    console.error("❌ [EcheancesPaiement] paiementsEcheances n'est pas un tableau:", {
      type: typeof paiementsEcheances,
      value: paiementsEcheances,
    });
    return (
      <Alert variant="danger" title="Erreur de données">
        <p>Les données des échéances ne sont pas dans le format attendu.</p>
      </Alert>
    );
  }

  // Fonction pour envoyer un rappel de paiement
  // MODIFIÉ: Fonction pour envoyer un rappel avec le bon format
  const handleEnvoyerRappel = async (echeanceId: number, userId: number) => {
    setRappelLoading((prev) => ({ ...prev, [echeanceId]: true }));

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        JSON.parse(localStorage.getItem("userData") || "{}").token;

      // Trouver les détails de l'échéance
      const echeance = paiementsEcheances.find((e) => e.id === echeanceId);

      console.log("📧 [EcheancesPaiement] Envoi rappel pour:", {
        echeanceId,
        userId,
        montant: echeance?.montant,
        dateEcheance: echeance?.date_echeance,
      });

      // CORRIGÉ: Utiliser le nouveau format avec echeanceIds en tableau
      const requestBody = {
        echeanceIds: [echeanceId], // Format attendu par le serveur
        messagePersonnalise: "",
      };

      console.log("📤 [EcheancesPaiement] Envoi requête avec:", requestBody);

      const response = await fetch(apiUrl("messages/envoyer-rappel"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Réponse non-JSON reçue:", textResponse);
        throw new Error("Réponse serveur inattendue (non-JSON)");
      }

      const data = await response.json();
      console.log("📨 [EcheancesPaiement] Réponse serveur:", data);

      if (response.ok && data.success) {
        console.log("✅ Rappel envoyé avec succès:", data);

        // MODIFIÉ: Construire le message de succès pour la modal
        let successMessage = "Le rappel de paiement a été envoyé avec succès !";

        if (data.data?.emailEnvoye) {
          if (data.data.emailEnvoye.success) {
            successMessage += `\n\n📧 Email envoyé à : ${data.data.emailEnvoye.email}`;
            if (data.data.emailEnvoye.messageId) {
              successMessage += `\n🆔 ID du message : ${data.data.emailEnvoye.messageId}`;
            }
            successMessage += `\n💰 Montant de l'échéance : ${echeance?.montant ? `${echeance.montant}€` : "N/A"}`;
            successMessage += `\n📅 Date d'échéance : ${echeance?.date_echeance ? formatDate(echeance.date_echeance) : "N/A"}`;
          } else {
            successMessage += `\n\n⚠️ Problème lors de l'envoi de l'email : ${data.data.emailEnvoye.error}`;
          }
        } else {
          successMessage += "\n\n⚠️ Aucune adresse email configurée pour cet utilisateur";
        }

        // AJOUTÉ: Afficher la modal de succès
        setModalTitle("Rappel de paiement envoyé");
        setModalMessage(successMessage);
        setModalSuccess(true);
        setShowResultModal(true);
      } else {
        console.error("❌ Erreur serveur:", data);
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("❌ Erreur envoi rappel:", error);

      let errorMessage = "Erreur lors de l'envoi du rappel.";
      let errorTitle = "Erreur d'envoi";

      if (error.message.includes("403") || error.message.includes("Permissions")) {
        errorTitle = "Permissions insuffisantes";
        errorMessage =
          "Vous n'avez pas les permissions nécessaires pour envoyer des rappels de paiement.";
      } else if (error.message.includes("404")) {
        errorTitle = "Service non disponible";
        errorMessage =
          "Le service de rappel de paiement n'est pas disponible actuellement. Veuillez réessayer plus tard.";
      } else if (error.message.includes("non-JSON")) {
        errorTitle = "Erreur de communication";
        errorMessage =
          "Erreur de communication avec le serveur. Vérifiez votre connexion internet et réessayez.";
      } else if (error.message) {
        errorTitle = "Erreur du serveur";
        errorMessage = error.message;
      }

      // AJOUTÉ: Afficher la modal d'erreur
      setModalTitle(errorTitle);
      setModalMessage(errorMessage);
      setModalSuccess(false);
      setShowResultModal(true);
    } finally {
      setRappelLoading((prev) => ({ ...prev, [echeanceId]: false }));
    }
  };

  // MODIFIÉ: Fonction pour rediriger vers le paiement AVEC userId
  const handleAllerPaiement = (echeanceId: number) => {
    const userIdToUse =
      userId ||
      paiementsEcheances.find((e) => e?.id === echeanceId)?.utilisateur_id ||
      JSON.parse(localStorage.getItem("userData") || "{}")?.id;

    console.log(`🔗 [EcheancesPaiement] Génération URL paiement:`, {
      echeanceId,
      userId: userIdToUse,
      userIdProp: userId,
      fromEcheance: paiementsEcheances.find((e) => e?.id === echeanceId)?.utilisateur_id,
    });

    if (userIdToUse) {
      const urlPaiement = `/pages/paiement?echeance=${echeanceId}&userId=${userIdToUse}`;
      console.log(`✅ [EcheancesPaiement] Redirection vers: ${urlPaiement}`);
      window.location.href = urlPaiement;
    } else {
      console.error(`❌ [EcheancesPaiement] Aucun userId trouvé pour l'échéance ${echeanceId}`);
      window.location.href = `/pages/paiement?echeance=${echeanceId}`;
    }
  };

  // Fonction pour déterminer si un paiement est échu
  const isPaiementEchu = (dateEcheance: string) => {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    return echeance < today;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non définie";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "Date invalide";
    }
  };

  const formatMontant = (montant: number) => {
    if (typeof montant !== "number" || isNaN(montant)) return "0,00 €";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(montant);
  };

  // MODIFIÉ: Vérification de sécurité avant d'accéder à .length
  if (paiementsEcheances.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <CreditCardIcon style={{ fontSize: "3rem", color: "#6c757d", marginBottom: "1rem" }} />
        <Title headingLevel="h3" size="lg" style={{ color: "#6c757d", marginBottom: "0.5rem" }}>
          Aucune échéance
        </Title>
        <p style={{ color: "#6c757d" }}>Vous n'avez actuellement aucune échéance de paiement.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <Title
        headingLevel="h2"
        size="xl"
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <CreditCardIcon style={{ color: "#0066cc" }} />
        {isConsultationPage ? "Échéances de paiement" : "Mes échéances de paiement"}
      </Title>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {paiementsEcheances.map((echeance, index) => {
          if (!echeance || typeof echeance !== "object") {
            console.warn(`⚠️ [EcheancesPaiement] Échéance invalide à l'index ${index}:`, echeance);
            return null;
          }

          const isPayee = echeance.statut?.toLowerCase() === "payé";
          const isEchu = isPaiementEchu(echeance.date_echeance);

          // CORRIGÉ: Fonction pour obtenir le style selon le statut
          const getStatutStyle = (statut: string) => {
            switch (statut?.toLowerCase()) {
              case "payé":
                return {
                  cardStyle: {
                    background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
                    border: "2px solid #28a745",
                    boxShadow: "0 8px 25px rgba(40, 167, 69, 0.15)",
                    position: "relative" as const,
                    overflow: "hidden" as const,
                    transition: "all 0.3s ease",
                  },
                  badgeVariant: "success" as const,
                  icon: <CheckCircleIcon style={{ color: "#28a745", fontSize: "1.2rem" }} />,
                  badgeText: "✅ Payé",
                  headerStyle: {
                    background: "rgba(40, 167, 69, 0.1)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                  },
                };
              case "en attente":
                return {
                  cardStyle: {
                    background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
                    border: "2px solid #ffc107",
                    boxShadow: "0 4px 15px rgba(255, 193, 7, 0.2)",
                  },
                  badgeVariant: "warning" as const,
                  icon: <ClockIcon style={{ color: "#ffc107", fontSize: "1.2rem" }} />,
                  badgeText: "⏳ En attente",
                  headerStyle: {
                    background: "rgba(255, 193, 7, 0.1)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                  },
                };
              case "échu":
                return {
                  cardStyle: {
                    background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
                    border: "2px solid #dc3545",
                    boxShadow: "0 4px 15px rgba(220, 53, 69, 0.2)",
                  },
                  badgeVariant: "danger" as const,
                  icon: (
                    <ExclamationTriangleIcon style={{ color: "#dc3545", fontSize: "1.2rem" }} />
                  ),
                  badgeText: "❌ Échu",
                  headerStyle: {
                    background: "rgba(220, 53, 69, 0.1)",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginBottom: "1rem",
                  },
                };
              default:
                return {
                  cardStyle: {
                    background: "#f8f9fa",
                    border: "1px solid #dee2e6",
                  },
                  badgeVariant: "secondary" as const,
                  icon: <ClockIcon />,
                  badgeText: statut || "Statut inconnu",
                  headerStyle: {},
                };
            }
          };

          const { cardStyle, badgeVariant, icon, badgeText, headerStyle } = getStatutStyle(
            echeance.statut,
          );

          return (
            <Card
              key={echeance.id || index}
              style={{
                ...cardStyle,
                ...(isPayee && {
                  ":hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 35px rgba(40, 167, 69, 0.25)",
                  },
                }),
              }}
              className={isPayee ? "echeance-payee" : ""}
            >
              {/* Effet décoratif pour les échéances payées */}
              {isPayee && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "100px",
                    height: "100px",
                    background:
                      "linear-gradient(45deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.3) 100%)",
                    borderRadius: "0 0 0 100px",
                    zIndex: 1,
                  }}
                />
              )}

              <CardBody style={{ position: "relative", zIndex: 2 }}>
                {/* En-tête avec statut - MODIFIÉ: Sans ID d'échéance */}
                <div style={headerStyle}>
                  <Flex
                    justifyContent={{ default: "justifyContentSpaceBetween" }}
                    alignItems={{ default: "alignItemsCenter" }}
                  >
                    <FlexItem>
                      <Title
                        headingLevel="h3"
                        size="lg"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          margin: 0,
                        }}
                      >
                        {icon}
                        {/* SUPPRIMÉ: Échéance #{echeance.id} */}
                        Échéance de paiement
                      </Title>
                    </FlexItem>
                    <FlexItem>
                      <Badge
                        variant={badgeVariant}
                        style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
                      >
                        {badgeText}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </div>

                {/* Informations principales */}
                <Flex direction={{ default: "column" }} spaceItems={{ default: "spaceItemsMd" }}>
                  {/* Montant */}
                  <FlexItem>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      spaceItems={{ default: "spaceItemsSm" }}
                    >
                      <FlexItem>
                        <DollarSignIcon
                          style={{
                            color: isPayee ? "#28a745" : "#0066cc",
                            fontSize: "1.1rem",
                          }}
                        />
                      </FlexItem>
                      <FlexItem>
                        <span style={{ fontWeight: "bold" }}>Montant:</span>
                      </FlexItem>
                      <FlexItem>
                        <Title
                          headingLevel="h4"
                          size="lg"
                          style={{
                            color: isPayee ? "#28a745" : "#dc3545",
                            fontWeight: "bold",
                            margin: 0,
                          }}
                        >
                          {formatMontant(echeance.montant)}
                        </Title>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  {/* Date d'échéance */}
                  <FlexItem>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      spaceItems={{ default: "spaceItemsSm" }}
                    >
                      <FlexItem>
                        <CalendarAltIcon style={{ color: "#6c757d", fontSize: "1.1rem" }} />
                      </FlexItem>
                      <FlexItem>
                        <span style={{ fontWeight: "bold" }}>Date d'échéance:</span>{" "}
                        {formatDate(echeance.date_echeance)}
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  {/* Date de paiement (si payé) */}
                  {isPayee && echeance.date_paiement && (
                    <FlexItem>
                      <div
                        style={{
                          background: "rgba(40, 167, 69, 0.1)",
                          border: "1px solid rgba(40, 167, 69, 0.3)",
                          borderRadius: "6px",
                          padding: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <CheckCircleIcon style={{ color: "#28a745", fontSize: "1.1rem" }} />
                        <span style={{ color: "#28a745", fontWeight: "500" }}>
                          <strong>Payé le:</strong> {formatDate(echeance.date_paiement)}
                        </span>
                      </div>
                    </FlexItem>
                  )}

                  {/* Description */}
                  {echeance.description && (
                    <FlexItem>
                      <span style={{ color: "#6c757d", fontStyle: "italic" }}>
                        {echeance.description}
                      </span>
                    </FlexItem>
                  )}

                  {/* Action pour les échéances non payées */}
                  {!isPayee && (
                    <>
                      <FlexItem>
                        <Divider style={{ margin: "1rem 0" }} />
                      </FlexItem>
                      <FlexItem>
                        {/* CONSULTATION PAGE - Affichage administrateur */}
                        {isConsultationPage ? (
                          <Flex
                            justifyContent={{
                              default: "justifyContentSpaceBetween",
                            }}
                            alignItems={{ default: "alignItemsCenter" }}
                            gap={{ default: "gapMd" }}
                          >
                            {/* Bouton Envoyer rappel pour les échéances échues (admin seulement) */}
                            {isEchu && (
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="lg"
                                  onClick={() =>
                                    handleEnvoyerRappel(
                                      echeance.id,
                                      echeance.utilisateur_id || userId,
                                    )
                                  }
                                  icon={<EnvelopeIcon />}
                                  isLoading={rappelLoading[echeance.id]}
                                  isDisabled={rappelLoading[echeance.id]}
                                  style={{
                                    background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                    border: "none",
                                    color: "white",
                                    boxShadow: "0 4px 12px rgba(108, 117, 125, 0.3)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  {rappelLoading[echeance.id] ? "Envoi..." : "Envoyer rappel"}
                                </Button>
                              </FlexItem>
                            )}

                            {/* Informations pour l'admin - pas de bouton payer */}
                            <FlexItem>
                              <div
                                style={{
                                  background: isEchu
                                    ? "rgba(220, 53, 69, 0.1)"
                                    : "rgba(0, 123, 255, 0.1)",
                                  border: `1px solid ${isEchu ? "#dc3545" : "#007bff"}`,
                                  borderRadius: "6px",
                                  padding: "0.75rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  fontWeight: "bold",
                                }}
                              >
                                <CreditCardIcon
                                  style={{
                                    color: isEchu ? "#dc3545" : "#007bff",
                                    fontSize: "1.1rem",
                                  }}
                                />
                                <span
                                  style={{
                                    color: isEchu ? "#dc3545" : "#007bff",
                                  }}
                                >
                                  {isEchu ? "Paiement en retard" : "En attente de paiement"}
                                </span>
                              </div>
                            </FlexItem>
                          </Flex>
                        ) : (
                          /* PAGE COMPTE - Affichage utilisateur avec possibilité de payer */
                          <Flex
                            justifyContent={{
                              default: "justifyContentSpaceBetween",
                            }}
                            alignItems={{ default: "alignItemsCenter" }}
                            gap={{ default: "gapMd" }}
                          >
                            {/* Bouton Envoyer rappel seulement pour les échéances échues (pas sur la page compte) */}
                            {isEchu && !isComptePage && (
                              <FlexItem>
                                <Button
                                  variant="secondary"
                                  size="lg"
                                  onClick={() =>
                                    handleEnvoyerRappel(
                                      echeance.id,
                                      echeance.utilisateur_id || userId,
                                    )
                                  }
                                  icon={<EnvelopeIcon />}
                                  isLoading={rappelLoading[echeance.id]}
                                  isDisabled={rappelLoading[echeance.id]}
                                  style={{
                                    background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                    border: "none",
                                    color: "white",
                                    boxShadow: "0 4px 12px rgba(108, 117, 125, 0.3)",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  {rappelLoading[echeance.id] ? "Envoi..." : "Envoyer rappel"}
                                </Button>
                              </FlexItem>
                            )}

                            {/* Bouton payer pour l'utilisateur */}
                            <FlexItem>
                              <Button
                                variant="primary"
                                size="lg"
                                onClick={() => handleAllerPaiement(echeance.id)}
                                icon={<CreditCardIcon />}
                                style={{
                                  background: isEchu
                                    ? "linear-gradient(135deg, #dc3545 0%, #c82333 100%)"
                                    : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                                  border: "none",
                                  boxShadow: isEchu
                                    ? "0 4px 12px rgba(220, 53, 69, 0.3)"
                                    : "0 4px 12px rgba(0, 123, 255, 0.3)",
                                  transition: "all 0.3s ease",
                                }}
                              >
                                {isEchu ? "Payer en retard" : "Payer maintenant"}
                              </Button>
                            </FlexItem>
                          </Flex>
                        )}
                      </FlexItem>
                    </>
                  )}
                </Flex>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* AJOUTÉ: Modal de résultat pour les rappels */}
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={modalTitle}
        message={modalMessage}
        isSuccess={modalSuccess}
      />
    </div>
  );
};

// Fonctions utilitaires avec vérifications de sécurité
const isPaiementEchu = (dateEcheance: string) => {
  if (!dateEcheance) return false;
  try {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    return echeance < today;
  } catch (e) {
    console.error("Erreur parsing date échéance:", dateEcheance);
    return false;
  }
};

export default EcheancesPaiement;
