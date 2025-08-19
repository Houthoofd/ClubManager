import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Tabs,
  Tab,
  TabTitleText,
  Form,
  FormGroup,
  TextInput,
  PageSection,
  Title,
  Spinner,
  Alert,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalVariant,
} from '@patternfly/react-core';
import { apiUrl } from './apiUrl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';
import { Alert as PfAlert } from '@patternfly/react-core';

type UtilisateurType = {
  id: number;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  password: string;
  genres: string;
  status: string;
  grades: string;
  abonnement: string;
  date_of_birth: string;
};

type StatFrequentationType = {
  totalFrequentation: number;
  frequentationParMois: {
    mois: string;
    frequentation: number;
    nombres_total_de_cours_du_mois: number;
    pourcentage_de_cours_valides: number;
  }[];
};

type AbonnementInfo = {
  id: number;
  nom_plan: string;
  prix: number;
  periode: string;
  description: string;
};

type GradeInfo = {
  id: number;
  grade_id: string;
};

type StatusInfo = {
  id: number;
  nom_role: string;
  description: string;
};

function formatDateForInput(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Compte = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [statFrequentation, setStatFrequentation] = useState<StatFrequentationType | null>(null);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showDbLog, setShowDbLog] = useState(false);
  const [abonnements, setAbonnements] = useState<AbonnementInfo[]>([]);
  const [gradesList, setGradesList] = useState<GradeInfo[]>([]);
  const [statusList, setStatusList] = useState<StatusInfo[]>([]);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [form, setForm] = useState<{
    id: number | null;
    prenom: string;
    nom: string;
    email: string;
    date_naissance: string;
    abonnement: string;
    genres: string;
    grades: string;
    nom_utilisateur: string;
    status: string;
    mot_de_passe: string;
  }>({
    id: null,
    prenom: '',
    nom: '',
    email: '',
    date_naissance: '',
    abonnement: '',
    genres: '',
    grades: '',
    nom_utilisateur: '',
    status: '',
    mot_de_passe: '',
  });
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [passwordError, setPasswordError] = useState<string>('');

  useEffect(() => {
    // Récupère les infos utilisateur depuis le endpoint 'compte/informations'
    const fetchCompteInfo = async () => {
      try {
        // Récupère les infos de l'utilisateur depuis le localStorage ou autre source
        const storedData = localStorage.getItem('userData');
        let prenom = '';
        let nom = '';
        let userId = id;
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            prenom = parsedData.data?.prenom || '';
            nom = parsedData.data?.nom || '';
            userId = parsedData.data?.id || id;
          } catch (e) {}
        }

        const response = await fetch(apiUrl('compte/informations'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prenom, nom })
        });

        if (!response.ok) throw new Error('Erreur réseau');

        const result = await response.json();
        const utilisateur = result.utilisateur;

        let mot_de_passe = '';
        if (utilisateur.password) {
          mot_de_passe = '[Mot de passe non affichable : hash bcrypt]';
        }

        setForm({
          id: utilisateur.id ?? null,
          prenom: utilisateur.first_name || '',
          nom: utilisateur.last_name || '',
          email: utilisateur.email || '',
          date_naissance: utilisateur.date_of_birth || '',
          abonnement: String(utilisateur.abonnement ?? ''),
          genres: String(utilisateur.genres ?? ''),
          grades: String(utilisateur.grades ?? ''),
          nom_utilisateur: utilisateur.nom_utilisateur || '',
          status: String(utilisateur.status ?? ''),
          mot_de_passe,
        });
      } catch (error) {
        setError('Erreur lors de la récupération des données');
      } finally {
        setLoading(false);
      }
    };

    fetchCompteInfo();

    // Récupération des statistiques de fréquentation
    const fetchStatistiques = async () => {
      try {
        // Récupère l'id utilisateur depuis le localStorage
        let userId = id;
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            userId = parsedData.data?.id || id;
          } catch (e) {}
        }
        const response = await fetch(apiUrl(`statistiques/frequentation/${userId}`));
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setStatFrequentation(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      }
    };

    // Récupération des abonnements
    const fetchAbonnements = async () => {
      try {
        const response = await fetch(apiUrl('informations/abonnements'));
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setAbonnements(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
      }
    };

    // Récupération des grades
    const fetchGrades = async () => {
      try {
        const response = await fetch(apiUrl('informations/grades'));
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setGradesList(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des grades:', error);
      }
    };

    // Récupération des statuts
    const fetchStatus = async () => {
      try {
        const response = await fetch(apiUrl('informations/status'));
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setStatusList(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des statuts:', error);
      }
    };

    fetchStatistiques();
    fetchAbonnements();
    fetchGrades();
    fetchStatus();
  }, [id]);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number
  ) => {
    setActiveTabKey(Number(eventKey));
  };

  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    // Utilise les clés du form pour éviter l'erreur
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field]) {
        // @ts-ignore
        changes[field] = form[field];
      }
    });
    return changes;
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleValidateChanges = async () => {
    if (!form.id) return;

    // Vérification du format email
    if (editingFields['email']) {
      const email = form.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        setModalMessage("Veuillez entrer une adresse email valide.");
        setIsModalOpen(true);
        return;
      }
      // Vérification si l'email existe déjà dans la base
      const checkResponse = await fetch(apiUrl(`utilisateurs/verifier-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id: form.id })
      });
      const checkResult = await checkResponse.json();
      if (checkResult.exists) {
        setModalMessage("Cette adresse email est déjà utilisée par un autre utilisateur.");
        setIsModalOpen(true);
        return;
      }
    }

    // Prépare le body avec toutes les valeurs du formulaire (modifiées ou non)
    const body: any = {
      id: form.id,
      email: form.email,
      date_naissance: form.date_naissance,
      genres: form.genres,
      grades: form.grades,
      abonnement: form.abonnement,
      status: form.status
    };
    console.log(body)
    try {
      const response = await fetch(apiUrl(`utilisateurs/modifier`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        setModalMessage(result.message || 'Modifications enregistrées.');
        setShowDbLog(true);
        setTimeout(() => {
          setShowDbLog(false);
          setIsModalOpen(false);
        }, 1800);
      } else {
        setModalMessage(result.message || 'Erreur lors de la modification.');
        setShowDbLog(true);
      }
    } catch (error) {
      setModalMessage('Erreur réseau ou serveur.');
      setShowDbLog(true);
    }
  };

  const handleEmailChange = (value: string) => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
    setForm(prev => ({ ...prev, email: value }));
    setEmailCheckMessage('');
    // Lance la vérification après un court délai (user stop typing)
    const timeout = setTimeout(() => {
      checkEmailAvailability(value);
    }, 700);
    setEmailCheckTimeout(timeout);
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !form.id) {
      setEmailCheckMessage('');
      return;
    }
    const response = await fetch(apiUrl(`utilisateurs/verifier-email`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, id: form.id })
    });
    const result = await response.json();
    if (result.exists) {
      setEmailCheckMessage("Cette adresse email est déjà utilisée par un autre utilisateur.");
    } else {
      setEmailCheckMessage("Cette adresse email est disponible.");
    }
  };

  // Fonction de calcul de la fiabilité du mot de passe (simple)
  function getPasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }

  // Ajoute la gestion du changement de mot de passe (déplace la fonction avant le render)
  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(getPasswordStrength(value));
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setPasswordError('');
  };

  // Ajoute la gestion du changement/création de mot de passe
  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (passwordStrength < 3) {
      setPasswordError("Le mot de passe n'est pas assez sécurisé.");
      return;
    }
    try {
      let endpoint = '';
      if (!form.mot_de_passe || form.mot_de_passe === '') {
        endpoint = apiUrl('compte/creer-mot-de-passe');
      } else {
        endpoint = apiUrl('compte/changer-mot-de-passe');
      }
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id, password: newPassword }),
      });
      const result = await response.json();
      if (response.ok) {
        setModalMessage(result.message || 'Mot de passe enregistré.');
        setIsModalOpen(true); // Affiche la modal pour signaler le succès
        setShowPasswordEdit(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength(0);
        setPasswordError('');
        // Optionnel: refetch user info
      } else {
        setPasswordError(result.message || 'Erreur lors de la modification.');
      }
    } catch (error) {
      setPasswordError('Erreur réseau ou serveur.');
    }
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert variant="danger" title={error} />;
  if (!form) return null;

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        Mon compte
      </Title>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Nom :" fieldId="last-name">
              <TextInput
                id="last-name"
                value={form.nom}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <TextInput
                id="first-name"
                value={form.prenom}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Nom d'utilisateur :" fieldId="nom-utilisateur">
              <TextInput
                id="nom-utilisateur"
                value={form.nom_utilisateur}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Email :" fieldId="email">
              <TextInput
                id="email"
                value={form.email || ''}
                isDisabled={!editingFields['email']}
                onChange={(_event, value) => handleEmailChange(value)}
              />
              <Button
                variant="plain"
                onClick={() => handleEditClick('email')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['email'] ? "Terminer" : "Editer"}
              >
                {editingFields['email'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
              {editingFields['email'] && form.email && !form.email.includes('@') && (
                <div style={{ color: 'red', fontSize: '0.95rem', marginTop: 4 }}>
                  Veuillez entrer une adresse email valide contenant '@'
                </div>
              )}
              {editingFields['email'] && form.email && emailCheckMessage && (
                <div style={{
                  color: emailCheckMessage.includes('disponible') ? 'green' : 'red',
                  fontSize: '0.95rem',
                  marginTop: 4
                }}>
                  {emailCheckMessage}
                </div>
              )}
            </FormGroup>
            <FormGroup label="Date de naissance :" fieldId="dob">
              <TextInput
                id="dob"
                type="date"
                value={formatDateForInput(form.date_naissance)}
                onChange={(_event, value) =>
                  setForm({ ...form, date_naissance: value })
                }
                isDisabled={!editingFields['date_naissance']}
              />
              <Button
                variant="plain"
                onClick={() => handleEditClick('date_naissance')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['date_naissance'] ? "Terminer" : "Editer"}
              >
                {editingFields['date_naissance'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
            </FormGroup>
            <FormGroup label="Mot de passe :" fieldId="mot-de-passe">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="mot-de-passe"
                  value={form.mot_de_passe ? '********' : ''}
                  isDisabled
                  type="password"
                  style={{ width: 220 }}
                />
                {!form.mot_de_passe && (
                  <Button
                    variant="primary"
                    style={{ marginLeft: '1rem' }}
                    onClick={() => setShowPasswordEdit(true)}
                  >
                    Créer mot de passe
                  </Button>
                )}
                {form.mot_de_passe && !showPasswordEdit && (
                  <Button
                    variant="secondary"
                    style={{ marginLeft: '1rem' }}
                    onClick={() => setShowPasswordEdit(true)}
                  >
                    Changer mot de passe
                  </Button>
                )}
              </div>
              {!form.mot_de_passe && (
                <PfAlert
                  variant="warning"
                  title="Ce compte n'est pas sécurisé, aucun mot de passe n'est défini."
                  style={{ marginTop: 8 }}
                  isInline
                />
              )}
            </FormGroup>
            {showPasswordEdit && (
              <div style={{ marginTop: 12 }}>
                <FormGroup label="Nouveau mot de passe" fieldId="new-password">
                  <TextInput
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(_e, v) => handlePasswordChange(v)}
                    style={{ width: 220 }}
                  />
                  {/* Jauge de fiabilité */}
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        height: 8,
                        width: 220,
                        background: '#eee',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: 8,
                          width: `${passwordStrength * 44}px`,
                          background:
                            passwordStrength <= 2
                              ? '#ff9800'
                              : passwordStrength === 3
                              ? '#ffc107'
                              : passwordStrength === 4
                              ? '#8bc34a'
                              : '#4caf50',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#888', marginTop: 2 }}>
                      {passwordStrength <= 2
                        ? 'Faible'
                        : passwordStrength === 3
                        ? 'Moyen'
                        : passwordStrength === 4
                        ? 'Bon'
                        : 'Excellent'}
                    </div>
                  </div>
                </FormGroup>
                <FormGroup label="Confirmer le mot de passe" fieldId="confirm-password">
                  <TextInput
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(_e, v) => handleConfirmPasswordChange(v)}
                    style={{ width: 220 }}
                  />
                </FormGroup>
                {passwordError && (
                  <PfAlert
                    variant="danger"
                    title={passwordError}
                    style={{ marginTop: 8 }}
                    isInline
                  />
                )}
                <div style={{ marginTop: 8 }}>
                  <Button variant="primary" onClick={handleSavePassword}>
                    Enregistrer le mot de passe
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setShowPasswordEdit(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordStrength(0);
                      setPasswordError('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
            <Button
              variant="primary"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setPendingChanges(getChangesSummary());
                setIsModalOpen(true);
              }}
            >
              Voir les changements éffectués
            </Button>
          </Form>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Genre" fieldId="genre">
              <select
                id="genre"
                value={form.genres}
                onChange={e => setForm({ ...form, genres: e.target.value })}
                disabled={!editingFields['genres']}
                style={{
                  minWidth: 180,
                  padding: '6px',
                  borderRadius: 4,
                  background: editingFields['genres'] ? '#fff' : '#f0f0f0'
                }}
              >
                <option value="">Sélectionner un genre</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
                <option value="Autre">Autre</option>
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('genres')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['genres'] ? "Terminer" : "Editer"}
              >
                {editingFields['genres'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
            </FormGroup>
            <FormGroup label="Grade" fieldId="grade">
              <select
                id="grade"
                value={form.grades}
                onChange={e => setForm({ ...form, grades: e.target.value })}
                disabled={!editingFields['grades']}
                style={{
                  minWidth: 180,
                  padding: '6px',
                  borderRadius: 4,
                  background: editingFields['grades'] ? '#fff' : '#f0f0f0'
                }}
              >
                <option value="">Sélectionner un grade</option>
                {gradesList.map(grade => (
                  <option key={grade.id} value={grade.grade_id}>
                    {grade.grade_id}
                  </option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('grades')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['grades'] ? "Terminer" : "Editer"}
              >
                {editingFields['grades'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
            </FormGroup>
            <FormGroup label="Abonnement" fieldId="abonnement">
              <select
                id="abonnement"
                value={form.abonnement}
                onChange={e => setForm({ ...form, abonnement: e.target.value })}
                disabled={!editingFields['abonnement']}
                style={{
                  minWidth: 180,
                  padding: '6px',
                  borderRadius: 4,
                  background: editingFields['abonnement'] ? '#fff' : '#f0f0f0'
                }}
              >
                <option value="">Sélectionner un abonnement</option>
                {abonnements.map(ab => (
                  <option key={ab.id} value={ab.nom_plan}>
                    {ab.nom_plan} ({ab.prix}€/{ab.periode})
                  </option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('abonnement')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['abonnement'] ? "Terminer" : "Editer"}
              >
                {editingFields['abonnement'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
            </FormGroup>
          </Form>
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Rôles et Statut</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Rôle" fieldId="role">
              <select
                id="role"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                disabled={!editingFields['status']}
                style={{
                  minWidth: 180,
                  padding: '6px',
                  borderRadius: 4,
                  background: editingFields['status'] ? '#fff' : '#f0f0f0'
                }}
              >
                <option value="">Sélectionner un rôle</option>
                {statusList.map(role => (
                  <option key={role.id} value={role.nom_role}>
                    {role.nom_role}
                  </option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('status')}
                style={{ marginLeft: '1rem' }}
                aria-label={editingFields['status'] ? "Terminer" : "Editer"}
              >
                {editingFields['status'] ? (
                  <CheckIcon color="var(--pf-global--success-color--100)" />
                ) : (
                  <PencilAltIcon />
                )}
              </Button>
            </FormGroup>
          </Form>
        </Tab>
        {/* Tab Paiements */}
        <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
          <p>Contenu à venir pour les paiements.</p>
        </Tab>

        {/* Tab Statistiques */}
        <Tab eventKey={4} title={<TabTitleText>Statistiques</TabTitleText>}>
          <div>
            {statFrequentation && statFrequentation.frequentationParMois.length > 0 ? (
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <Title headingLevel="h2" style={{ marginBottom: 16 }}>Fréquentation par mois</Title>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={statFrequentation.frequentationParMois}
                    margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" angle={-45} textAnchor="end" interval={0} />
                    <YAxis yAxisId="left" label={{ value: 'Présences / Cours', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: '% validés', angle: -90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line yAxisId="left" type="monotone" dataKey="frequentation" name="Présences validées" stroke="#007bff" />
                    <Line yAxisId="left" type="monotone" dataKey="nombres_total_de_cours_du_mois" name="Cours total/mois" stroke="#28a745" strokeDasharray="5 5" />
                    <Line yAxisId="right" type="monotone" dataKey="pourcentage_de_cours_valides" name="% cours validés" stroke="#ffc107" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>Aucune statistique de fréquentation disponible.</p>
            )}
          </div>
        </Tab>
      </Tabs>
      {/* Modal doit être inclus dans un seul parent */}
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        aria-labelledby="modal-with-changes"
        aria-describedby="modal-box-body-with-changes"
      >
        <ModalHeader title="Résumé des changements" labelId="modal-with-changes" />
        <ModalBody id="modal-box-body-with-changes">
          <div>
            {Object.keys(pendingChanges).length === 0 ? (
              <p>Aucun changement détecté.</p>
            ) : (
              <ul>
                {Object.entries(pendingChanges).map(([field, value]) => (
                  <li key={field}>
                    <strong>{field} :</strong> {value}
                  </li>
                ))}
              </ul>
            )}
            {showDbLog && modalMessage && (
              <div
                style={{
                  background: '#e6f4ea',
                  color: '#20744a',
                  border: '1px solid #b7e4c7',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginTop: '1rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
              >
                {modalMessage}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button key="confirm" variant="primary" onClick={handleValidateChanges}>
            Valider
          </Button>
          <Button key="cancel" variant="secondary" onClick={handleModalToggle}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default Compte;

