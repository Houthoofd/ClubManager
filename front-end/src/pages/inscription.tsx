import React, { useState } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Title,
  Alert,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Popover
} from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { userInscriptionSchema } from '../../../packages/types/dist/index';
import {
  useAbonnementOptions,
  useGenreOptions,
  useVerifierUtilisateur,
  useInscrireUtilisateur
} from '../hooks/useInscriptions';

// Page d'inscription
export const InscriptionPage: React.FC = () => {
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    date: '',
    abonnement: '',
    genre: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // Utilisation des hooks React Query
  const { data: abonnementOptions = [] } = useAbonnementOptions();
  const { data: genreOptions = [] } = useGenreOptions();
  const verifierUtilisateur = useVerifierUtilisateur();
  const inscrireUtilisateur = useInscrireUtilisateur();

  const handleChange = (value: string, name: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation avec Zod
    const result = userInscriptionSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0]?.message || "Données invalides.");
      return;
    }

    // Validation des champs
    if (!form.nom) {
      setError("Le nom d'utilisateur est obligatoire.");
      return;
    }
    if (!form.prenom) {
      setError("Le prénom est obligatoire.");
      return;
    }
    if (!form.email) {
      setError("L'adresse email est obligatoire.");
      return;
    }
    if (!form.email.includes('@')) {
      setError("Le format de l'adresse email est invalide.");
      return;
    }
    if (!form.password) {
      setError("Le mot de passe est obligatoire.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (!form.date) {
      setError("La date d'inscription est obligatoire.");
      return;
    }
    if (!form.abonnement) {
      setError("Le type d'abonnement est obligatoire.");
      return;
    }

    try {
      // Vérifie si l'utilisateur existe déjà
      await verifierUtilisateur.mutateAsync(form.email);
      // Affiche la fenêtre de récapitulatif
      setShowRecap(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelRecap = () => {
    setShowRecap(false);
    setModalMessage(null);
  };

  const handleConfirm = async () => {
    setModalMessage(null);

    try {
      // Inscription
      await inscrireUtilisateur.mutateAsync(form);
      setModalMessage("Inscription réussie !");
      setSuccess(true);
      setShowRecap(false);
    } catch (err: any) {
      setModalMessage(err.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 32 }}>
      <Title headingLevel="h1">Inscription</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup label="Prénom" isRequired fieldId="prenom">
          <TextInput
            isRequired
            type="text"
            id="prenom"
            name="prenom"
            value={form.prenom}
            onChange={e => handleChange(e.currentTarget.value, 'prenom')}
          />
        </FormGroup>
        <FormGroup label="Nom" isRequired fieldId="nom">
          <TextInput
            isRequired
            type="text"
            id="nom"
            name="nom"
            value={form.nom}
            onChange={e => handleChange(e.currentTarget.value, 'nom')}
          />
        </FormGroup>
        <FormGroup label="Email" isRequired fieldId="email">
          <TextInput
            isRequired
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={e => handleChange(e.currentTarget.value, 'email')}
          />
        </FormGroup>
        <FormGroup label="Mot de passe" isRequired fieldId="password">
          <TextInput
            isRequired
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={e => handleChange(e.currentTarget.value, 'password')}
          />
        </FormGroup>
        <FormGroup label="Date d'inscription" isRequired fieldId="date">
          <TextInput
            isRequired
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={e => handleChange(e.currentTarget.value, 'date')}
          />
        </FormGroup>
        <FormGroup label="Type d'abonnement" isRequired fieldId="abonnement">
          <FormSelect
            value={form.abonnement}
            onChange={(_event, value) => handleChange(value, 'abonnement')}
            aria-label="Type d'abonnement"
          >
            <FormSelectOption value="" label="Sélectionner un abonnement" isDisabled />
            {abonnementOptions.map(option => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Genre" isRequired fieldId="genre">
          <FormSelect
            value={form.genre}
            onChange={(_event, value) => handleChange(value, 'genre')}
            aria-label="Genre"
          >
            <FormSelectOption value="" label="Sélectionner un genre" isDisabled />
            {genreOptions.map(option => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </FormSelect>
        </FormGroup>
        {error && <Alert variant="danger" title={error} />}
        {success && <Alert variant="success" title="Inscription réussie !" />}
        <Button type="submit" variant="primary">S'inscrire</Button>
      </Form>
      <Modal
        variant="medium"
        isOpen={showRecap}
        onClose={handleCancelRecap}
        aria-labelledby="recap-modal-title"
      >
        <ModalHeader title="Récapitulatif de l'inscription" />
        <ModalBody>
          <p><strong>Prénom :</strong> {form.prenom}</p>
          <p><strong>Nom :</strong> {form.nom}</p>
          <p><strong>Email :</strong> {form.email}</p>
          <p><strong>Genre :</strong> {form.genre}</p>
          <p><strong>Date d'inscription :</strong> {form.date}</p>
          <p><strong>Type d'abonnement :</strong> {form.abonnement}</p>
          {modalMessage && (
            <Alert
              variant={modalMessage === "Inscription réussie !" ? "success" : "danger"}
              title={modalMessage}
              isInline
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleConfirm}>
            Confirmer
          </Button>
          <Button variant="link" onClick={handleCancelRecap}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default InscriptionPage;