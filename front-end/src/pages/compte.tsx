import { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  TabTitleText,
  TextInput,
  Form,
  FormGroup,
  Title,
  PageSection,
  Grid,
  GridItem,
  Spinner,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
} from '@patternfly/react-core';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { apiUrl } from './apiUrl';

// Définition d'un type spécial pour les infos du compte
type CompteUserInfo = {
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

const Compte = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showDbLog, setShowDbLog] = useState(false);

  const [form, setForm] = useState<CompteUserInfo>({
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

  const [abonnements, setAbonnements] = useState<AbonnementInfo[]>([]);
  const [gradesList, setGradesList] = useState<GradeInfo[]>([]);
  const [statusList, setStatusList] = useState<StatusInfo[]>([]);
  const [statFrequentation, setStatFrequentation] = useState<{
    totalFrequentation: number;
    frequentationParMois: {
      mois: string;
      frequentation: number;
      nombres_total_de_cours_du_mois: number;
      pourcentage_de_cours_valides: number;
    }[];
  } | null>(null);

  // Ajoutez un état pour l'id utilisateur
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (!storedData) return;

    try {
      const parsedData = JSON.parse(storedData);
      if (parsedData.data?.prenom && parsedData.data?.nom) {
        fetchData(parsedData.data.prenom, parsedData.data.nom);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Erreur lors du parsing de l'utilisateur :", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch abonnements pour le select
    fetch(apiUrl('informations/abonnements'))
      .then(res => res.json())
      .then(data => setAbonnements(data))
      .catch(() => setAbonnements([]));
  }, []);

  useEffect(() => {
    // Fetch grades pour le select
    fetch(apiUrl('informations/grades'))
      .then(res => res.json())
      .then(data => setGradesList(data))
      .catch(() => setGradesList([]));
  }, []);

  useEffect(() => {
    // Fetch status pour le select
    fetch(apiUrl('informations/status'))
      .then(res => res.json())
      .then(data => setStatusList(data))
      .catch(() => setStatusList([]));
  }, []);

  const fetchData = async (prenom: string, nom: string) => {
    try {
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

      // Stocke l'id utilisateur pour la modification
      if (utilisateur.id) setUserId(utilisateur.id);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string, name: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
    setIsDropdownOpen(false);
  };

  const onEscapePress = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      // Supprime l'appel à onFocus, car il n'est pas utilisé
    } else {
      handleModalToggle();
    }
  };

  // Fonction pour détecter les changements
  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field]) {
        changes[field] = form[field as keyof typeof form];
      }
    });
    return changes;
  };

  // Fonction pour envoyer la modification au backend
  const handleValidateChanges = async () => {
    if (!userId) {
      alert("Impossible de trouver l'id utilisateur.");
      return;
    }

    // Trouver les bons ids pour les valeurs sélectionnées
    const abonnementObj = abonnements.find(a => a.nom_plan === form.abonnement);
    const gradeObj = gradesList.find(g => g.grade_id === form.grades);
    const statusObj = statusList.find(s => s.nom_role === form.status);

    const body = {
      id: userId,
      abonnement_id: abonnementObj ? abonnementObj.id : null,
      grade_id: gradeObj ? gradeObj.id : null,
      status_id: statusObj ? statusObj.id : null,
    };
    console.log(body)
    try {
      const response = await fetch(apiUrl('utilisateurs/modifier'), {
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
    } finally {
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    if (userId) {
      fetch(apiUrl(`statistiques/frequentation/${userId}`))
        .then(res => res.json())
        .then(data => setStatFrequentation(data))
        .catch(() => setStatFrequentation(null));
    }
  }, [userId]);

  if (loading) {
    return (
      <PageSection variant="default" style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner size="xl" />
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="default">
        <Title headingLevel="h1">Compte</Title>
      </PageSection>

      <PageSection>
        <Tabs activeKey={activeTabKey} onSelect={(_, key) => setActiveTabKey(Number(key))}>
          <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Prénom" fieldId="first-name">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="first-name"
                    value={form.prenom}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="Nom" fieldId="last-name">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="last-name"
                    value={form.nom}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="Nom d'utilisateur" fieldId="username">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="username"
                    value={form.nom_utilisateur}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="Date de naissance" fieldId="dob">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="dob"
                    type="date"
                    value={form.date_naissance ? form.date_naissance.slice(0, 10) : ''}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="Mot de passe" fieldId="mot-de-passe">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="mot-de-passe"
                    value={form.mot_de_passe}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
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
            <Modal
              variant={ModalVariant.small}
              isOpen={isModalOpen}
              onClose={handleModalToggle}
              onEscapePress={onEscapePress}
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
                  {/* Affiche le log de succès ou d'échec uniquement si showDbLog est true */}
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
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Grade" fieldId="grade">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select
                    id="grade"
                    value={form.grades}
                    onChange={e => handleChange(e.target.value, 'grades')}
                    disabled={!editingFields['grades']}
                    style={{
                      minWidth: 180,
                      padding: '6px',
                      borderRadius: 4,
                      background: editingFields['grades'] ? '#fff' : '#fff'
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
                      <CheckIcon
                        color="var(--pf-global--success-color--100)"
                        style={{
                          background: '#d4f5e9',
                          borderRadius: '50%',
                          padding: '6px',
                          fontSize: '1.5rem'
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f0f0f0',
                        borderRadius: '50%',
                        padding: '6px',
                        fontSize: '1.5rem'
                      }}>
                        <PencilAltIcon style={{ fontSize: '1.5rem' }} />
                      </span>
                    )}
                  </Button>
                </div>
              </FormGroup>
              <FormGroup label="Genre" fieldId="genre">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TextInput
                    id="genre"
                    value={form.genres}
                    isDisabled
                    style={{ background: '#fff' }}
                  />
                </div>
              </FormGroup>
              <FormGroup label="Abonnement" fieldId="abonnement">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select
                    id="abonnement"
                    value={form.abonnement}
                    onChange={e => handleChange(e.target.value, 'abonnement')}
                    disabled={!editingFields['abonnement']}
                    style={{
                      minWidth: 180,
                      padding: '6px',
                      borderRadius: 4,
                      background: editingFields['abonnement'] ? '#fff' : '#fff'
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
                      <CheckIcon
                        color="var(--pf-global--success-color--100)"
                        style={{
                          background: '#d4f5e9',
                          borderRadius: '50%',
                          padding: '6px',
                          fontSize: '1.5rem'
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f0f0f0',
                        borderRadius: '50%',
                        padding: '6px',
                        fontSize: '1.5rem'
                      }}>
                        <PencilAltIcon style={{ fontSize: '1.5rem' }} />
                      </span>
                    )}
                  </Button>
                </div>
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Rôle et statut</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Rôle" fieldId="role">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select
                    id="role"
                    value={form.status}
                    onChange={e => handleChange(e.target.value, 'status')}
                    disabled={!editingFields['status']}
                    style={{
                      minWidth: 180,
                      padding: '6px',
                      borderRadius: 4,
                      background: editingFields['status'] ? '#fff' : '#fff'
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
                      <CheckIcon
                        color="var(--pf-global--success-color--100)"
                        style={{
                          background: '#d4f5e9',
                          borderRadius: '50%',
                          padding: '6px',
                          fontSize: '1.5rem'
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f0f0f0',
                        borderRadius: '50%',
                        padding: '6px',
                        fontSize: '1.5rem'
                      }}>
                        <PencilAltIcon style={{ fontSize: '1.5rem' }} />
                      </span>
                    )}
                  </Button>
                </div>
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
            {/* À compléter */}
          </Tab>

          <Tab eventKey={4} title={<TabTitleText>Statistiques</TabTitleText>}>
            <Grid hasGutter>
              <GridItem span={12}>
                {/* Graphique de fréquentation par mois */}
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
              </GridItem>
            </Grid>
          </Tab>
        </Tabs>
      </PageSection>
    </>
  );
};

export default Compte;


