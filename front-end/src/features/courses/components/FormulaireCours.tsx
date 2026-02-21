import React from "react";
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
} from "@patternfly/react-core";
import DualListSelectorGeneric from "@/shared/components/common-legacy/dualListSelector";

interface FormulairesCoursProps {
  nom: string;
  setNom: (value: string) => void;
  selectedType: string | null;
  setSelectedType: (value: string) => void;
  jour: string | null;
  setJour: (value: string) => void;
  heureDebut: string;
  setHeureDebut: (value: string) => void;
  heureFin: string;
  setHeureFin: (value: string) => void;
  selectedUsers: { id: number; name: string }[];
  setSelectedUsers: (users: { id: number; name: string }[]) => void;
  professeurs: any[];
  isModifying: boolean;
  originalCours: any;
  onSubmit: (e: React.FormEvent) => void;
  onAnnulerModification: () => void;
  typesCours?: string[];
  joursSemaine?: string[];
  submitButtonText?: string;
  cancelButtonText?: string;
}

const FormulaireCours: React.FC<FormulairesCoursProps> = ({
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
  typesCours = ["Judo", "JJB", "Grappling"],
  joursSemaine = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  submitButtonText,
  cancelButtonText = "Annuler la modification",
}) => {
  return (
    <Form onSubmit={onSubmit}>
      <FormGroup label="Type de cours" isRequired fieldId="type-cours">
        <FormSelect
          id="type-cours"
          value={selectedType || ""}
          onChange={(_event, value) => setSelectedType(value)}
          aria-label="Type de cours"
        >
          <FormSelectOption isDisabled value="" label="Sélectionnez un type" />
          {typesCours.map((type) => (
            <FormSelectOption key={type} value={type} label={type} />
          ))}
        </FormSelect>
      </FormGroup>

      <FormGroup label="Nom du cours" isRequired fieldId="nom-cours">
        <TextInput
          isRequired
          type="text"
          id="nom-cours"
          value={nom}
          onChange={(_e, value) => setNom(value)}
        />
      </FormGroup>

      <FormGroup label="Jour" isRequired fieldId="jour-cours">
        <FormSelect
          id="jour-cours"
          value={jour || ""}
          onChange={(_event, value) => setJour(value)}
          aria-label="Jour du cours"
        >
          <FormSelectOption isDisabled value="" label="Sélectionnez un jour" />
          {joursSemaine.map((j) => (
            <FormSelectOption key={j} value={j} label={j} />
          ))}
        </FormSelect>
      </FormGroup>

      <FormGroup label="Horaire" isRequired fieldId="horaire-cours">
        <div style={{ display: "flex", gap: "1rem" }}>
          <TextInput
            isRequired
            type="time"
            id="heure-debut"
            value={heureDebut}
            onChange={(_e, value) => setHeureDebut(value)}
          />
          <TextInput
            isRequired
            type="time"
            id="heure-fin"
            value={heureFin}
            onChange={(_e, value) => setHeureFin(value)}
          />
        </div>
      </FormGroup>

      <FormGroup label="Professeurs" fieldId="professeurs-cours">
        <DualListSelectorGeneric
          key={isModifying ? `modif-${originalCours?.id || "new"}` : "ajout"}
          availableItems={professeurs}
          assignedItems={selectedUsers}
          onChange={(newAssigned) =>
            setSelectedUsers(
              newAssigned.map((u: any) => ({
                id: u.id,
                name: u.first_name ? `${u.first_name} ${u.last_name}` : u.name,
              })),
            )
          }
          getText={(item: any) =>
            item.first_name ? `${item.first_name} ${item.last_name}` : item.name
          }
          getKey={(item: any) => item.id}
          availableTitle="Professeurs disponibles"
          assignedTitle="Professeurs assignés"
        />
      </FormGroup>

      <Button type="submit" variant="primary">
        {submitButtonText || (isModifying ? "Modifier le cours" : "Ajouter le cours")}
      </Button>

      {isModifying && (
        <Button variant="secondary" style={{ marginLeft: "1rem" }} onClick={onAnnulerModification}>
          {cancelButtonText}
        </Button>
      )}
    </Form>
  );
};

export default FormulaireCours;
