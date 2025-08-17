import React, { useState, useEffect } from 'react';
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
  Grid,
  GridItem,
  Spinner
} from '@patternfly/react-core';

import { API_BASE_URL } from '../../config';

const Compte = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [loading, setLoading] = useState(true); // nouvel état

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    date_of_birth: '',
    abonnement: '',
    genres: '',
    grades: '',
    nom_utilisateur: '',
    status: '',
  });

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

  const fetchData = async (prenom: string, nom: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/compte/informations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom })
      });

      if (!response.ok) throw new Error('Erreur réseau');

      const result = await response.json();
      const utilisateur: UserData = result.utilisateur;
      console.log(utilisateur.abonnement_id)
      setForm({
        prenom: utilisateur.first_name || '',
        nom: utilisateur.last_name || '',
        email: utilisateur.email || '',
        date_naissance: utilisateur.date_of_birth || '',
        abonnement: String(utilisateur.abonnement_id ?? ''), // Cast en string
        genres: String(utilisateur.genre_id ?? ''),          // Cast en string
        grades: String(utilisateur.grade_id ?? ''),          // Cast en string
        nom_utilisateur: utilisateur.nom_utilisateur || '',
        status: String(utilisateur.status_id ?? ''),         // Cast en string
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false); // on arrête le loading une fois terminé
    }
  };

  const handleChange = (value: string, name: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

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
                <TextInput id="first-name" value={form.prenom} onChange={e => handleChange(e.currentTarget.value, 'prenom')} />
              </FormGroup>
              <FormGroup label="Nom" fieldId="last-name">
                <TextInput id="last-name" value={form.nom} onChange={e => handleChange(e.currentTarget.value, 'nom')} />
              </FormGroup>
              <FormGroup label="Nom d'utilisateur" fieldId="username">
                <TextInput id="username" value={form.nom_utilisateur} onChange={e => handleChange(e.currentTarget.value, 'nom_utilisateur')} />
              </FormGroup>
              <FormGroup label="Date de naissance" fieldId="dob">
                <TextInput
                  id="dob"
                  type="date"
                  value={form.date_naissance ? form.date_naissance.slice(0, 10) : ''}
                  onChange={e => handleChange(e.currentTarget.value, 'date_naissance')}
                />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Informations supplémentaires</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Grade" fieldId="grade">
                <TextInput id="grade" value={form.grades} onChange={e => handleChange(e.currentTarget.value, 'grades')} />
              </FormGroup>
              <FormGroup label="Genre" fieldId="genre">
                <TextInput id="genre" value={form.genres} onChange={e => handleChange(e.currentTarget.value, 'genres')} />
              </FormGroup>
              <FormGroup label="Abonnement" fieldId="abonnement">
                <TextInput id="abonnement" value={form.abonnement} onChange={e => handleChange(e.currentTarget.value, 'abonnement')} />
              </FormGroup>
            </Form>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Rôle et statut</TabTitleText>}>
            <Form isHorizontal>
              <FormGroup label="Rôle" fieldId="role">
                <TextInput id="role" value={form.status} onChange={e => handleChange(e.currentTarget.value, 'status')} />
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
