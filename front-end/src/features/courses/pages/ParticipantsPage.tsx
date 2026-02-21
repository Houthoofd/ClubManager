import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { PageSection, Title, Alert } from "@patternfly/react-core";
import { useParticipants } from "../hooks/useParticipants";
import { useAnnulerPresence, useValiderPresence } from "../hooks/useCours";
import ParticipantCard from "../components/ParticipantCard";
import ParticipantsStats from "../components/ParticipantsStats";
import PresenceConfirmationModal from "@/shared/components/common-legacy/modal/PresenceConfirmationModal";
import { SkeletonDataList } from "@/shared/components/ui";
import { useToggle } from "@/shared/hooks/utils";

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const ParticipantsPage = () => {
  const { id } = useParams();
  const coursId = Number(id);
  const [showModal, toggleModal] = useToggle(false);
  const [modalMessage, setModalMessage] = useState<string>("");
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [currentParticipant, setCurrentParticipant] = useState<string>("");
  const [currentAction, setCurrentAction] = useState<"valider" | "annuler" | undefined>();

  // Hooks React Query
  const { data: cours, isLoading, error } = useParticipants(coursId);
  const annulerPresence = useAnnulerPresence();
  const validerPresence = useValiderPresence();

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!cours?.utilisateurs) return { total: 0, presents: 0, absents: 0, nonDefinis: 0 };

    const total = cours.utilisateurs.length;
    const presents = cours.utilisateurs.filter((u: any) => u.presence === 1).length;
    const absents = cours.utilisateurs.filter((u: any) => u.presence === 0).length;
    const nonDefinis = cours.utilisateurs.filter((u: any) => u.presence === null).length;

    return { total, presents, absents, nonDefinis };
  }, [cours?.utilisateurs]);

  const handleStatus = async (utilisateur: any, action: "valider" | "annuler") => {
    try {
      const data = {
        cours_id: coursId,
        utilisateur_nom: utilisateur.nom,
        utilisateur_prenom: utilisateur.prenom,
      };

      setCurrentParticipant(`${utilisateur.prenom} ${utilisateur.nom}`);
      setCurrentAction(action);

      if (action === "valider") {
        await validerPresence.mutateAsync(data);
        setModalMessage("La présence a été validée avec succès !");
        setModalSuccess(true);
      } else {
        await annulerPresence.mutateAsync(data);
        setModalMessage("La présence a été annulée avec succès !");
        setModalSuccess(true);
      }
      toggleModal();
    } catch (err) {
      setModalMessage("Erreur lors de la mise à jour de la présence.");
      setModalSuccess(false);
      setCurrentParticipant(`${utilisateur.prenom} ${utilisateur.nom}`);
      setCurrentAction(action);
      toggleModal();
      console.error("Erreur lors de la mise à jour de la présence:", err);
    }
  };

  const handleCloseModal = () => {
    toggleModal(false);
    setCurrentParticipant("");
    setCurrentAction(undefined);
  };

  if (isLoading) {
    return (
      <PageSection className="pf-v5-u-p-lg">
        <Title headingLevel="h2" className="pf-v5-u-mb-md">
          Chargement des participants...
        </Title>
        <SkeletonDataList items={8} />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert
          variant="danger"
          title="Erreur lors du chargement des participants"
          style={{ borderRadius: "8px" }}
        />
      </PageSection>
    );
  }

  if (!cours) {
    return (
      <PageSection>
        <Alert variant="warning" title="Cours introuvable" style={{ borderRadius: "8px" }} />
      </PageSection>
    );
  }

  return (
    <div className="participants-container">
      {/* Header */}
      <div className="participants-header">
        <Title headingLevel="h1" size="2xl" className="participants-header-title">
          Gestion des présences
        </Title>
        <p className="participants-header-subtitle">
          Cours du {cours.date_cours ? formatDateFromISO(cours.date_cours) : "Date inconnue"}
        </p>
      </div>

      {/* Statistiques */}
      <ParticipantsStats
        totalParticipants={stats.total}
        presents={stats.presents}
        absents={stats.absents}
        nonDefinis={stats.nonDefinis}
      />

      {/* Liste des participants */}
      {cours.utilisateurs && cours.utilisateurs.length > 0 ? (
        <div>
          {cours.utilisateurs.map((utilisateur: any, idx: any) => (
            <ParticipantCard
              key={utilisateur.id || idx}
              utilisateur={utilisateur}
              onValidatePresence={() => handleStatus(utilisateur, "valider")}
              onCancelPresence={() => handleStatus(utilisateur, "annuler")}
            />
          ))}
        </div>
      ) : (
        <div className="participants-empty-state">
          <Title headingLevel="h3" style={{ color: "#6c757d", marginBottom: "1rem" }}>
            Aucun participant inscrit
          </Title>
          <p>Il n'y a actuellement aucun participant inscrit à ce cours.</p>
        </div>
      )}

      {/* Modal de confirmation de présence */}
      <PresenceConfirmationModal
        isOpen={showModal}
        onClose={handleCloseModal}
        isSuccess={modalSuccess}
        message={modalMessage}
        participantName={currentParticipant}
        action={currentAction}
      />
    </div>
  );
};

const Participants = () => {
  return (
    <Provider store={store}>
      <ParticipantsPage />
    </Provider>
  );
};

export default Participants;
