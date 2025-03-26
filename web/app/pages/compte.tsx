import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { UserData } from '@clubmanager/types';
import { Tabs, TabPanel } from '../../components/ui/tabs';

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
      console.log(response)
      if (!response.ok) {
        throw new Error('Erreur réseau lors de la récupération des informations du compte');
      }
      const data: UserData = await response.json();
      console.log(data)
      setCompte(data); // Mettre à jour l'état avec les données récupérées
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  return (
    <Provider store={store}>
      <div className='informations-utilisateur-content'>
            {compte?.map((info: any) => (
              <h1 key={info.id}>Compte de {info.first_name} {info.last_name}</h1>
            ))}
      
            <Tabs>
              <TabPanel label="Informations personnelles">
                {compte?.map((info: any) => (
                  <div className='informations-utilisateur-list-item' key={info.id}>
                    <div className='informations-input-group'>
                      <label>Nom :</label>
                      <input
                        type='text'
                        value={info.last_name}
                        onChange={(e) => {
                          const updatedUser = compte.map((user: any) =>
                            user.id === info.id ? { ...user, last_name: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                    <div className='informations-input-group'>
                      <label>Prénom :</label>
                      <input
                        type='text'
                        value={info.first_name}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, first_name: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                    <div className='informations-input-group'>
                      <label>Date de naissance :</label>
                      <input
                        type='date'
                        value={formatDateForInput(info.date_of_birth)}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, date_of_birth: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </TabPanel>
      
              <TabPanel label="Informations supplémentaires">
                {compte?.map((info: any) => (
                  <div className='informations-utilisateur-list-item' key={info.id}>
                    <div className='informations-input-group'>
                      <label>Genre :</label>
                      <input
                        type='text'
                        value={info.genre_id}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, genre_id: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                    <div className='informations-input-group'>
                      <label>Abonnement :</label>
                      <input
                        type='text'
                        value={info.abonnement_id}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, abonnement_id: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                    <div className='informations-input-group'>
                      <label>Grade :</label>
                      <input
                        type='text'
                        value={info.grade_id}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, grade_id: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </TabPanel>
      
              <TabPanel label="Rôles et Statut">
                {compte?.map((info: any) => (
                  <div className='informations-utilisateur-list-item' key={info.id}>
                    <div className='informations-input-group'>
                      <label>Rôle :</label>
                      <input
                        type='text'
                        value={info.status_id}
                        onChange={(e) => {
                          const updatedUser = compte?.map((user: any) =>
                            user.id === info.id ? { ...user, status_id: e.target.value } : user
                          );
                          setCompte(updatedUser);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </TabPanel>
              <TabPanel label="Paiements">
                {/* Logique pour la gestion des paiements */}
              </TabPanel>
              <TabPanel label="Statistiques">
                {/* Logique pour afficher les statistiques */}
              </TabPanel>
            </Tabs>
          </div>
    </Provider>
  );
};

export default Compte;
