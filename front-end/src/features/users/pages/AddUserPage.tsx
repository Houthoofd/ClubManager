import React, { useEffect, useState } from "react";
import { PageSection, Spinner } from "@patternfly/react-core";
import { UserIcon, TableIcon } from "@patternfly/react-icons";
import type { UserData } from "@clubmanager/types";
import {
  useUtilisateurs,
  checkEmailExists,
  useUpdateUtilisateur,
  useDeleteUtilisateur,
  useAjouterUtilisateur,
} from "../hooks/useUtilisateurs";
import {
  ModalConfirmation,
  ModalResultat,
} from "@/shared/components/common-legacy/modal/ModalsGestion";
import ModalWithHelp from "@/shared/components/common-legacy/modal/ModalWithHelp";
import OngletTableauUtilisateurs from "../components/OngletTableauUtilisateurs";
import FormulaireUtilisateurAjout from "../components/FormulaireUtilisateurAjout";
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { TabContainer } from "@/shared/components/common-legacy/TabContainer";
import {
  useAbonnements,
  useGrades,
  useStatus,
  useGenres,
} from "@/shared/hooks/utils/useInformations";
import { useQueryClient } from "@tanstack/react-query";
import { useUserContext } from "@/app/providers/UserProvider";
import SendMessageModal from "@/features/messages/components/SendMessageModal";
import { useTypesMessages, useEnvoyerMessage } from "@/features/messages/hooks-legacy/useMessages";
import { useAlertes } from "@/shared/hooks/utils/useAlertes";
import { ResultModal } from "@/shared/components/common-legacy/modal/ResultModal";
import ConfirmModal from "@/shared/components/common-legacy/modal/ConfirmModal";
import { useErrorHandler } from "@/shared/hooks";
import { SuccessAlert, ErrorAlert } from "@/shared/components/ui";

