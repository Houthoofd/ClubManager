import React, { useState } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  PageSection,
  Bullseye,
  AlertVariant
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { userInscriptionSchema } from '../../../packages/types/dist/index';
import {
  useAbonnementOptions,
  useGenreOptions,
  useVerifierUtilisateur,
  useInscrireUtilisateur
} from '../hooks/useInscriptions';
import '../styles/connexion.css'; // Import du même fichier CSS

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
    <div className="inscription-page">
      {/* Background decorative elements */}
      <div className="login-background-decoration" />

      <PageHeader
        title="Club Manager"
        subtitle="Inscrivez-vous pour rejoindre notre club"
        variant="inscription"
      />

      <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
        <Bullseye style={{ width: '100%' }}>
          <div className="login-container">
            {/* Logo/Icon section */}
            <div className="login-header">
              <div className="login-logo">🥋</div>
              <h1 className="login-title">Rejoignez-nous</h1>
              <p className="login-subtitle">
                Créez votre compte pour commencer votre parcours
              </p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert
                  variant={AlertVariant.danger}
                  title="Erreur d'inscription"
                  isInline
                  className="login-error"
                >
                  {error}
                </Alert>
              )}

              <FormGroup label="Prénom" isRequired fieldId="prenom" className="login-form-group">
                <TextInput
                  isRequired
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={form.prenom}
                  onChange={e => handleChange(e.currentTarget.value, 'prenom')}
                  placeholder="Entrez votre prénom"
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Nom" isRequired fieldId="nom" className="login-form-group">
                <TextInput
                  isRequired
                  type="text"
                  id="nom"
                  name="nom"
                  value={form.nom}
                  onChange={e => handleChange(e.currentTarget.value, 'nom')}
                  placeholder="Entrez votre nom"
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Email" isRequired fieldId="email" className="login-form-group">
                <TextInput
                  isRequired
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={e => handleChange(e.currentTarget.value, 'email')}
                  placeholder="Entrez votre email"
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Mot de passe" isRequired fieldId="password" className="login-form-group">
                <TextInput
                  isRequired
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={e => handleChange(e.currentTarget.value, 'password')}
                  placeholder="Créez un mot de passe"
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Date de naissance" isRequired fieldId="date_naissance" className="login-form-group">
                <TextInput
                  isRequired
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={form.date_naissance}
                  onChange={e => handleChange(e.currentTarget.value, 'date_naissance')}
                  className="login-input"
                />
              </FormGroup>

              <FormGroup label="Type d'abonnement" isRequired fieldId="abonnement" className="login-form-group">
                <FormSelect
                  value={form.abonnement !== undefined && form.abonnement !== null ? String(form.abonnement) : ''}
                  onChange={(_event, value) => handleChange(value, 'abonnement')}
                  aria-label="Type d'abonnement"
                  className="login-input"
                >
                  <FormSelectOption value="" label="Sélectionner un abonnement" isDisabled />
                  {abonnementOptions.map(option => (
                    <FormSelectOption
                      key={option.id}
                      value={String(option.id)}
                      label={`${option.label} - ${option.prix} euros`}
                    />
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup label="Genre" isRequired fieldId="genre" className="login-form-group">
                <FormSelect
                  value={form.genre !== undefined && form.genre !== null ? String(form.genre) : ''}
                  onChange={(_event, value) => handleChange(value, 'genre')}
                  aria-label="Genre"
                  className="login-input"
                >
                  <FormSelectOption value="" label="Sélectionner un genre" isDisabled />
                  {genreOptions.map(option => (
                    <FormSelectOption
                      key={option.id}
                      value={String(option.id)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              </FormGroup>

              <div className="login-actions">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={inscrireUtilisateur.isPending}
                  isDisabled={inscrireUtilisateur.isPending}
                  className="login-button"
                >
                  {inscrireUtilisateur.isPending ? "Création du compte..." : "S'inscrire"}
                </Button>
              </div>

              <div className="login-footer">
                <p>
                  Déjà un compte ?{' '}
                  <Link to="/connexion" className="login-link">
                    Connectez-vous ici
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </Bullseye>
      </PageSection>

      {/* Modal de récapitulatif */}
      <Modal
        variant="medium"
        isOpen={showRecap}
        onClose={handleCancelRecap}
        aria-labelledby="recap-modal-title"
      >
        <ModalHeader title="Récapitulatif de l'inscription" />
        <ModalBody>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <p><strong>Prénom :</strong> {form.prenom}</p>
            <p><strong>Nom :</strong> {form.nom}</p>
            <p><strong>Email :</strong> {form.email}</p>
            <p><strong>Genre :</strong> {genreOptions.find(g => String(g.id) === form.genre)?.label}</p>
            <p><strong>Date de naissance :</strong> {form.date_naissance}</p>
            <p style={{ margin: 0 }}>
              <strong>Type d'abonnement :</strong> {abonnementOptions.find(a => String(a.id) === form.abonnement)?.label}
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
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            isLoading={inscrireUtilisateur.isPending}
            isDisabled={inscrireUtilisateur.isPending}
          >
            {inscrireUtilisateur.isPending ? "Inscription..." : "Confirmer"}
          </Button>
          <Button variant="link" onClick={handleCancelRecap}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de succès */}
      <Modal
        variant="small"
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        aria-labelledby="success-modal-title"
      >
        <ModalHeader title="Inscription réussie !" />
        <ModalBody>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{
              fontSize: '3rem',
              color: '#28a745',
              marginBottom: '1rem'
            }}>
              ✅
            </div>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Votre inscription a été effectuée avec succès. Vous pouvez maintenant vous connecter.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="primary" 
            onClick={() => setShowSuccessModal(false)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Fermer
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default InscriptionPage;