import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Card,
  Title,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import { SaveIcon } from '@/shared/icons';

interface FormulaireUtilisateurAjoutProps {
  prenom: string;
  nom: string;
  email: string;
  dateNaissance: string;
  genre: string;
  abonnement: string;
  grade: string;
  statut: string;
  abonnements: { id: string; label: string }[];
  grades: { id: string; label: string }[];
  statuts: { id: string; label: string }[];
  genres: { id: string; label: string }[]; // Ajout de la propriété genres
  onPrenomChange: (value: string) => void;
  onNomChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onDateNaissanceChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onAbonnementChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onStatutChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  emailError?: string;
}

const FormulaireUtilisateurAjout: React.FC<FormulaireUtilisateurAjoutProps> = ({
  prenom,
  nom,
  email,
  dateNaissance,
  genre,
  abonnement,
  grade,
  statut,
  abonnements,
  grades,
  statuts,
  genres, // Ajout de genres dans les props destructurées
  onPrenomChange,
  onNomChange,
  onEmailChange,
  onDateNaissanceChange,
  onGenreChange,
  onAbonnementChange,
  onGradeChange,
  onStatutChange,
  onSubmit,
  emailError = "",
}) => {
  return (
    <Card style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <Title headingLevel="h3" style={{ marginBottom: '1.5rem', color: '#333' }}>
        Ajouter un utilisateur
      </Title>

      <Form onSubmit={onSubmit}>
        {/* Section Informations personnelles */}
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '1.5rem'
        }}>
          <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
            Informations personnelles
          </Title>

          <FormGroup label="Prénom" isRequired fieldId="prenom">
            <TextInput
              isRequired
              type="text"
              id="prenom"
              value={prenom || ''} // Assurez-vous que la valeur est une chaîne vide par défaut
              onChange={(e) => onPrenomChange(e.target.value)} // Utilisez `e.target.value` directement
              style={{ borderRadius: '6px' }}
            />
          </FormGroup>

          <FormGroup label="Nom" isRequired fieldId="nom">
            <TextInput
              isRequired
              type="text"
              id="nom"
              value={nom || ''} // Assurez-vous que la valeur est une chaîne vide par défaut
              onChange={(e) => onNomChange(e.target.value)} // Utilisez directement `value`
              style={{ borderRadius: '6px' }}
            />
          </FormGroup>

          <FormGroup
            label="Adresse email"
            isRequired
            fieldId="email"
            validated={emailError ? "error" : "default"}
            helperText={emailError}
            helperTextInvalid={emailError}
          >
            <TextInput
              isRequired
              type="email"
              id="email"
              value={email || ''} // Assurez-vous que la valeur est une chaîne vide par défaut
              onChange={(e) => onEmailChange(e.target.value)} // Utilisez directement `value`
              style={{ borderRadius: '6px' }}
              validated={emailError ? "error" : "default"}
            />
          </FormGroup>

          <FormGroup label="Date de naissance" isRequired fieldId="date-naissance">
            <TextInput
              isRequired
              type="date"
              id="date-naissance"
              value={dateNaissance || ''} // Assurez-vous que la valeur est une chaîne vide par défaut
              onChange={(e) => onDateNaissanceChange(e.target.value)} // Utilisez e.target.value pour récupérer la valeur
              style={{ borderRadius: '6px' }}
            />
          </FormGroup>

          <FormGroup label="Genre" isRequired fieldId="genre">
            <FormSelect
              id="genre"
              value={genre || ''} // Assurez-vous que la valeur est une chaîne vide par défaut
              onChange={(_, value) => onGenreChange(value)} // Appel de la fonction pour mettre à jour le genre
              style={{ borderRadius: '6px' }}
            >
              <FormSelectOption isDisabled value="" label="Sélectionner un genre" />
              {genres.map((option) => (
                <FormSelectOption key={option.id} value={option.id} label={option.label} />
              ))}
            </FormSelect>
          </FormGroup>
        </div>

        {/* Section Informations du club */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '1.5rem'
        }}>
          <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem', color: '#495057' }}>
            Informations du club
          </Title>

          <FormGroup label="Abonnement" isRequired fieldId="abonnement">
            <FormSelect
              id="abonnement"
              value={abonnement}
              onChange={(_, value) => onAbonnementChange(value)}
              style={{ borderRadius: '6px' }}
            >
              <FormSelectOption isDisabled value="" label="Sélectionner un abonnement" />
              {abonnements.map((option) => (
                <FormSelectOption key={option.id} value={option.id} label={option.label} />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label="Grade" isRequired fieldId="grade">
            <FormSelect
              id="grade"
              value={grade}
              onChange={(_, value) => onGradeChange(value)}
              style={{ borderRadius: '6px' }}
            >
              <FormSelectOption isDisabled value="" label="Sélectionner un grade" />
              {grades.map((option) => (
                <FormSelectOption key={option.id} value={option.id} label={option.label} />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label="Statut" isRequired fieldId="statut">
            <FormSelect
              id="statut"
              value={statut}
              onChange={(_, value) => onStatutChange(value)} // Appel de la fonction pour mettre à jour le statut
              style={{ borderRadius: '6px' }}
            >
              <FormSelectOption isDisabled value="" label="Sélectionner un statut" />
              {statuts.map((option) => (
                <FormSelectOption key={option.id} value={option.id} label={option.label} />
              ))}
            </FormSelect>
          </FormGroup>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <Button
            type="submit" // Assurez-vous que le type est "submit"
            variant="primary"
            size="lg"
            style={{ padding: '0.75rem 2rem' }}
            icon={<SaveIcon />}
          >
            Ajouter l'utilisateur
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default FormulaireUtilisateurAjout;
