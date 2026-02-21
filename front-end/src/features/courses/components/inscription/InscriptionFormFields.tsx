import React from "react";
import {
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  Alert,
} from "@patternfly/react-core";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import {
  InscriptionFormData as FormData,
  InscriptionValidationState as ValidationState,
} from "@clubmanager/types";

interface InscriptionFormFieldsProps {
  form: FormData;
  validation: ValidationState;
  passwordStrength: number;
  showPasswordRequirements: boolean;
  abonnementOptions: Array<{ value: string; label: string; prix: number }>;
  genreOptions: Array<{ value: string; label: string }>;
  onFieldChange: (value: string, name: string) => void;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
}

export const InscriptionFormFields: React.FC<InscriptionFormFieldsProps> = ({
  form,
  validation,
  passwordStrength,
  showPasswordRequirements,
  abonnementOptions,
  genreOptions,
  onFieldChange,
  onPasswordFocus,
  onPasswordBlur,
}) => {
  return (
    <>
      {/* Nom et Prénom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <FormGroup
          label="Prénom"
          isRequired
          fieldId="prenom"
          validated={validation.prenom?.validated}
        >
          <TextInput
            id="prenom"
            value={form.prenom}
            onChange={(e) => onFieldChange(e.currentTarget.value, "prenom")}
            placeholder="Entrez votre prénom"
            validated={validation.prenom?.validated}
            maxLength={30}
          />
          {validation.prenom && (
            <HelperText>
              <HelperTextItem variant={validation.prenom.validated}>
                {validation.prenom.message}
              </HelperTextItem>
            </HelperText>
          )}
        </FormGroup>

        <FormGroup label="Nom" isRequired fieldId="nom" validated={validation.nom?.validated}>
          <TextInput
            id="nom"
            value={form.nom}
            onChange={(e) => onFieldChange(e.currentTarget.value, "nom")}
            placeholder="Entrez votre nom"
            validated={validation.nom?.validated}
            maxLength={30}
          />
          {validation.nom && (
            <HelperText>
              <HelperTextItem variant={validation.nom.validated}>
                {validation.nom.message}
              </HelperTextItem>
            </HelperText>
          )}
        </FormGroup>
      </div>

      {/* Email */}
      <FormGroup label="Email" isRequired fieldId="email" validated={validation.email?.validated}>
        <TextInput
          type="email"
          id="email"
          value={form.email}
          onChange={(e) => onFieldChange(e.currentTarget.value, "email")}
          placeholder="Entrez votre email"
          validated={validation.email?.validated}
          maxLength={100}
        />
        {validation.email && (
          <HelperText>
            <HelperTextItem variant={validation.email.validated}>
              {validation.email.message}
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>

      {/* Mot de passe */}
      <FormGroup
        label="Mot de passe"
        isRequired
        fieldId="password"
        validated={validation.password?.validated}
      >
        <TextInput
          type="password"
          id="password"
          value={form.password}
          onChange={(e) => onFieldChange(e.currentTarget.value, "password")}
          onFocus={onPasswordFocus}
          onBlur={onPasswordBlur}
          placeholder="Créez un mot de passe"
          validated={validation.password?.validated}
          maxLength={128}
        />
        {form.password && <PasswordStrengthIndicator strength={passwordStrength} />}
        {showPasswordRequirements && (
          <HelperText>
            <HelperTextItem>
              Le mot de passe doit contenir :
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                <li>Au moins 8 caractères</li>
                <li>Une majuscule et une minuscule</li>
                <li>Au moins un chiffre</li>
                <li>Un caractère spécial (@$!%*?&)</li>
              </ul>
            </HelperTextItem>
          </HelperText>
        )}
        {validation.password && !showPasswordRequirements && (
          <HelperText>
            <HelperTextItem variant={validation.password.validated}>
              {validation.password.message}
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>

      {/* Confirmation mot de passe */}
      <FormGroup
        label="Confirmer le mot de passe"
        isRequired
        fieldId="confirmPassword"
        validated={validation.confirmPassword?.validated}
      >
        <TextInput
          type="password"
          id="confirmPassword"
          value={form.confirmPassword}
          onChange={(e) => onFieldChange(e.currentTarget.value, "confirmPassword")}
          placeholder="Confirmez votre mot de passe"
          validated={validation.confirmPassword?.validated}
        />
        {validation.confirmPassword && (
          <HelperText>
            <HelperTextItem variant={validation.confirmPassword.validated}>
              {validation.confirmPassword.message}
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>

      {/* Date de naissance */}
      <FormGroup
        label="Date de naissance"
        isRequired
        fieldId="date_naissance"
        validated={validation.date_naissance?.validated}
      >
        <TextInput
          type="date"
          id="date_naissance"
          value={form.date_naissance}
          onChange={(e) => onFieldChange(e.currentTarget.value, "date_naissance")}
          validated={validation.date_naissance?.validated}
          max={new Date().toISOString().split("T")[0]}
          min={`${new Date().getFullYear() - 100}-01-01`}
        />
        {validation.date_naissance && (
          <HelperText>
            <HelperTextItem variant={validation.date_naissance.validated}>
              {validation.date_naissance.message}
            </HelperTextItem>
          </HelperText>
        )}
        <HelperText>
          <HelperTextItem>⚠️ Âge minimum requis : 5 ans révolus</HelperTextItem>
        </HelperText>
      </FormGroup>

      {/* Abonnement et Genre */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <FormGroup label="Type d'abonnement" isRequired fieldId="abonnement">
          <FormSelect
            value={form.abonnement}
            onChange={(_event, value) => onFieldChange(value, "abonnement")}
            aria-label="Type d'abonnement"
          >
            <FormSelectOption value="" label="Sélectionner un abonnement" isDisabled />
            {abonnementOptions.map((option) => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={`${option.label} - ${option.prix}€`}
              />
            ))}
          </FormSelect>
        </FormGroup>

        <FormGroup label="Genre" isRequired fieldId="genre">
          <FormSelect
            value={form.genre}
            onChange={(_event, value) => onFieldChange(value, "genre")}
            aria-label="Genre"
          >
            <FormSelectOption value="" label="Sélectionner un genre" isDisabled />
            {genreOptions.map((option) => (
              <FormSelectOption key={option.value} value={option.value} label={option.label} />
            ))}
          </FormSelect>
        </FormGroup>
      </div>

      {/* Info nom d'utilisateur */}
      {form.nom_utilisateur && (
        <Alert variant="info" isInline title="Informations générées automatiquement">
          <p>
            <strong>Nom d'utilisateur :</strong> {form.nom_utilisateur}
          </p>
          <small>
            Un identifiant unique (UserId) sera automatiquement généré lors de l'inscription.
          </small>
        </Alert>
      )}
    </>
  );
};
