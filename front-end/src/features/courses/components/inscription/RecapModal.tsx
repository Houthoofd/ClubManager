import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from "@patternfly/react-core";
import { InscriptionFormData as FormData } from "@clubmanager/types";

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  form: FormData;
  abonnementOptions: Array<{ value: string; label: string; prix: number }>;
  genreOptions: Array<{ value: string; label: string }>;
  modalMessage: string | null;
  isLoading: boolean;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  form,
  abonnementOptions,
  genreOptions,
  modalMessage,
  isLoading,
}) => {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="recap-modal-title">
      <ModalHeader title="Récapitulatif de l'inscription" />
      <ModalBody>
        <div
          style={{
            background: "#f8f9fa",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <p>
            <strong>Prénom :</strong> {form.prenom}
          </p>
          <p>
            <strong>Nom :</strong> {form.nom}
          </p>
          <p>
            <strong>Email :</strong> {form.email}
          </p>
          <p>
            <strong>Genre :</strong>{" "}
            {genreOptions.find((g) => g.value === form.genre)?.label || "Non sélectionné"}
          </p>
          <p>
            <strong>Date de naissance :</strong> {form.date_naissance}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Type d'abonnement :</strong>{" "}
            {(() => {
              const abonnement = abonnementOptions.find((a) => a.value === form.abonnement);
              return abonnement ? `${abonnement.label} (${abonnement.prix}€)` : "Non sélectionné";
            })()}
          </p>
        </div>
        {modalMessage && (
          <Alert
            variant={modalMessage === "Inscription réussie !" ? "success" : "danger"}
            title={modalMessage}
            isInline
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onConfirm} isLoading={isLoading} isDisabled={isLoading}>
          {isLoading ? "Inscription..." : "Confirmer"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Annuler
        </Button>
      </ModalFooter>
    </Modal>
  );
};
