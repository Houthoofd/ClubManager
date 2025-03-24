import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le provider
import store from '../../redux/store'; // Importation du store
import { VerifyResultWithData } from '@clubmanager/types';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/ui/modal';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Utilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState<VerifyResultWithData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/utilisateurs'); // Assurez-vous que l'URL est correcte
        if (!response.ok) {
          throw new Error('Erreur réseau lors de la récupération des utilisateurs');
        }
        const utilisateurs: VerifyResultWithData[] = await response.json();
        setUtilisateurs(utilisateurs.data); // Mise à jour de l'état avec les utilisateurs récupérés
      } catch (error) {
        setError('Erreur lors de la récupération des données');
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, []);

  const showUtilisateur = async (utilisateurId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/utilisateurs/${utilisateurId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur de récupération des utilisateurs');
      }

      const participants = await response.json();
      console.log(participants); // Affiche les participants dans la console

      navigate(`/pages/utilisateur/participants`, {
        state: { participants }, // Passer les données si nécessaire
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert("Impossible de récupérer les participants pour cet utilisateur.");
    }
  };

  return (
    <Provider store={store}>
      <h1>Liste des utilisateurs</h1>
      <div className="header">
        <div className="class-list-header">
          <div className="first-name"><span>Prénom</span></div>
          <div className="last-name"><span>Nom</span></div>
          <div className="email"><span>Email</span></div>
          <div className="date-naissance"><span>Date de naissance</span></div>
        </div>
      </div>
      <div className="class-list">
  {utilisateurs.map((utilisateur) => {
    console.log(utilisateur); // Cela va afficher l'utilisateur dans la console pour chaque élément de la liste
    return (
      <div
        className="class-list-item"
        key={utilisateur.id}
        onClick={() => showUtilisateur(utilisateur.id)} // Correction de la syntaxe de la fonction fléchée
      >
        <div className="first-name">{utilisateur.first_name}</div>
        <div className="last-name">{utilisateur.last_name}</div>
        <div className="email">{utilisateur.email}</div>
        <div className="date-naissance">{formatDateFromISO(utilisateur.date_of_birth)}</div>
      </div>
    );
  })}
</div>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </Provider>
  );
};

export default Utilisateurs;
