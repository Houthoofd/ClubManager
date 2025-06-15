import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { useLocation, useParams } from 'react-router-dom';
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
} from '@patternfly/react-core';

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

function formatDateForInput(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ConsulterUtilisateurPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [utilisateur, setUtilisateur] = useState<UtilisateurType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = useState(0);

  useEffect(() => {
    const fetchUtilisateur = async () => {
      try {
        const response = await fetch(`http://localhost:3000/utilisateurs/${id}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données.');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setUtilisateur(data[0]);
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
  }, [id]);

  const handleTabClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number
  ) => {
    setActiveTabKey(tabIndex);
  };

  if (loading) return <Spinner isSVG size="xl" />;
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
              <TextInput
                id="last-name"
                value={utilisateur.last_name}
                onChange={(value) => setUtilisateur({ ...utilisateur, last_name: value })}
              />
            </FormGroup>
            <FormGroup label="Prénom :" fieldId="first-name">
              <TextInput
                id="first-name"
                value={utilisateur.first_name}
                onChange={(value) => setUtilisateur({ ...utilisateur, first_name: value })}
              />
            </FormGroup>
            <FormGroup label="Date de naissance :" fieldId="dob">
              <TextInput
                id="dob"
                type="date"
                value={formatDateForInput(utilisateur.date_of_birth)}
                onChange={(value) => setUtilisateur({ ...utilisateur, date_of_birth: value })}
              />
            </FormGroup>
          </Form>
        </Tab>

        <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Genre :" fieldId="genre">
              <TextInput
                id="genre"
                value={utilisateur.genre_id}
                onChange={(value) => setUtilisateur({ ...utilisateur, genre_id: value })}
              />
            </FormGroup>
            <FormGroup label="Abonnement :" fieldId="abonnement">
              <TextInput
                id="abonnement"
                value={utilisateur.abonnement_id}
                onChange={(value) => setUtilisateur({ ...utilisateur, abonnement_id: value })}
              />
            </FormGroup>
            <FormGroup label="Grade :" fieldId="grade">
              <TextInput
                id="grade"
                value={utilisateur.grade_id}
                onChange={(value) => setUtilisateur({ ...utilisateur, grade_id: value })}
              />
            </FormGroup>
          </Form>
        </Tab>

        <Tab eventKey={2} title={<TabTitleText>Rôles et Statut</TabTitleText>}>
          <Form isHorizontal>
            <FormGroup label="Rôle :" fieldId="role">
              <TextInput
                id="role"
                value={utilisateur.role_id}
                onChange={(value) => setUtilisateur({ ...utilisateur, role_id: value })}
              />
            </FormGroup>
          </Form>
        </Tab>

        <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
          <p>Contenu à venir pour les paiements.</p>
        </Tab>

        <Tab eventKey={4} title={<TabTitleText>Statistiques</TabTitleText>}>
          <p>Contenu à venir pour les statistiques.</p>
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
