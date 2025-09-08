import React, { useState } from 'react';
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
import { useParams } from 'react-router-dom';
import { PencilAltIcon, CheckIcon } from '@patternfly/react-icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  useCompteInfo,
  useStatFrequentation,
  useUpdateCompte,
  useAbonnements,
  useGrades,
  useStatus,
  useGenres
} from '../hooks/useCompte';

function formatDateForInput(isoDateString: string): string {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Compte = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [form, setForm] = useState({
    email: '',
    date_naissance: '',
    genres: '',
    grades: '',
    abonnement: '',
    status: ''
  });
  const [userData, setUserData] = useState<any | null>(null);

  // Utilisation des hooks React Query
  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(userData?.prenom, userData?.nom);
  const { data: statFrequentation } = useStatFrequentation(id);
  const updateCompte = useUpdateCompte();
  const abonnementsQuery = useAbonnements();
  const gradesQuery = useGrades();
  const statusQuery = useStatus();
  const genresQuery = useGenres();

  // Ajoute un champ pour le mot de passe si absent
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Récupère prénom et nom depuis localStorage
  React.useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData.data);
    }
  }, []);

  // Utilise le hook useCompteInfo avec prénom et nom
  React.useEffect(() => {
    if (compteInfo && !compteInfo.mot_de_passe) {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
    }
  }, [compteInfo]);

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: string | number) => {
    setActiveTabKey(Number(eventKey));
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleEmailChange = (value: string) => {
    setForm(prev => ({ ...prev, email: value }));
  };

  const getChangesSummary = () => {
    const changes: { [key: string]: string } = {};
    Object.keys(editingFields).forEach(field => {
      if (editingFields[field]) {
        changes[field] = (form as any)[field];
      }
    });
    return changes;
  };

  // Fonction pour appliquer les changements (y compris le mot de passe)
  const handleApplyChanges = () => {
    const changes = getChangesSummary();
    if (showPasswordField && password) {
      changes['mot_de_passe'] = password;
    }
    setPendingChanges(changes);
    setModalMessage(
      Object.keys(changes).length > 0
        ? Object.entries(changes)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : 'Aucun changement détecté.'
    );
    setIsModalOpen(true);

    // Appel de la mutation pour mettre à jour le compte
    if (Object.keys(changes).length > 0) {
      updateCompte.mutate({ id, ...changes });
    }
  };

  if (loadingCompte) return <Spinner size="xl" />;
  if (errorCompte) return <Alert variant="danger" title={errorCompte.message} />;


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
                value={compteInfo?.utilisateur?.first_name || ''}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <TextInput
                id="first-name"
                value={compteInfo?.utilisateur?.prenom || ''}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Email :" fieldId="email">
              <TextInput
                id="email"
                value={form.email || compteInfo?.utilisateur?.email || ''}
                isDisabled={!editingFields['email']}
                onChange={(_event, value) => handleEmailChange(value)}
              />
              <Button
                variant="plain"
                onClick={() => handleEditClick('email')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['email'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
            <FormGroup label="Date de naissance :" fieldId="dob">
              <TextInput
                id="dob"
                type="date"
                value={formatDateForInput(form.date_naissance || compteInfo?.utilisateur?.date_naissance)}
                onChange={(_event, value) =>
                  setForm(prev => ({ ...prev, date_naissance: value }))
                }
                isDisabled={!editingFields['date_naissance']}
              />
              <Button
                variant="plain"
                onClick={() => handleEditClick('date_naissance')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['date_naissance'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
            <FormGroup label="Mot de passe :" fieldId="password">
              {showPasswordField ? (
                <TextInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(_event, value) => setPassword(value)}
                  placeholder="Créer un mot de passe"
                />
              ) : (
                <TextInput
                  id="password"
                  type="password"
                  value="********"
                  isDisabled
                />
              )}
            </FormGroup>
            <Button
              variant="primary"
              style={{ marginTop: '1rem' }}
              onClick={handleApplyChanges}
            >
              Voir les changements effectués
            </Button>
          </Form>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Genre" fieldId="genre">
              <select
                id="genre"
                value={form.genres || compteInfo?.utilisateur?.genres || ''}
                onChange={e => setForm(prev => ({ ...prev, genres: e.target.value }))}
                disabled={!editingFields['genres']}
              >
                <option value="">Sélectionner un genre</option>
                {genresQuery.data?.map((a: { id: number; genre_name: string }) => (
                  <option key={a.id} value={a.genre_name}>{a.genre_name}</option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('genres')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['genres'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
            <FormGroup label="Statut" fieldId="status">
              <select
                id="status"
                value={form.status || compteInfo?.utilisateur?.status || ''}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                disabled={!editingFields['status']}
              >
                <option value="">Sélectionner un statut</option>
                {statusQuery.data?.map((a: { id: number; nom_role: string }) => (
                  <option key={a.id} value={a.nom_role}>{a.nom_role}</option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('status')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['status'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
            <FormGroup label="Grade" fieldId="grades">
              <select
                id="grades"
                value={form.grades || compteInfo?.utilisateur?.grades || ''}
                onChange={e => setForm(prev => ({ ...prev, grades: e.target.value }))}
                disabled={!editingFields['grades']}
              >
                <option value="">Sélectionner un grade</option>
                {gradesQuery.data?.map((a: { id: number; grade_id: string }) => (
                  <option key={a.id} value={a.grade_id}>{a.grade_id}</option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('grades')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['grades'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
            <FormGroup label="Abonnement" fieldId="abonnement">
              <select
                id="abonnement"
                value={form.abonnement || compteInfo?.utilisateur?.abonnement || ''}
                onChange={e => setForm(prev => ({ ...prev, abonnement: e.target.value }))}
                disabled={!editingFields['abonnement']}
              >
                <option value="">Sélectionner un abonnement</option>
                {abonnementsQuery.data?.map((a: { id: number; nom_plan: string }) => (
                  <option key={a.id} value={a.nom_plan}>{a.nom_plan}</option>
                ))}
              </select>
              <Button
                variant="plain"
                onClick={() => handleEditClick('abonnement')}
                style={{ marginLeft: '1rem' }}
              >
                {editingFields['abonnement'] ? <CheckIcon /> : <PencilAltIcon />}
              </Button>
            </FormGroup>
          </Form>
        </Tab>
        <Tab eventKey={4} title={<TabTitleText>Statistiques</TabTitleText>}>
          <div>
            {statFrequentation && statFrequentation.frequentationParMois?.length > 0 ? (
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <Title headingLevel="h2" style={{ marginBottom: 16 }}>Fréquentation par mois</Title>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={statFrequentation.frequentationParMois}
                    margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" angle={-45} textAnchor="end" interval={0} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="frequentation" name="Présences validées" stroke="#007bff" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>Aucune statistique de fréquentation disponible.</p>
            )}
          </div>
        </Tab>
      </Tabs>
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader title="Résumé des changements" />
        <ModalBody>
          <p>{modalMessage}</p>
        </ModalBody>
        <ModalFooter>
          <Button key="confirm" variant="primary" onClick={() => setIsModalOpen(false)}>
            OK
          </Button>
        </ModalFooter>
      </Modal>
    </PageSection>
  );
};

export default Compte;


