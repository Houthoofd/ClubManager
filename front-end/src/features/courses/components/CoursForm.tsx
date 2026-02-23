import React from "react";
import { FormSelect, FormSelectOption, TextInput, Button, Alert } from "@patternfly/react-core";
import { SaveIcon, TimesIcon } from '@/shared/icons';
import DualListSelectorGeneric from "@/shared/components/common-legacy/dualListSelector";

interface CoursFormProps {
  nom: string;
  setNom: (nom: string) => void;
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
  jour: string | null;
  setJour: (jour: string | null) => void;
  heureDebut: string;
  setHeureDebut: (heure: string) => void;
  heureFin: string;
  setHeureFin: (heure: string) => void;
  selectedUsers: { id: number; name: string }[];
  setSelectedUsers: (users: { id: number; name: string }[]) => void;
  professeurs: any[];
  isModifying: boolean;
  originalCours: any;
  onSubmit: (e: React.FormEvent) => void;
  onAnnulerModification: () => void;
}

const CoursForm: React.FC<CoursFormProps> = ({
  nom,
  setNom,
  selectedType,
  setSelectedType,
  jour,
  setJour,
  heureDebut,
  setHeureDebut,
  heureFin,
  setHeureFin,
  selectedUsers,
  setSelectedUsers,
  professeurs,
  isModifying,
  originalCours,
  onSubmit,
  onAnnulerModification,
}) => {
  // Convertir les selectedUsers en format pour le DualListSelector
  const selectedProfesseurs = selectedUsers.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  // Calculer les professeurs disponibles (ceux qui ne sont pas déjà sélectionnés)
  const availableProfesseurs = professeurs
    .filter((prof) => !selectedProfesseurs.some((selected) => selected.id === prof.id))
    .map((prof) => ({
      id: prof.id,
      name: `${prof.first_name} ${prof.last_name}`,
    }));

  const handleProfesseursChange = (newAssignedProfesseurs: { id: number; name: string }[]) => {
    setSelectedUsers(newAssignedProfesseurs);
  };

  return (
    <div className="cours-form-container">
      {isModifying && (
        <Alert
          variant="warning"
          title="Mode modification"
          className="cours-modification-banner"
          isInline
        >
          Vous modifiez le cours "{originalCours?.type_cours}" du {originalCours?.jour}
        </Alert>
      )}

      <form onSubmit={onSubmit}>
        <div className="cours-form-field">
          <label className="cours-form-label">Nom du cours :</label>
          <TextInput
            type="text"
            value={nom}
            onChange={(_event, value) => setNom(value)}
            placeholder="Nom du cours"
            className="form-field"
          />
        </div>

        <div className="cours-form-field">
          <label className="cours-form-label">Type de cours :</label>
          <FormSelect
            value={selectedType || ""}
            onChange={(_event, value) => setSelectedType(value)}
            aria-label="Type de cours"
            className="form-field"
          >
            <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
            <FormSelectOption value="Judo" label="Judo" />
            <FormSelectOption value="JJB" label="JJB" />
            <FormSelectOption value="Grappling" label="Grappling" />
          </FormSelect>
        </div>

        <div className="cours-form-field">
          <label className="cours-form-label">Jour de la semaine :</label>
          <FormSelect
            value={jour || ""}
            onChange={(_event, value) => setJour(value)}
            aria-label="Jour de la semaine"
            className="form-field"
          >
            <FormSelectOption isDisabled value="" label="Sélectionnez un jour" />
            <FormSelectOption value="Lundi" label="Lundi" />
            <FormSelectOption value="Mardi" label="Mardi" />
            <FormSelectOption value="Mercredi" label="Mercredi" />
            <FormSelectOption value="Jeudi" label="Jeudi" />
            <FormSelectOption value="Vendredi" label="Vendredi" />
            <FormSelectOption value="Samedi" label="Samedi" />
            <FormSelectOption value="Dimanche" label="Dimanche" />
          </FormSelect>
        </div>

        <div className="cours-form-field">
          <label className="cours-form-label">Horaires :</label>
          <div className="cours-time-inputs">
            <div>
              <label className="cours-form-label">Heure de début :</label>
              <TextInput
                type="time"
                value={heureDebut}
                onChange={(_event, value) => setHeureDebut(value)}
                className="form-field"
              />
            </div>
            <div>
              <label className="cours-form-label">Heure de fin :</label>
              <TextInput
                type="time"
                value={heureFin}
                onChange={(_event, value) => setHeureFin(value)}
                className="form-field"
              />
            </div>
          </div>
        </div>

        <div className="cours-form-field">
          <label className="cours-form-label">Professeurs :</label>
          <DualListSelectorGeneric
            label="Professeurs"
            availableItems={availableProfesseurs}
            assignedItems={selectedProfesseurs}
            onChange={handleProfesseursChange}
            getText={(item) => item.name}
            getKey={(item) => item.id}
            availableTitle="Professeurs disponibles"
            assignedTitle="Professeurs assignés"
            fieldId="professeurs-selector"
          />
        </div>

        <div className="cours-form-actions">
          {isModifying && (
            <Button variant="secondary" onClick={onAnnulerModification} icon={<TimesIcon />}>
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            icon={<SaveIcon />}
            isDisabled={!nom || !selectedType || !jour || !heureDebut || !heureFin}
          >
            {isModifying ? "Modifier le cours" : "Ajouter le cours"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CoursForm;