const Utilisateur = () => {
  const { selectedUser, setSelectedUser, selectedUserId, setSelectedUserId } = useUserContext();

  // ========== États ==========
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    nom_utilisateur: "",
    email: "",
    date_naissance: "",
    genres: "",
    grades: "",
    abonnement: "",
    grade: "",
    statut: "",
  });
  const [errors, setErrors] = useState({
    email: "",
  });
  const [selectOptions, setSelectOptions] = useState<Record<string, any[]>>({});
  const [userSchema, setUserSchema] = useState<Record<string, string> | null>(null);

  // États pour les modales
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalVariant, setConfirmModalVariant] = useState<
    "confirmation" | "success" | "error" | "loading"
  >("confirmation");
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalError, setConfirmModalError] = useState<string | null>(null);
  const [confirmModalSuccess, setConfirmModalSuccess] = useState("");

  // États pour la suppression
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [resultModalLoading, setResultModalLoading] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);

  // État pour la modal d'utilisateur existant
  const [existingUserModalOpen, setExistingUserModalOpen] = useState(false);
  const [existingUserMessage, setExistingUserMessage] = useState("");

  // États pour l'envoi de messages
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<UserData | null>(null);
  const [messageResultModalOpen, setMessageResultModalOpen] = useState(false);
  const [messageResultMessage, setMessageResultMessage] = useState("");
  const [messageResultSuccess, setMessageResultSuccess] = useState(false);

  // ========== Hooks ==========
  const { data: utilisateursData = [], isLoading: isLoadingUtilisateurs } = useUtilisateurs();
  const updateUtilisateur = useUpdateUtilisateur();
  const deleteUtilisateur = useDeleteUtilisateur();
  const ajouterUtilisateur = useAjouterUtilisateur();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: statuts = [] } = useStatus();
  const { data: genres = [] } = useGenres();
  const { data: typesMessages = [] } = useTypesMessages();
  const envoyerMessage = useEnvoyerMessage();
  const { data: alertesUtilisateurs = [] } = useAlertes();
  const queryClient = useQueryClient();

  // Error handler hook for better error management
  const {
    handleError,
    error: globalError,
    clearError,
  } = useErrorHandler({
    showToast: true,
    autoLogout: true,
  });

  // ========== Fonctions de validation ==========
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    return isValid;
  };

  // Debug des données reçues
  console.log("utilisateursData:", utilisateursData);
  console.log("utilisateursData:", utilisateursData?.slice(0, 2));
  console.log("Sample user structure:", utilisateursData?.[0]);

  // ========== Initialisation ==========
  useEffect(() => {
    if (
      abonnements.length > 0 &&
      grades.length > 0 &&
      statuts.length > 0 &&
      genres.length > 0 &&
      !userSchema
    ) {
      setUserSchema({
        first_name: "string",
        last_name: "string",
        email: "string",
        status: "string",
      });
      setSelectOptions({
        abonnements: (abonnements || []).map((a) => ({
          id: a.id?.toString() || "",
          label:
            a.nom_plan && a.prix && a.periode
              ? `${a.nom_plan} (${a.prix}€/${a.periode})`
              : "Abonnement invalide",
        })),
        grades: (grades || []).map((g) => ({
          id: g.id?.toString() || "",
          label: g.grade_id?.toString() || "Grade invalide",
        })),
        statuts: (statuts || []).map((s) => ({
          id: s.id?.toString() || "",
          label: s.nom_role || "Statut invalide",
        })),
        genres: (genres || []).map((g) => ({
          id: g.id?.toString() || "",
          label: g.genre_name || "Genre invalide",
        })),
        status: [...new Set((statuts || []).map((s) => s.nom_role))].map((status) => ({
          id: status?.toString() || "",
          label: status?.toString() || "Statut invalide",
        })),
      });
    }
  }, [abonnements, grades, statuts, genres, userSchema]);

  // ========== Handlers pour l'édition et la suppression ==========
  const handleEdit = (user: UserData) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    console.log("Édition utilisateur:", user);
  };

  // ========== Handlers pour l'ajout d'utilisateur ==========
  const handleAjoutUtilisateur = async () => {
    const canProceed = await checkEmailBeforeConfirm();
    if (canProceed) {
      setShowConfirmAddModal(true);
    }
  };

  const confirmAjouterUtilisateur = async () => {
    setShowConfirmAddModal(false);

    try {
      // S'assurer que les champs requis sont présents et non vides
      if (!formData.prenom || !formData.nom || !formData.email || !formData.date_naissance) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const userData = {
        first_name: formData.prenom.trim(), // Backend expects first_name
        last_name: formData.nom.trim(), // Backend expects last_name
        nom_utilisateur: formData.nom_utilisateur,
        email: formData.email.trim(),
        date_of_birth: formData.date_naissance, // Backend expects date_of_birth
        genres: Number(formData.genres),
        grades: Number(formData.grade || formData.grades),
        abonnement: Number(formData.abonnement),
        status: Number(formData.statut),
      };

      console.log("Données à envoyer au backend:", userData);

      await ajouterUtilisateur.mutateAsync(userData);

      // Afficher le succès via ResultModal
      setMessageResultSuccess(true);
      setMessageResultMessage("Utilisateur créé avec succès");
      setMessageResultModalOpen(true);

      // Réinitialiser le formulaire
      setFormData({
        prenom: "",
        nom: "",
        nom_utilisateur: "",
        email: "",
        date_naissance: "",
        genres: "",
        grades: "",
        abonnement: "",
        grade: "",
        statut: "",
      });
      setErrors({ email: "" });
      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
    } catch (error: any) {
      // Afficher l'erreur via ResultModal
      setMessageResultSuccess(false);
      setMessageResultMessage(
        error.message ||
          "Une erreur technique est survenue lors de la création de l'utilisateur. Veuillez réessayer.",
      );
      setMessageResultModalOpen(true);
      console.error("Erreur lors de l'ajout:", error);
    }
  };

  // ========== Handlers pour la suppression ==========
  const handleDelete = (user: any) => {
    setUtilisateurToDelete(user);
    setConfirmDeleteOpen(true); // Ouvrir la modale de confirmation
  };

  const confirmDelete = async () => {
    if (!utilisateurToDelete) return;

    setConfirmDeleteOpen(false); // Fermer la modale de confirmation

    try {
      await deleteUtilisateur.mutateAsync(utilisateurToDelete.id);

      // Afficher le succès via ResultModal
      setMessageResultSuccess(true);
      setMessageResultMessage(
        `L'utilisateur ${utilisateurToDelete.first_name} ${utilisateurToDelete.last_name} a été supprimé avec succès`,
      );
      setMessageResultModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ["utilisateurs"] });
      setUtilisateurToDelete(null);
    } catch (error: any) {
      // Afficher l'erreur via ResultModal
      setMessageResultSuccess(false);
      setMessageResultMessage(
        error.message ||
          "Une erreur technique est survenue lors de la suppression de l'utilisateur. Veuillez réessayer.",
      );
      setMessageResultModalOpen(true);
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setUtilisateurToDelete(null);
  };

  const cancelAjoutUtilisateur = () => {
    setShowConfirmAddModal(false);
  };

  // ========== Gestion des changements de formulaire ==========
  const handleChange = (value: string, key: string) => {
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [key]: value,
      };
      if (key === "prenom" || key === "nom") {
        updatedFormData.nom_utilisateur = `${updatedFormData.prenom.toLowerCase()}.${updatedFormData.nom.toLowerCase()}`;
      }
      return updatedFormData;
    });

    if (key === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value && !validateEmail(value) ? "Format d'email invalide" : "",
      }));
    }
  };

  // Handlers spécifiques pour chaque champ
  const handlePrenomChange = (value: string) => {
    handleChange(value, "prenom");
  };

  const handleNomChange = (value: string) => {
    handleChange(value, "nom");
  };

  const handleEmailChange = (value: string) => {
    handleChange(value, "email");
  };

  const handleDateNaissanceChange = (value: string) => {
    handleChange(value, "date_naissance");
  };

  const handleGenreChange = (value: string) => {
    handleChange(value, "genres");
  };

  const handleAbonnementChange = (value: string) => {
    handleChange(value, "abonnement");
  };

  const handleGradeChange = (value: string) => {
    handleChange(value, "grade");
  };

  const handleStatutChange = (value: string) => {
    handleChange(value, "statut");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAjoutUtilisateur();
  };

  // ========== Handlers pour les messages ==========
  const handleSendMessage = (user: UserData) => {
    setSelectedUserForMessage(user);
    setShowSendMessageModal(true);
  };

  const handleSendMessageConfirm = async (typeMessageId: number) => {
    if (!selectedUserForMessage) return;

    try {
      await envoyerMessage.mutateAsync({
        destinataires: [selectedUserForMessage.id],
        type_message_id: typeMessageId,
      });

      setMessageResultMessage(
        `Message envoyé avec succès à ${selectedUserForMessage.first_name} ${selectedUserForMessage.last_name}.`,
      );
      setMessageResultSuccess(true);
      setMessageResultModalOpen(true);
      setShowSendMessageModal(false);
      setSelectedUserForMessage(null);
    } catch (error) {
      setMessageResultMessage("Erreur lors de l'envoi du message. Veuillez réessayer.");
      setMessageResultSuccess(false);
      setMessageResultModalOpen(true);
    }
  };

  const handleCloseSendMessageModal = () => {
    setShowSendMessageModal(false);
    setSelectedUserForMessage(null);
  };

  // Fonction pour obtenir les alertes d'un utilisateur
  const getUserAlertes = (userId: number) => {
    return (alertesUtilisateurs || []).filter((alerte) => alerte.utilisateur_id === userId);
  };

  // Fonction pour obtenir les messages suggérés selon les alertes
  const getSuggestedMessages = (userId: number) => {
    const alertes = getUserAlertes(userId);
    const suggestions = [];

    alertes.forEach((alerte) => {
      switch (alerte.code) {
        case "PAIEMENT_RETARD":
          suggestions.push({
            typeId: (typesMessages || []).find((t) => t.title.includes("Rappel 1"))?.id,
            raison: "Paiement en retard",
          });
          break;
        case "PAIEMENT_CRITIQUE":
          suggestions.push({
            typeId: (typesMessages || []).find((t) => t.title.includes("Dernier rappel"))?.id,
            raison: "Paiement critique",
          });
          break;
        case "COMPTE_INCOMPLET":
          suggestions.push({
            typeId: (typesMessages || []).find((t) => t.title.includes("Mise à jour profil"))?.id,
            raison: "Profil incomplet",
          });
          break;
        case "ABSENCE_PROLONGEE":
          suggestions.push({
            typeId: (typesMessages || []).find((t) => t.title.includes("Rappel entraînement"))?.id,
            raison: "Absence prolongée",
          });
          break;
      }
    });

    return suggestions.filter((s) => s.typeId);
  };

  // ========== Vérification de l'email avant confirmation ==========
  const checkEmailBeforeConfirm = async () => {
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Format d'email invalide" }));
      return false;
    }
    if (formData.email) {
      try {
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists.exists) {
          setExistingUserMessage(
            `Un utilisateur avec l'adresse email "${formData.email}" existe déjà.`,
          );
          setExistingUserModalOpen(true);
          return false;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'email:", error);
        // Utiliser ResultModal pour les erreurs de validation aussi
        setMessageResultSuccess(false);
        setMessageResultMessage("Une erreur est survenue lors de la vérification de l'email.");
        setMessageResultModalOpen(true);
        return false;
      }
    }
    return true;
  };

  // ========== Handlers pour les modales ==========
  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmModalVariant("confirmation");
    setConfirmModalTitle("");
    setConfirmModalError(null);
    setConfirmModalSuccess("");
  };

  const closeExistingUserModal = () => {
    setExistingUserModalOpen(false);
    setExistingUserMessage("");
  };

  const tabs = [
    {
      key: 0,
      title: "Gestion des utilisateurs",
      icon: <TableIcon />,
      content: (
        <OngletTableauUtilisateurs
          utilisateurs={utilisateursData || []}
          columns={[
            // Colonnes simplifiées - le composant gère maintenant sa propre configuration
            { key: "first_name", label: "Prénom", ariaLabel: "Prénom" },
            { key: "last_name", label: "Nom", ariaLabel: "Nom" },
            { key: "email", label: "Email", ariaLabel: "Email" },
            { key: "status_id", label: "Statut", ariaLabel: "Statut" },
          ]}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoadingUtilisateurs}
          onDeleteUser={handleDelete}
          onEdit={handleEdit}
          onSendMessage={handleSendMessage}
          getUserAlertes={getUserAlertes}
          getSuggestedMessages={getSuggestedMessages}
        />
      ),
    },
    {
      key: 1,
      title: "Ajouter un utilisateur",
      icon: <UserIcon />,
      content: (
        <FormulaireUtilisateurAjout
          prenom={formData.prenom}
          nom={formData.nom}
          email={formData.email}
          dateNaissance={formData.date_naissance}
          genre={formData.genres}
          abonnement={formData.abonnement}
          grade={formData.grade}
          statut={formData.statut}
          abonnements={(abonnements || []).map((a) => ({
            id: a.id?.toString() || "",
            label:
              a.nom_plan && a.prix && a.periode
                ? `${a.nom_plan} (${a.prix}€/${a.periode})`
                : a.nom_plan || "Abonnement invalide",
          }))}
          grades={(grades || []).map((g) => ({
            id: g.id?.toString() || "",
            label: g.grade_id || "Grade invalide",
          }))}
          statuts={(statuts || []).map((s) => ({
            id: s.id?.toString() || "",
            label: s.nom_role || "Statut invalide",
          }))}
          genres={(genres || []).map((g) => ({
            id: g.id?.toString() || "",
            label: g.genre_name || "Genre invalide",
          }))}
          onPrenomChange={handlePrenomChange}
          onNomChange={handleNomChange}
          onEmailChange={handleEmailChange}
          onDateNaissanceChange={handleDateNaissanceChange}
          onGenreChange={handleGenreChange}
          onAbonnementChange={handleAbonnementChange}
          onGradeChange={handleGradeChange}
          onStatutChange={handleStatutChange}
          onSubmit={handleSubmit}
          emailError={errors.email}
        />
      ),
    },
  ];

  return (
    <div className="utilisateur-page">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Gérez les comptes utilisateurs de votre club"
      />
      <PageSection>
        <TabContainer
          tabs={tabs}
          activeKey={activeTabKey}
          onTabSelect={setActiveTabKey}
          variant="modern"
        />
      </PageSection>

      {/* Modal d'envoi de message */}
      <SendMessageModal
        isOpen={showSendMessageModal}
        onClose={handleCloseSendMessageModal}
        user={selectedUserForMessage}
        typesMessages={typesMessages || []}
        suggestedMessages={getSuggestedMessages(selectedUserForMessage?.id || 0)}
        onSendMessage={handleSendMessageConfirm}
        isLoading={envoyerMessage.isPending}
      />

      {/* Modal de résultat unifié pour tous les messages (ajout, suppression, envoi message) */}
      <ResultModal
        isOpen={messageResultModalOpen}
        onClose={() => setMessageResultModalOpen(false)}
        title={messageResultSuccess ? "Succès" : "Erreur"}
        message={messageResultMessage}
        isSuccess={messageResultSuccess}
      />

      {/* Modal de confirmation de suppression - Utiliser ModalConfirmation au lieu de ConfirmModal */}
      <ModalConfirmation
        isOpen={confirmDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        showCancelButton={true}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: "normal" }}>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
            <strong>
              {utilisateurToDelete?.first_name} {utilisateurToDelete?.last_name}
            </strong>{" "}
            ?
          </p>
          <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
            Cette action est irréversible.
          </p>
        </div>
      </ModalConfirmation>

      {/* Modal de confirmation d'ajout - Remplacer ConfirmModal par ModalConfirmation */}
      <ModalConfirmation
        isOpen={showConfirmAddModal}
        onClose={cancelAjoutUtilisateur}
        onConfirm={() => confirmAjouterUtilisateur()}
        title="Confirmer l'ajout"
        confirmText="Ajouter"
        cancelText="Annuler"
        variant="primary"
        showCancelButton={true}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: "normal" }}>
            Êtes-vous sûr de vouloir ajouter cet utilisateur ?
          </p>
          <div
            style={{
              fontSize: "0.9rem",
              color: "#666",
              marginTop: "1rem",
              textAlign: "left",
            }}
          >
            <p>
              <strong>Prénom :</strong> {formData.prenom}
            </p>
            <p>
              <strong>Nom :</strong> {formData.nom}
            </p>
            <p>
              <strong>Email :</strong> {formData.email}
            </p>
            <p>
              <strong>Date de naissance :</strong> {formData.date_naissance}
            </p>
          </div>
        </div>
      </ModalConfirmation>

      {/* Modal pour utilisateur existant */}
      <ModalConfirmation
        isOpen={existingUserModalOpen}
        onClose={closeExistingUserModal}
        title="Notification"
        confirmText="OK"
        variant="danger"
        showCancelButton={false}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: "normal", color: "red" }}>
            {existingUserMessage}
          </p>
        </div>
      </ModalConfirmation>
    </div>
  );
};

export default Utilisateur;
