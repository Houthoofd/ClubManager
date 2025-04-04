import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { useLocation } from 'react-router-dom';
import '../../styles/utilisateurs-style.css';
import { Tabs, TabPanel } from '../../../components/ui/tabs';

// Fonction pour formater la date ISO en un format lisible pour les champs input de type "date"
function formatDateForInput(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


const UtilisateurPage = () => {
  const location = useLocation();
  const UtilisateurData = location.state;

  // État pour suivre les informations des utilisateurs
  const [utilisateur, setUtilisateur] = useState(UtilisateurData.utilisateur);

  console.log(utilisateur);

  return (
    <div className='informations-utilisateur-content'>
      {utilisateur.map((info: any) => (
        <h1 key={info.id}>Informations de {info.first_name} {info.last_name}</h1>
      ))}

      <Tabs>
        <TabPanel label="Informations personnelles">
          {utilisateur.map((info: any) => (
            <div className='informations-utilisateur-list-item' key={info.id}>
              <div className='informations-input-group'>
                <label>Nom :</label>
                <input
                  type='text'
                  value={info.last_name}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, last_name: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
              <div className='informations-input-group'>
                <label>Prénom :</label>
                <input
                  type='text'
                  value={info.first_name}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, first_name: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
              <div className='informations-input-group'>
                <label>Date de naissance :</label>
                <input
                  type='date'
                  value={formatDateForInput(info.date_of_birth)}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, date_of_birth: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
            </div>
          ))}
        </TabPanel>

        <TabPanel label="Informations supplémentaires">
          {utilisateur.map((info: any) => (
            <div className='informations-utilisateur-list-item' key={info.id}>
              <div className='informations-input-group'>
                <label>Genre :</label>
                <input
                  type='text'
                  value={info.genre_id}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, genre_id: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
              <div className='informations-input-group'>
                <label>Abonnement :</label>
                <input
                  type='text'
                  value={info.abonnement_id}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, abonnement_id: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
              <div className='informations-input-group'>
                <label>Grade :</label>
                <input
                  type='text'
                  value={info.grade_id}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, grade_id: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
                  }}
                />
              </div>
            </div>
          ))}
        </TabPanel>

        <TabPanel label="Rôles et Statut">
          {utilisateur.map((info: any) => (
            <div className='informations-utilisateur-list-item' key={info.id}>
              <div className='informations-input-group'>
                <label>Rôle :</label>
                <input
                  type='text'
                  value={info.status_id}
                  onChange={(e) => {
                    const updatedUser = utilisateur.map((user: any) =>
                      user.id === info.id ? { ...user, status_id: e.target.value } : user
                    );
                    setUtilisateur(updatedUser);
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
  );
};

// Composant fonctionnel pour inclure le store Redux
const Utilisateur = () => {
  return (
    <Provider store={store}>
      <UtilisateurPage /> {/* Utilisez UtilisateurPage à l'intérieur du Provider */}
    </Provider>
  );
};

export default Utilisateur;
