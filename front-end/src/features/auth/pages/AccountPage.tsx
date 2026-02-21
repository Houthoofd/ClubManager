import React, { useState, useEffect } from "react";
import { PageSection, Spinner, Alert, Tabs, Tab } from "@patternfly/react-core";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { UserIcon, ChartLineIcon, CreditCardIcon } from "@patternfly/react-icons";
import {
  useCompteData,
  type Genre,
  type Grade,
  type Abonnement,
  type Status,
} from "@/features/auth/hooks/useCompteData";
import { StatistiquesTab } from "@/features/stats";
import PaiementsTab from "../components/compte/PaiementsTab";
import CompteInfoTab from "../components/compte/CompteInfoTab";
import ResultModal from "@/shared/components/common-legacy/modal/ResultModal";
import ResumeConfirmModal from "@/shared/components/common-legacy/modal/ResumeConfirmModal";
import { useCheckEmail } from "../hooks/useVerification";
import { useQueryClient } from "@tanstack/react-query";

function formatDateForInput(isoDateString: string): string {
  if (!isoDateString) return "";
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

const Compte = () => {
  const [activeTabKey, setActiveTabKey] = useState<string>("0");
  const [editingFields, setEditingFields] = useState<{
    [key: string]: boolean;
  }>({});
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

  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");
  const [disabledFields, setDisabledFields] = useState<{
    [key: string]: boolean;
  }>({});
  const [userRole, setUserRole] = useState<string | null>(null);

  // AJOUTÉ: Hook pour vérifier l'email
  const checkEmail = useCheckEmail();
  // AJOUTÉ: Query client pour invalider le cache
  const queryClient = useQueryClient();

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

  // Récupération du rôle de l'utilisateur connecté
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const role = parsedData?.status;
      setUserRole(role);
    }
  }, []);

  // Fonction pour vérifier si l'utilisateur peut modifier le statut
  const canEditStatus = () => {
    return userRole === "super-administrateur";
  };

  // initialisation du formulaire
  useEffect(() => {
    if (compteInfo) {
      console.log("🔍 CompteInfo data COMPLET:", JSON.stringify(compteInfo, null, 2));

      // GARDÉ: Extraction plus robuste des valeurs
      const extractValue = (field: string): string => {
        const compteInfoAny = compteInfo as any;
        let value =
          compteInfoAny[field] ||
          compteInfo.utilisateur?.[field as keyof typeof compteInfo.utilisateur];

        // Si c'est un objet, essayons d'extraire une propriété utile
        if (typeof value === "object" && value !== null) {
          console.log(`⚠️ Field ${field} is an object:`, value);

          // Pour les objets, essayons de prendre la première propriété string
          if (Object.prototype.hasOwnProperty.call(value, "id")) value = value.id;
          else if (Object.prototype.hasOwnProperty.call(value, "name")) value = value.name;
          else if (Object.prototype.hasOwnProperty.call(value, "nom")) value = value.nom;
          else if (Object.prototype.hasOwnProperty.call(value, "email")) value = value.email;
          else {
            // Si c'est toujours un objet, convertissons-le
            value = String(value);
          }
        }

        const result = String(value || "");
        console.log(`📝 Extracted ${field}:`, result);
        return result;
      };

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

      console.log("📝 Form data final:", formData);
      setForm(formData);

      // Définir les champs désactivés selon le rôle
      setDisabledFields({
        status: !canEditStatus(),
        grades: !canEditStatus(),
      });
    }
  }, [compteInfo, userRole]);

  // GARDÉ: Handler pour les changements avec validation
  const handleEmailChangeSecure = async (value: string) => {
    console.log("📧 Email change:", value, typeof value);
    const safeValue = typeof value === "string" ? value : String(value || "");
    setForm((prev) => ({ ...prev, email: safeValue }));

    // Validation supplémentaire côté parent si nécessaire
    if (editingFields["email"] && safeValue) {
      // La validation est gérée dans FormulaireCompte
    }
  };

  const handleFormChangeSecure = (field: string, value: string) => {
    console.log(`📝 Form change ${field}:`, value, typeof value);
    const safeValue = typeof value === "string" ? value : String(value || "");
    setForm((prev) => ({ ...prev, [field]: safeValue }));
  };

  // handlers
  const handleTabClick = (_event: React.SyntheticEvent, eventKey: string | number) => {
    setActiveTabKey(String(eventKey));
  };

  const handleEditClick = (field: string) => {
    // Empêcher l'édition du statut si l'utilisateur n'a pas les droits
    if (field === "status" && !canEditStatus()) {
      setResultModalMessage("Vous n'avez pas les permissions pour modifier le statut/rôle.");
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
      return;
    }

    setEditingFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }));
  };

  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach((field) => {
      if (editingFields[field]) changes[field] = (form as any)[field];
    });
    return changes;
  };

  // MODIFIÉ: Gestion des résultats de mutation avec invalidation complète
  useEffect(() => {
    if (updateCompte.isSuccess) {
      setResultModalMessage("Les modifications apportées ont été sauvegardées avec succès.");
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
      setEditingFields({});
      setDisabledFields({});

      // MODIFIÉ: Invalidation complète du cache incluant les échéances
      queryClient.invalidateQueries({ queryKey: ["compteData"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      queryClient.invalidateQueries({ queryKey: ["echeancesUtilisateur"] }); // AJOUTÉ
      queryClient.invalidateQueries({ queryKey: ["paiements"] }); // AJOUTÉ

      // AJOUTÉ: Invalider spécifiquement pour cet utilisateur
      if (utilisateurId) {
        queryClient.invalidateQueries({
          queryKey: ["echeancesUtilisateur", utilisateurId],
        });
        queryClient.invalidateQueries({
          queryKey: ["echeances", "utilisateur", utilisateurId],
        });
        queryClient.invalidateQueries({
          queryKey: ["paiements", "utilisateur", utilisateurId],
        });
        console.log(
          "💰 [Compte] Échéances invalidées pour utilisateur après mise à jour:",
          utilisateurId,
        );
      }

      // AJOUTÉ: Mettre à jour le localStorage si l'email a changé
      const storedData = localStorage.getItem("userData");
      if (storedData && form.email) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData.email !== form.email) {
            parsedData.email = form.email;
            localStorage.setItem("userData", JSON.stringify(parsedData));
            console.log("📧 Email mis à jour dans localStorage");
          }
        } catch (error) {
          console.error("❌ Erreur mise à jour localStorage:", error);
        }
      }

      console.log(
        "✅ Cache et localStorage invalidés après mise à jour du compte (y compris échéances)",
      );
    }
    if (updateCompte.isError) {
      setResultModalMessage(
        "Une erreur est survenue lors de la sauvegarde des modifications. Veuillez réessayer.",
      );
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  }, [
    updateCompte.isSuccess,
    updateCompte.isError,
    updateCompte.error,
    queryClient,
    form.email,
    utilisateurId,
  ]);

  // Affiche le résumé des changements dans la modal avant modification
  const handleApplyChanges = async () => {
    const changes = getChangesSummary();

    // Vérification spéciale pour l'email si modifié
    if (editingFields["email"] && changes["email"]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(changes["email"])) {
        setResultModalMessage("Veuillez entrer une adresse email valide.");
        setResultModalSuccess(false);
        setIsResultModalOpen(true);
        return;
      }

      // Vérification de l'unicité
      const currentEmail = compteInfo?.utilisateur?.email;
      if (changes["email"] !== currentEmail) {
        try {
          console.log("🔍 Vérification unicité email:", changes["email"]);
          const emailExists = await checkEmail(changes["email"]);
          console.log("📧 Email exists result:", emailExists);

          if (emailExists) {
            setResultModalMessage(
              "Cette adresse email est déjà utilisée par un autre utilisateur.",
            );
            setResultModalSuccess(false);
            setIsResultModalOpen(true);
            return;
          }
        } catch (error) {
          console.error("❌ Erreur vérification email:", error);
          setResultModalMessage("Erreur lors de la vérification de l'email. Veuillez réessayer.");
          setResultModalSuccess(false);
          setIsResultModalOpen(true);
          return;
        }
      }
    }

    // Ajout du mot de passe s'il a été modifié
    if (editingFields.password && form.password.trim() !== "") {
      changes["password"] = form.password;
    }

    console.log("📝 Changes to apply:", changes);

    if (Object.keys(changes).length > 0) {
      const modifications: ModificationItem[] = Object.entries(changes).map(([key, newValue]) => {
        const utilisateurAny = compteInfo?.utilisateur as Record<string, any>;
        const compteInfoAny = compteInfo as Record<string, any>;
        let originalValue = utilisateurAny?.[key] || compteInfoAny?.[key];

        console.log(`🔍 Processing field ${key}:`, {
          originalValue,
          newValue,
        });

        let originalDisplay = "Non défini";
        let newDisplay = String(newValue || "Vide");

        const fieldDisplayNames: { [key: string]: string } = {
          email: "Email",
          date_naissance: "Date de naissance",
          genres: "Genre",
          grades: "Grade",
          abonnement: "Abonnement",
          status: "Statut/Rôle",
          password: "Mot de passe",
        };

        if (
          originalValue &&
          originalValue !== "" &&
          originalValue !== null &&
          originalValue !== undefined
        ) {
          const originalString = String(originalValue);

          if (key === "genres" && genres) {
            let genre =
              genres.find((g: Genre) => g.genre_name === originalString) ||
              genres.find((g: Genre) => String(g.id) === originalString);
            originalDisplay = genre?.genre_name || `Genre: ${originalString}`;
          } else if (key === "grades" && grades) {
            let grade =
              grades.find((g: Grade) => g.grade_id === originalString) ||
              grades.find((g: Grade) => String(g.id) === originalString);
            originalDisplay = grade?.grade_id || `Grade: ${originalString}`;
          } else if (key === "abonnement" && abonnements) {
            let abonnement =
              abonnements.find((a: Abonnement) => a.nom_plan === originalString) ||
              abonnements.find((a: Abonnement) => String(a.id) === originalString);
            originalDisplay = abonnement?.nom_plan || `Abonnement: ${originalString}`;
          } else if (key === "status" && status) {
            let statusItem =
              status.find((s: Status) => s.nom_status === originalString) ||
              status.find((s: Status) => String(s.id) === originalString);
            originalDisplay = statusItem?.nom_status || `Status: ${originalString}`;
          } else if (key === "password") {
            originalDisplay = "••••••••";
          } else {
            originalDisplay = originalString;
          }
        }

        if (newValue && newValue !== "") {
          const newString = String(newValue);

          if (key === "genres" && genres) {
            let genre =
              genres.find((g: Genre) => g.genre_name === newString) ||
              genres.find((g: Genre) => String(g.id) === newString);
            newDisplay = genre?.genre_name || newString;
          } else if (key === "grades" && grades) {
            let grade =
              grades.find((g: Grade) => g.grade_id === newString) ||
              grades.find((g: Grade) => String(g.id) === newString);
            newDisplay = grade?.grade_id || newString;
          } else if (key === "abonnement" && abonnements) {
            let abonnement =
              abonnements.find((a: Abonnement) => a.nom_plan === newString) ||
              abonnements.find((a: Abonnement) => String(a.id) === newString);
            newDisplay = abonnement?.nom_plan || newString;
          } else if (key === "status" && status) {
            let statusItem =
              status.find((s: Status) => s.nom_status === newString) ||
              status.find((s: Status) => String(s.id) === newString);
            newDisplay = statusItem?.nom_status || newString;
          } else if (key === "password") {
            newDisplay = "Nouveau mot de passe";
          } else {
            newDisplay = newString;
          }
        }

        return {
          field: fieldDisplayNames[key] || key,
          oldValue: originalDisplay,
          newValue: newDisplay,
        };
      });

      console.log("📝 Modifications resume:", modifications);

      setModificationsResume(modifications);
      setShowConfirmModal(true);
    } else {
      setResultModalMessage("Aucune modification détectée.");
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  // Fonction pour confirmer les modifications
  const confirmerModifications = async () => {
    setShowConfirmModal(false);

    const changes = getChangesSummary();
    // Ajout du mot de passe s'il a été modifié
    if (editingFields.password && form.password.trim() !== "") {
      changes["password"] = form.password;
    }

    const changesToSend: Record<string, any> = {
      id: utilisateurId,
      ...changes,
    };

    // Nettoie les champs vides (mais garde le password s'il a été fourni)
    Object.keys(changesToSend).forEach((key: string) => {
      if (
        key !== "id" &&
        key !== "password" && // Ne pas supprimer le password même s'il est vide
        (changesToSend[key] === undefined ||
          changesToSend[key] === null ||
          changesToSend[key] === "")
      ) {
        delete changesToSend[key];
      }
    });

    updateCompte.mutate(changesToSend);
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    setModificationsResume([]);
  };

  // MODIFIÉ: Fonction pour générer l'URL de paiement avec userId automatique
  const genererUrlPaiement = (echeanceId: number): string => {
    // Récupérer l'ID utilisateur depuis les données du compte
    const userId = utilisateurId || userData?.id;
    console.log(
      `🔗 [Compte] Génération URL paiement pour échéance ${echeanceId}, utilisateur ${userId}`,
    );
    return `/pages/paiement?echeance=${echeanceId}&userId=${userId}`;
  };

  const tabs = [
    {
      key: "0",
      title: "Informations personnelles",
      icon: <UserIcon />,
      content: (
        <CompteInfoTab
          isDataReady={isDataReady}
          compteInfo={compteInfo}
          form={form}
          password={form.password}
          showPasswordField={true}
          editingFields={editingFields}
          abonnements={abonnements}
          grades={grades}
          status={status}
          genres={genres}
          onEditClick={handleEditClick}
          onEmailChange={handleEmailChangeSecure}
          onFormChange={handleFormChangeSecure}
          onPasswordChange={handlePasswordChange}
          onApplyChanges={handleApplyChanges}
          isLoading={updateCompte.isPending}
          formatDateForInput={formatDateForInput}
          disabledFields={disabledFields}
          canEditStatus={canEditStatus()}
        />
      ),
    },
    {
      key: "1",
      title: "Statistiques",
      icon: <ChartLineIcon />,
      content: (
        <StatistiquesTab
          statsDataReady={statsDataReady}
          statFrequentationForGraph={statFrequentationForGraph}
          chartType={chartType}
          onChartTypeChange={setChartType}
        />
      ),
    },
    {
      key: "2",
      title: "Paiements",
      icon: <CreditCardIcon />,
      content: (
        <PaiementsTab
          isDataReady={isDataReady}
          paiementsEcheances={paiementsEcheances}
          userId={utilisateurId || userData?.id}
          genererUrlPaiement={genererUrlPaiement}
        />
      ),
    },
  ];

  if (!userData)
    return (
      <div className="compte-page">
        <PageHeader
          title="Mon compte"
          subtitle="Gérez vos informations personnelles et préférences"
          variant="compte"
        />
        <PageSection className="compte-content" style={{ textAlign: "center", padding: "4rem" }}>
          <Spinner size="xl" />
          <p>Chargement des informations...</p>
        </PageSection>
      </div>
    );

  if (errorCompte)
    return (
      <div className="compte-page">
        <PageHeader
          title="Mon compte"
          subtitle="Gérez vos informations personnelles et préférences"
          variant="compte"
        />
        <PageSection className="compte-content">
          <Alert variant="danger" title="Erreur de chargement" isInline>
            {errorCompte?.message || "Une erreur est survenue lors du chargement des données."}
          </Alert>
        </PageSection>
      </div>
    );

  return (
    <div className="compte-page">
      <PageHeader
        title="Mon compte"
        subtitle="Gérez vos informations personnelles et préférences"
        variant="compte"
      />
      <PageSection className="compte-content">
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              eventKey={tab.key}
              title={
                <>
                  {tab.icon}
                  <span style={{ marginLeft: 8 }}>{tab.title}</span>
                </>
              }
            >
              <div style={{ marginTop: "1rem" }}>{tab.content}</div>
            </Tab>
          ))}
        </Tabs>
      </PageSection>

      <ResumeConfirmModal
        isOpen={showConfirmModal}
        onClose={annulerModifications}
        onConfirm={confirmerModifications}
        title="Confirmer les modifications"
        message="Vous êtes sur le point de modifier vos informations."
        modificationsResume={modificationsResume}
      />

      <ResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title={resultModalSuccess ? "Succès" : "Erreur"}
        message={resultModalMessage}
        isSuccess={resultModalSuccess}
      />
    </div>
  );
};

export default Compte;
