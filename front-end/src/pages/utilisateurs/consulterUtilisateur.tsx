import React, { useState } from 'react';
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
  ModalBody,
  ModalVariant,
} from '@patternfly/react-core';
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
import { useUtilisateurById, useUpdateUtilisateur, checkEmailExists } from '../../hooks/useUtilisateurs';
import { useFrequentationByUserId } from '../../hooks/useStatistiques';
import { useAbonnements, useGrades, useStatus } from '../../hooks/useInformations';
import { useEcheancesByUserId } from '../../hooks/usePaiements';

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
  const { id = '' } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showDbLog, setShowDbLog] = useState(false);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Utiliser les hooks React Query
  const { 
    data: userData, 
    isLoading: loadingUser, 
    error: userError 
  } = useUtilisateurById(id);

  const { 
    data: statFrequentation, 
    isLoading: loadingStats 
  } = useFrequentationByUserId(id);

  const { data: abonnements = [] } = useAbonnements();
  const { data: gradesList = [] } = useGrades();
  const { data: statusList = [] } = useStatus();
  const { data: paiementsEcheances = [] } = useEcheancesByUserId(id);
  
  // Mutation pour mettre à jour l'utilisateur
  const updateUtilisateur = useUpdateUtilisateur();

  // État du formulaire
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

  // Mettre à jour le formulaire quand les données utilisateur changent
  React.useEffect(() => {
    if (userData?.utilisateur) {
      const utilisateur = userData.utilisateur;
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
    }
  }, [userData]);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number
  ) => {
    setActiveTabKey(Number(eventKey));
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
      
      // Vérifier si l'email existe
      try {
        const checkResult = await checkEmailExists(email, form.id);
        if (checkResult.exists) {
          setModalMessage("Cette adresse email est déjà utilisée par un autre utilisateur.");
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        setModalMessage("Erreur lors de la vérification de l'email.");
        setIsModalOpen(true);
        return;
      }
    }

    // Prépare le body avec toutes les valeurs du formulaire
    const body = {
      id: form.id,
      email: form.email,
      date_naissance: form.date_naissance,
      genres: form.genres,
      grades: form.grades,
      abonnement: form.abonnement,
      status: form.status
    };
    
    // Utiliser la mutation React Query
    try {
      const result = await updateUtilisateur.mutateAsync(body);
      setModalMessage(result.message || 'Modifications enregistrées.');
      setShowDbLog(true);
      setTimeout(() => {
        setShowDbLog(false);
        setIsModalOpen(false);
      }, 1800);
    } catch (error: any) {
      setModalMessage(error.message || 'Erreur lors de la modification.');
      setShowDbLog(true);
      setIsModalOpen(true);
    }
  };

  const handleEmailChange = (value: string) => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
    setForm(prev => ({ ...prev, email: value }));
    setEmailCheckMessage('');
  };

  const handleInputChange = (value: string, event: React.FormEvent<HTMLInputElement>) => {
    const name = event.currentTarget.name;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  if (loadingUser) return <Spinner size="xl" />;
  if (userError) return <Alert variant="danger" title={(userError as Error).message || "Une erreur est survenue"} />;

  return (
    <PageSection>
      <Title headingLevel="h1">Consulter Utilisateur</Title>
      
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <Form>
            <FormGroup label="Prénom" fieldId="prenom">
              <TextInput
                type="text"
                id="prenom"
                name="prenom"
                value={form.prenom}
                isDisabled={true}
              />
            </FormGroup>
            <FormGroup label="Nom" fieldId="nom">
              <TextInput
                type="text"
                id="nom"
                name="nom"
                value={form.nom}
                isDisabled={true}
              />
            </FormGroup>
            <FormGroup 
              label="Email" 
              fieldId="email" 
              helperText={emailCheckMessage ? emailCheckMessage : undefined}
              helperTextInvalid={emailCheckMessage && emailCheckMessage.includes("déjà utilisée")}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextInput
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  isDisabled={!editingFields['email']}
                  onChange={handleEmailChange}
                  style={{ flexGrow: 1 }}
                />
                <Button 
                  variant="plain" 
                  aria-label={editingFields['email'] ? "Valider" : "Éditer"} 
                  onClick={() => handleEditClick('email')}
                  style={{ marginLeft: '10px' }}
                >
                  {editingFields['email'] ? <CheckIcon /> : <PencilAltIcon />}
                </Button>
              </div>
            </FormGroup>
            <FormGroup label="Date de naissance" fieldId="date_naissance">
              <TextInput
                type="date"
                id="date_naissance"
                name="date_naissance"
                value={formatDateForInput(form.date_naissance)}
                onChange={value => handleInputChange(value, { currentTarget: { name: 'date_naissance', value } })}
                isDisabled={!editingFields['date_naissance']}
              />
            </FormGroup>
            <FormGroup label="Genre" fieldId="genre">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  id="genre"
                  name="genres"
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
                  name="grades"
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
                  name="abonnement"
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
        
        <Tab eventKey={1} title={<TabTitleText>Statistiques</TabTitleText>}>
          {loadingStats ? (
            <Spinner size="lg" />
          ) : statFrequentation ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={statFrequentation.frequentationParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pourcentage_de_cours_valides" stroke="#8884d8" name="% de présence" />
                <Line type="monotone" dataKey="frequentation" stroke="#82ca9d" name="Nombre de présences" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Alert variant="info" title="Aucune statistique disponible pour cet utilisateur." />
          )}
        </Tab>
        
        <Tab eventKey={2} title={<TabTitleText>Paiements</TabTitleText>}>
          {paiementsEcheances.length > 0 ? (
            <div>
              <h3>Échéances de paiement</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Montant</th>
                    <th>Date d'échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsEcheances.map(paiement => (
                    <tr key={paiement.id}>
                      <td>{paiement.montant} €</td>
                      <td>{new Date(paiement.date_echeance).toLocaleDateString()}</td>
                      <td>{paiement.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert variant="info" title="Aucune échéance de paiement pour cet utilisateur." />
          )}
        </Tab>
      </Tabs>

      <Modal
        variant={ModalVariant.small}
        title="Message"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleModalToggle}>
            OK
          </Button>
        ]}
      >
        <ModalBody>
          {modalMessage}
          {showDbLog && updateUtilisateur.isSuccess && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                Modifications enregistrées avec succès.
              </pre>
            </div>
          )}
        </ModalBody>
      </Modal>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="primary" 
          onClick={handleValidateChanges} 
          isDisabled={!Object.values(editingFields).some(Boolean) || updateUtilisateur.isPending}
        >
          {updateUtilisateur.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </PageSection>
  );
};

export default ConsulterUtilisateurPage;

