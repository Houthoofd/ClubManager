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
    date_naissance: '', // Remplace 'date' par 'date_naissance'
    abonnement: '',
    genre: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // État pour la modal de succès

  // Utilisation des hooks React Query
  const { data: abonnementOptions = [] } = useAbonnementOptions();
  const { data: genreOptions = [] } = useGenreOptions();
  const verifierUtilisateur = useVerifierUtilisateur();
  const inscrireUtilisateur = useInscrireUtilisateur();

  console.log(abonnementOptions, genreOptions);

  const handleChange = (value: string, name: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Ajout du nom_utilisateur avant validation
    const nom_utilisateur = `${form.prenom.toLowerCase()}.${form.nom.toLowerCase()}`;
    const formWithUsername = { ...form, nom_utilisateur };

    // Validation avec Zod
    const result = userInscriptionSchema.safeParse({
      ...formWithUsername,
      date: form.date_naissance // Pour compatibilité avec le schéma existant
    });
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
    if (!form.date_naissance) {
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
      setShowRecap(true);
      setForm(formWithUsername); // Met à jour le form avec nom_utilisateur pour la suite
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
      // Prépare le payload complet pour le backend
      const dataToSend = {
        prenom: form.prenom,
        nom: form.nom,
        nom_utilisateur: form.nom_utilisateur,
        email: form.email,
        password: form.password,
        genre_id: typeof form.genre === 'string' ? Number(form.genre) : form.genre,
        abonnement_id: typeof form.abonnement === 'string' ? Number(form.abonnement) : form.abonnement,
        date_naissance: form.date_naissance,
        date_inscription: new Date().toISOString().split('T')[0],
        status_id: 1,
        grade_id: 1,
      };
      console.log('[Inscription] Données envoyées au backend :', dataToSend);
      await inscrireUtilisateur.mutateAsync(dataToSend);
      setModalMessage("Inscription réussie !");
      setSuccess(true);
      setShowRecap(false);
      setShowSuccessModal(true);
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
        <FormGroup label="Date de naissance" isRequired fieldId="date_naissance">
          <TextInput
            isRequired
            type="date"
            id="date_naissance"
            name="date_naissance"
            value={form.date_naissance}
            onChange={e => handleChange(e.currentTarget.value, 'date_naissance')}
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
                key={option.id}
                value={option.id}
                label={`${option.nom_plan} - ${option.description}`}
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
                key={option.id}
                value={option.id}
                label={option.genre_name}
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
          <p><strong>Date de naissance :</strong> {form.date_naissance}</p>
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
      <Modal
        variant="small"
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        aria-labelledby="success-modal-title"
      >
        <ModalHeader title="Inscription réussie !" />
        <ModalBody>
          Votre inscription a été effectuée avec succès. Vous pouvez maintenant vous connecter.
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default InscriptionPage;