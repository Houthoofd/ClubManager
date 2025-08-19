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
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';

type UtilisateurType = {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  genre_id: string;
  abonnement_id: string;
  grade_id: string;
  role_id: string;
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

function formatDateForInput(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ConsulterUtilisateurPage = () => {
  const { id } = useParams();
  const [utilisateur, setUtilisateur] = useState<UtilisateurType | null>(null);
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

  useEffect(() => {
    const fetchUtilisateur = async () => {
      try {
        const response = await fetch(apiUrl(`utilisateurs/${id}`));
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données.');
        }
        const result = await response.json();
        // Adaptation : la donnée est dans result.utilisateur
        const data = result.utilisateur;
        console.log(data)
        if (data) {
          setUtilisateur(data);
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

    // Ajout fetch statistiques de fréquentation
    if (id) {
      fetch(apiUrl(`statistiques/frequentation/${id}`))
        .then(res => res.json())
        .then(data => setStatFrequentation(data))
        .catch(() => setStatFrequentation(null));
    }

    // Ajout fetch abonnements, grades, status
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
  }, [id]);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number
  ) => {
    setActiveTabKey(Number(eventKey)); // forcer en number
  };

  // Fonction pour détecter les changements
  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field] && utilisateur) {
        changes[field] = utilisateur[field as keyof UtilisateurType] as string;
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

  // Fonction pour envoyer la modification au backend
  const handleValidateChanges = async () => {
    if (!id || !utilisateur) return;

    // Récupère les bons ids pour grade, abonnement, role
    const abonnementObj = abonnements.find(a => String(a.id) === String(utilisateur.abonnement_id));
    const gradeObj = gradesList.find(g => String(g.grade_id) === String(utilisateur.grade_id));
    const statusObj = statusList.find(s => String(s.id) === String(utilisateur.role_id));

    const body: any = { id: utilisateur.id };
    if (editingFields['abonnement_id']) {
      body.abonnement_id = abonnementObj ? abonnementObj.id : null;
    }
    if (editingFields['grade_id']) {
      body.grade_id = gradeObj ? gradeObj.id : null;
    }
    if (editingFields['role_id']) {
      body.status_id = statusObj ? statusObj.id : null;
    }

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
    } finally {
      setIsModalOpen(true);
    }
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert variant="danger" title={error} />;
  if (!utilisateur) return null;

  return (
    <PageSection>
      <Title headingLevel="h1" size="xl">
        Informations de {utilisateur.first_name} {utilisateur.last_name}
      </Title>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Nom :" fieldId="last-name">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="last-name"
                  value={utilisateur.last_name}
                  onChange={(_event, value) =>
                    setUtilisateur({ ...utilisateur, last_name: value })
                  }
                  isDisabled={!editingFields['last_name']}
                />
                <Button
                  variant="plain"
                  onClick={() => handleEditClick('last_name')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['last_name'] ? "Terminer" : "Editer"}
                >
                  {editingFields['last_name'] ? (
                    <CheckIcon color="var(--pf-global--success-color--100)" />
                  ) : (
                    <PencilAltIcon />
                  )}
                </Button>
              </div>
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="first-name"
                  value={utilisateur.first_name}
                  onChange={(_event, value) =>
                    setUtilisateur({ ...utilisateur, first_name: value })
                  }
                  isDisabled={!editingFields['first_name']}
                />
                <Button
                  variant="plain"
                  onClick={() => handleEditClick('first_name')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['first_name'] ? "Terminer" : "Editer"}
                >
                  {editingFields['first_name'] ? (
                    <CheckIcon color="var(--pf-global--success-color--100)" />
                  ) : (
                    <PencilAltIcon />
                  )}
                </Button>
              </div>
            </FormGroup>
            <FormGroup label="Date de naissance :" fieldId="dob">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  id="dob"
                  type="date"
                  value={formatDateForInput(utilisateur.date_of_birth)}
                  onChange={(_event, value) =>
                    setUtilisateur({ ...utilisateur, date_of_birth: value })
                  }
                  isDisabled={!editingFields['date_of_birth']}
                />
                <Button
                  variant="plain"
                  onClick={() => handleEditClick('date_of_birth')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['date_of_birth'] ? "Terminer" : "Editer"}
                >
                  {editingFields['date_of_birth'] ? (
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
          </Form>
        </Tab>

        <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Grade" fieldId="grade">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  id="grade"
                  value={utilisateur.grade_id}
                  onChange={e => setUtilisateur({ ...utilisateur, grade_id: e.target.value })}
                  disabled={!editingFields['grade_id']}
                  style={{
                    minWidth: 180,
                    padding: '6px',
                    borderRadius: 4,
                    background: editingFields['grade_id'] ? '#fff' : '#fff'
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
                  onClick={() => handleEditClick('grade_id')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['grade_id'] ? "Terminer" : "Editer"}
                >
                  {editingFields['grade_id'] ? (
                    <CheckIcon color="var(--pf-global--success-color--100)" />
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
            <FormGroup label="Abonnement" fieldId="abonnement">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  id="abonnement"
                  value={utilisateur.abonnement_id}
                  onChange={e => setUtilisateur({ ...utilisateur, abonnement_id: e.target.value })}
                  disabled={!editingFields['abonnement_id']}
                  style={{
                    minWidth: 180,
                    padding: '6px',
                    borderRadius: 4,
                    background: editingFields['abonnement_id'] ? '#fff' : '#fff'
                  }}
                >
                  <option value="">Sélectionner un abonnement</option>
                  {abonnements.map(ab => (
                    <option key={ab.id} value={ab.id}>
                      {ab.nom_plan} ({ab.prix}€/{ab.periode})
                    </option>
                  ))}
                </select>
                <Button
                  variant="plain"
                  onClick={() => handleEditClick('abonnement_id')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['abonnement_id'] ? "Terminer" : "Editer"}
                >
                  {editingFields['abonnement_id'] ? (
                    <CheckIcon color="var(--pf-global--success-color--100)" />
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

        <Tab eventKey={2} title={<TabTitleText>Rôles et Statut</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Rôle" fieldId="role">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  id="role"
                  value={utilisateur.role_id}
                  onChange={e => setUtilisateur({ ...utilisateur, role_id: e.target.value })}
                  disabled={!editingFields['role_id']}
                  style={{
                    minWidth: 180,
                    padding: '6px',
                    borderRadius: 4,
                    background: editingFields['role_id'] ? '#fff' : '#fff'
                  }}
                >
                  <option value="">Sélectionner un rôle</option>
                  {statusList.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.nom_role}
                    </option>
                  ))}
                </select>
                <Button
                  variant="plain"
                  onClick={() => handleEditClick('role_id')}
                  style={{ marginLeft: '1rem' }}
                  aria-label={editingFields['role_id'] ? "Terminer" : "Editer"}
                >
                  {editingFields['role_id'] ? (
                    <CheckIcon color="var(--pf-global--success-color--100)" />
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
          <p>Contenu à venir pour les paiements.</p>
        </Tab>

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
    </PageSection>
  );
};

const ConsulterUtilisateur = () => (
  <Provider store={store}>
    <ConsulterUtilisateurPage />
  </Provider>
);

export default ConsulterUtilisateur;
