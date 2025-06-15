import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../redux/store';
import type { UserData } from '@clubmanager/types';
import {
  Tabs,
  Tab,
  TabTitleText,
  TextInput,
  Form,
  FormGroup,
  Title,
  PageSection,
  PageSectionVariants,
  Grid,
  GridItem,
} from '@patternfly/react-core';

function formatDateForInput(isoDateString: string | undefined) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Compte = () => {
  const [compte, setCompte] = useState<UserData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTabKey, setActiveTabKey] = useState(0);

  const data = {
    Jan: 3,
    Fév: 5,
    Mar: 7,
    Avr: 2,
    Mai: 6,
    Juin: 1,
    Juil: 4,
    Août: 5,
    Sep: 3,
    Oct: 6,
    Nov: 2,
    Déc: 7
  };

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.data && parsedData.data.prenom && parsedData.data.nom) {
        fetchData(parsedData.data.prenom, parsedData.data.nom);
        setUserData(parsedData);
      }
    }
  }, []);

  const fetchData = async (prenom: string, nom: string) => {
    try {
      const response = await fetch(`http://localhost:3000/compte/informations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prenom, nom })
      });
      if (!response.ok) {
        throw new Error('Erreur réseau lors de la récupération des informations du compte');
      }
      const result: UserData = await response.json();
      setCompte(result.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  return (
    <Provider store={store}>
      <PageSection variant="default">
        <Title headingLevel="h1">Compte</Title>
      </PageSection>

      <PageSection>
        <Tabs activeKey={activeTabKey} onSelect={(_, key) => setActiveTabKey(Number(key))}>
          <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Prénom" fieldId="first-name">
                <TextInput id="first-name" value={compte?.first_name || ''} onChange={() => {}} />
              </FormGroup>
              <FormGroup label="Nom" fieldId="last-name">
                <TextInput id="last-name" value={compte?.last_name || ''} onChange={() => {}} />
              </FormGroup>
              <FormGroup label="Nom d'utilisateur" fieldId="username">
                <TextInput id="username" value={compte?.nom_utilisateur || ''} onChange={() => {}} />
              </FormGroup>
              <FormGroup label="Date de naissance" fieldId="dob">
                <TextInput id="dob" type="date" value={formatDateForInput(compte?.date_of_birth)} onChange={() => {}} />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Grade" fieldId="grade">
                <TextInput id="grade" value={compte?.grades || ''} onChange={() => {}} />
              </FormGroup>
              <FormGroup label="Genre" fieldId="genre">
                <TextInput id="genre" value={compte?.genres || ''} onChange={() => {}} />
              </FormGroup>
              <FormGroup label="Abonnement" fieldId="abonnement">
                <TextInput id="abonnement" value={compte?.abonnement || ''} onChange={() => {}} />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Rôle et statut</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Rôle" fieldId="role">
                <TextInput id="role" value={compte?.status || ''} onChange={() => {}} />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
            {/* Contenu Paiements */}
          </Tab>

          <Tab eventKey={4} title={<TabTitleText>Statistiques</TabTitleText>}>
            <Grid hasGutter>
              <GridItem span={12}>
                {/* <Graph title="Présence par mois" data={data} /> */}
              </GridItem>
            </Grid>
          </Tab>
        </Tabs>
      </PageSection>
    </Provider>
  );
};

export default Compte;
