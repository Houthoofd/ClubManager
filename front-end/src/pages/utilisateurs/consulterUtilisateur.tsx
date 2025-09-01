import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
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
import { apiUrl } from '../apiUrl';
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

type PaiementEcheance = {
  id: number;
  montant: number;
  date_echeance: string;
  statut: string;
  abonnement_id?: number;
};

function formatDateForInput(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ConsulterUtilisateurPage = () => {
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
  const [paiementsEcheances, setPaiementsEcheances] = useState<PaiementEcheance[]>([]);
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

  useEffect(() => {
    const fetchUtilisateur = async () => {
      try {
        const response = await fetch(apiUrl(`utilisateurs/${id}`));
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données.');
        }
        const result = await response.json();
        const utilisateur = result.utilisateur;
        if (utilisateur) {
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
        } else {
          throw new Error('Utilisateur non trouvé.');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchUtilisateur();

    // Fetch statistiques de fréquentation
    if (id) {
      fetch(apiUrl(`statistiques/frequentation/${id}`))
        .then(res => res.json())
        .then(data => setStatFrequentation(data))
        .catch(() => setStatFrequentation(null));
    }

    // Fetch abonnements, grades, status
    fetch(apiUrl('informations/abonnements'))
      .then(res => res.json())
      .then(data => setAbonnements(data))
      .catch(() => setAbonnements([]));

    fetch(apiUrl('informations/grades'))
      .then(res => res.json())
      .then(data => setGradesList(data))
      .catch(() => setGradesList([]));

    fetch(apiUrl('informations/status'))
      .then(res => res.json())
      .then(data => setStatusList(data))
      .catch(() => setStatusList([]));

    // Récupérer les échéances de paiement pour l'utilisateur
    if (id) {
      fetch(apiUrl(`paiements/echeances/${id}`))
        .then(res => res.json())
        .then(data => {
          // Correction : s'assurer que c'est toujours un tableau
          setPaiementsEcheances(Array.isArray(data) ? data : []);
        })
        .catch(() => setPaiementsEcheances([]));
    }
  }, [id]);

  console.log(paiementsEcheances)

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

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert variant="danger" title={error} />;
  if (!form) return null;

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        Informations de {form.prenom} {form.nom}
      </Title>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Nom :" fieldId="last-name">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="last-name"
                  value={form.nom}
                  isDisabled
                />
              </div>
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="first-name"
                  value={form.prenom}
                  isDisabled
                />
              </div>
            </FormGroup>
            <FormGroup label="Email :" fieldId="email">
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            </FormGroup>
            <Button
              variant="primary"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setPendingChanges(getChangesSummary());
                setIsModalOpen(true);
              }}
            >
              Voir les changements effectués
            </Button>
          </Form>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Genre" fieldId="genre">
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            </FormGroup>
            <FormGroup label="Grade" fieldId="grade">
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            </FormGroup>
            <FormGroup label="Abonnement" fieldId="abonnement">
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            </FormGroup>
          </Form>
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Rôles et Statut</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Rôle" fieldId="role">
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
            </FormGroup>
          </Form>
        </Tab>
        {/* Tab Paiements */}
        <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
          <Title headingLevel="h2" style={{ marginBottom: 16 }}>Échéances de paiement</Title>
          {paiementsEcheances.length === 0 ? (
            <p>Aucune échéance trouvée pour cet utilisateur.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Montant (€)</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date d'échéance</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {paiementsEcheances.map((p, idx) => {
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return '';
                    const d = new Date(dateStr);
                    return d.toLocaleDateString();
                  };
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.montant}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDate(p.date_echeance)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{p.statut}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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

const ConsulterUtilisateur = () => (
  <Provider store={store}>
    <ConsulterUtilisateurPage />
  </Provider>
);

export default ConsulterUtilisateur;

