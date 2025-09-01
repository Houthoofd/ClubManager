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

  // Utilisation des hooks React Query
  const { data: compteInfo, isLoading: loadingCompte, error: errorCompte } = useCompteInfo(id);
  const { data: statFrequentation } = useStatFrequentation(id);
  const updateCompte = useUpdateCompte();

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
                value={compteInfo?.nom || ''}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <TextInput
                id="first-name"
                value={compteInfo?.prenom || ''}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Email :" fieldId="email">
              <TextInput
                id="email"
                value={form.email || compteInfo?.email || ''}
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
                value={formatDateForInput(form.date_naissance || compteInfo?.date_naissance)}
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
              <select
                id="genre"
                value={form.genres || compteInfo?.genres || ''}
                onChange={e => setForm(prev => ({ ...prev, genres: e.target.value }))}
                disabled={!editingFields['genres']}
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
              >
                {editingFields['genres'] ? <CheckIcon /> : <PencilAltIcon />}
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
               

