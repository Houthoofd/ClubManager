import React, { useState, useEffect } from 'react';
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
import { API_BASE_URL } from '../../config';
import type { UserDataInscription, Abonnement } from '../../../packages/types/dist/index';
import { userInscriptionSchema } from '../../../packages/types/dist/index';

// Page d'inscription
export const InscriptionPage: React.FC = () => {
  // Utilise le type UserDataInscription pour le state
  const [form, setForm] = useState<UserDataInscription>({
    prenom: '',
    nom: '', // Remplace username par nom
    email: '',
    password: '',
    date: '',
    abonnement: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [abonnementOptions, setAbonnementOptions] = useState<
    { value: string; label: string; disabled?: boolean }[]
  >([
    { value: '', label: 'Sélectionner un abonnement', disabled: true }
  ]);
  const [showRecap, setShowRecap] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const url = API_BASE_URL.endsWith('/')
      ? `${API_BASE_URL}api/informations/abonnements`
      : `${API_BASE_URL}/api/informations/abonnements`;

    fetch(url)
      .then(res => res.json())
      .then((data: Abonnement[]) => {
        // Utilise uniquement setAbonnementOptions, retire abonnementOptionsRaw
        const options = [
          { value: '', label: 'Sélectionner un abonnement', disabled: true },
          ...data.map(item => ({
            value: String(item.id), // Utilise l'id comme value
            label: `${item.nom_plan}`,
            disabled: false
          }))
        ];
        setAbonnementOptions(options);
      })
      .catch(() => {
        setAbonnementOptions([
          { value: '', label: 'Erreur de chargement', disabled: true }
        ]);
      });
  }, []);

  const handleChange = (value: string, name: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Affiche la fenêtre de récapitulatif
    setShowRecap(true);
  };

  const handleCancelRecap = () => {
    setShowRecap(false);
    setModalMessage(null);
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setModalMessage(null);

    try {
      // Vérifie si l'utilisateur existe déjà
      const checkUrl = API_BASE_URL.endsWith('/')
        ? `${API_BASE_URL}api/inscription/verification`
        : `${API_BASE_URL}/api/inscription/verification`;

      const checkRes = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });

      if (checkRes.status === 409) {
        setModalMessage("Cet utilisateur existe déjà. Veuillez utiliser une autre adresse email.");
        setIsLoading(false);
        return;
      }
      console.log(form)
      // Inscription
      const registerUrl = API_BASE_URL.endsWith('/')
        ? `${API_BASE_URL}api/inscription/validation`
        : `${API_BASE_URL}/api/inscription/validation`;

      // Ici, on envoie l'id directement
      const abonnementId = form.abonnement;
      console.log({ ...form, abonnement: abonnementId })
      const registerRes = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, abonnement: abonnementId })
      });
      const registerData = await registerRes.json();

      if (registerRes.status === 201) {
        setModalMessage("Inscription réussie !");
        setSuccess(true);
      } else {
        setModalMessage(registerData.message || "Erreur lors de l'inscription.");
      }
    } catch {
      setModalMessage("Erreur serveur lors de l'inscription.");
    }
    setIsLoading(false);
  };

  // Fonction pour calculer la fiabilité du mot de passe
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 10) score++;
    if (score <= 1) return { label: 'Faible', color: 'red', value: 20 };
    if (score === 2) return { label: 'Moyen', color: 'orange', value: 40 };
    if (score === 3) return { label: 'Bon', color: 'gold', value: 60 };
    if (score === 4) return { label: 'Fort', color: 'green', value: 80 };
    return { label: 'Excellent', color: 'darkgreen', value: 100 };
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
          {/* Jauge de fiabilité */}
          {form.password && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  height: 8,
                  width: '100%',
                  background: '#eee',
                  borderRadius: 4,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${getPasswordStrength(form.password).value}%`,
                    background: getPasswordStrength(form.password).color,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: getPasswordStrength(form.password).color }}>
                Fiabilité : {getPasswordStrength(form.password).label}
              </span>
            </div>
          )}
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
            {abonnementOptions.map(option => (
              <FormSelectOption
                key={option.value}
                value={option.value}
                label={option.label}
                isDisabled={option.disabled}
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
        aria-describedby="recap-modal-body"
      >
        <ModalHeader
          title="Récapitulatif de l'inscription"
          labelId="recap-modal-title"
          help={
            <Popover
              headerContent={<div>Aide sur le récapitulatif</div>}
              bodyContent={
                <div>
                  Vérifiez vos informations avant de confirmer votre inscription.
                </div>
              }
              footerContent="Contactez le support si besoin."
            >
              <Button variant="plain" aria-label="Help" icon={<HelpIcon />} />
            </Popover>
          }
        />
        <ModalBody id="recap-modal-body" style={{ minHeight: 400 }}>
          <p><strong>Prénom :</strong> {form.prenom}</p>
          <p><strong>Nom :</strong> {form.nom}</p>
          <p><strong>Email :</strong> {form.email}</p>
          <p><strong>Date d'inscription :</strong> {form.date}</p>
          <p>
            <strong>Type d'abonnement :</strong>{' '}
            {
              abonnementOptions.find(opt => opt.value === form.abonnement)?.label ||
              form.abonnement
            }
          </p>
          {isLoading && <p>Chargement...</p>}
          {modalMessage && (
            <Alert
              variant={modalMessage === "Inscription réussie !" ? "success" : "danger"}
              title={modalMessage}
              isInline
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button key="confirm" variant="primary" onClick={handleConfirm} isDisabled={isLoading}>
            Confirmer
          </Button>
          <Button key="cancel" variant="link" onClick={handleCancelRecap} isDisabled={isLoading}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default InscriptionPage;