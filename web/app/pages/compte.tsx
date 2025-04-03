import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { UserData } from '@clubmanager/types';
import { Tabs, TabPanel } from '../../components/ui/tabs';
import Graph from '../../components/ui/chart';
import DataView from '../../components/ui/dataview';

function formatDateForInput(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Compte = () => {
  const [compte, setCompte] = useState<UserData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

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

  // Récupérer les données du localStorage au montage du composant
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

  // Fonction pour récupérer les informations utilisateur à partir de l'API
  const fetchData = async (prenom: string, nom: string) => {
    try {
      const response = await fetch(`http://localhost:3000/compte/informations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body : JSON.stringify({prenom: prenom, nom: nom})
      });
      if (!response.ok) {
        throw new Error('Erreur réseau lors de la récupération des informations du compte');
      }
      const result: UserData = await response.json();
      console.log(result)
      setCompte(result.data); // Mettre à jour l'état avec les données récupérées
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  console.log(compte)
  return (
    <Provider store={store}>
      <h1>Compte</h1>
      <Tabs>
        <TabPanel label="Informations personnelles">
          <div className='informations-input-group'>
            <label>Prénom :</label>
            <input
              type='text'
              value={compte?.first_name}
              onChange={(e) => {
                
              }}
            />
          </div>
          <div className='informations-input-group'>
            <label>Prénom :</label>
            <input
              type='text'
              value={compte?.last_name}
              onChange={(e) => {
                
              }}
            />
          </div>
          <div className='informations-input-group'>
            <label>Nom d'utilisateur :</label>
            <input
              type='text'
              value={compte?.nom_utilisateur}
              onChange={(e) => {
                
              }}
            />
          </div>
          <div className='informations-input-group'>
            <label>Date de naissance :</label>
            <input
              type='date'
              value={formatDateForInput(compte?.date_of_birth)}
              onChange={(e) => {
                
              }}
            />
          </div>
        </TabPanel>
        <TabPanel label="Informations supplémentaires">
          <div className='informations-input-group'>
            <label>Grade :</label>
            <input
              type='text'
              value={compte?.grades}
              onChange={(e) => {
                
              }}
            />
          </div>
          <div className='informations-input-group'>
            <label>Genre :</label>
            <input
              type='text'
              value={compte?.genres}
              onChange={(e) => {
                
              }}
            />
          </div>
          <div className='informations-input-group'>
            <label>Abonnement :</label>
            <input
              type='text'
              value={compte?.abonnement}
              onChange={(e) => {
                
              }}
            />
          </div>
        </TabPanel>
        <TabPanel label="Rôle et status">
          <div className='informations-input-group'>
            <label>Rôle :</label>
            <input
              type='text'
              value={compte?.status}
              onChange={(e) => {
                
              }}
            />
          </div>
        </TabPanel>
        <TabPanel label="Paiements"></TabPanel>
        <TabPanel label="Statistiques">
          
          <Graph
            title="Présence par mois"
            data={data}
          />
        </TabPanel>
      </Tabs>
    </Provider>
  );
};

export default Compte;
