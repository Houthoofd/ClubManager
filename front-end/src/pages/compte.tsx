import { useState, useEffect } from 'react';
import type { UserData, VerifyResultWithData } from '@clubmanager/types';
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
} from '@patternfly/react-core';

function formatDateForInput(isoDateString: string | undefined) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

const Compte = () => {
  const [compte, setCompte] = useState<UserData | null>(null);
  const [activeTabKey, setActiveTabKey] = useState(0);

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData.data?.prenom && parsedData.data?.nom) {
          fetchData(parsedData.data.prenom, parsedData.data.nom);
        }
      } catch (error) {
        console.error("Erreur lors du parsing de l'utilisateur :", error);
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
      const result: VerifyResultWithData = await response.json();
      setCompte(result.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

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
                <TextInput id="first-name" value={compte?.prenom || ''} onChange={() => {}} readOnly />
              </FormGroup>
              <FormGroup label="Nom" fieldId="last-name">
                <TextInput id="last-name" value={compte?.nom || ''} onChange={() => {}} readOnly />
              </FormGroup>
              <FormGroup label="Nom d'utilisateur" fieldId="username">
                <TextInput id="username" value={compte?.nom_utilisateur || ''} onChange={() => {}} readOnly />
              </FormGroup>
              <FormGroup label="Date de naissance" fieldId="dob">
                <TextInput id="dob" type="date" value={formatDateForInput(compte?.date_naissance)} onChange={() => {}} readOnly />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Grade" fieldId="grade">
                <TextInput id="grade" value={compte?.grade_id || ''} onChange={() => {}} readOnly />
              </FormGroup>
              <FormGroup label="Genre" fieldId="genre">
                <TextInput id="genre" value={compte?.genre_id || ''} onChange={() => {}} readOnly />
              </FormGroup>
              <FormGroup label="Abonnement" fieldId="abonnement">
                <TextInput id="abonnement" value={compte?.abonnement_id || ''} onChange={() => {}} readOnly />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Rôle et statut</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Rôle" fieldId="role">
                <TextInput id="role" value={compte?.status_id || ''} onChange={() => {}} readOnly />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={3} title={<TabTitleText>Paiements</TabTitleText>}>
            {/* À compléter */}
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
    </>
  );
};

export default Compte;
