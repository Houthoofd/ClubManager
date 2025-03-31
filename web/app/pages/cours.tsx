import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le Provider
import store from '../../redux/store'; // Importation du store
import { CoursData, DataReservation } from '@clubmanager/types';
import '../styles/cours-style.css';
import Modal from '../../components/ui/modal';
import { useNavigate } from 'react-router-dom';

function convertToNumber(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? null : parsedValue;
}

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface UserData {
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  abonnement_id: number;
  grade_id: number;
  status_id: number;
  date_naissance: string;
}



const Cours = () => {
  const [cours, setCours] = useState<CoursData[]>([]);
  const [reservations, setReservations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/cours'); // Assurez-vous que l'URL est correcte
      if (!response.ok) {
        throw new Error('Erreur réseau lors de la récupération des cours');
      }
      const data: CoursData[] = await response.json(); // Assurez-vous que la réponse est bien du type Cours[]
      console.log(data)
      setCours(data); // Mise à jour de l'état avec les cours récupérés
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  const showParticipants = async (coursId: number) => {
  
    try {
      // URL correctement formatée
      const response = await fetch(`http://localhost:3000/cours/${coursId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error('Erreur de récupération des participants');
      }
  
      const cours = await response.json();
  
      // Naviguer vers la page des participants avec React Router
      navigate(`/pages/cours/participants`, {
        state: { cours }  // Vous pouvez passer les données dans le state si nécessaire
      });
  
    } catch (error) {
      console.error('Erreur:', error);
  
      // Afficher un message d'erreur à l'utilisateur
      alert("Impossible de récupérer les participants pour ce cours.");
    }
  };
  
  

  const toggleReservation = async (coursItem: CoursData) => {
    console.log(coursItem)
    const convertedId = convertToNumber(coursItem.id);

    // Récupérer les données stockées dans localStorage
    const storedData = localStorage.getItem("userData");
    
    // Vérifier si les données existent dans localStorage
    if (!storedData) {
      console.error("Aucune donnée utilisateur trouvée dans localStorage");
      return;
    }
    
    // Essayer de parser les données JSON
    let parsedData;
    try {
      parsedData = JSON.parse(storedData);
    } catch (error) {
      console.error("Erreur lors du parsing des données utilisateur : ", error);
      return;
    }

    // Si la conversion échoue (retourne null), on ne fait rien
    if (convertedId === null) {
      console.error("L'ID du cours n'est pas valide");
      return; // Arrêter l'exécution si l'ID est invalide
    }

    // S'assurer que les données utilisateur sont présentes
    if (!parsedData?.data?.nom || !parsedData?.data?.prenom) {
      console.error("Les données utilisateur sont incomplètes");
      return;
    }

    const dataToSend: DataReservation = {
      cours_id: convertedId,
      utilisateur_nom: parsedData.data.nom,
      utilisateur_prenom: parsedData.data.prenom
    };

    console.log(dataToSend)

    // Gérer la réservation ou l'annulation
    if (reservations.includes(convertedId)) {
      setReservations(reservations.filter(id => id !== convertedId)); // Annuler la réservation
    } else {
      try {
        const response = await fetch('http://localhost:3000/cours/inscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
  
        const data = await response.json();
        if (response.ok) {
          console.log('Utilisateur inscrit avec succès', data);
          setModalMessage(`Vous êtes inscrit au cours du ${formatDateFromISO(coursItem.date_cours)}`);
          setShowModal(true);
        } else {
          console.error('Erreur de l\'API:', data.message || 'Erreur inconnue');
          setModalMessage(data.message);
          setShowModal(true);
        }
      } catch (error) {
        console.error('Erreur de connexion:', error);
      }
      setReservations([...reservations, convertedId]); // Réserver le cours
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData?.data?.nom && parsedData?.data?.prenom) {
          setUserData(parsedData.data);
        }
      } catch (error) {
        console.error("Erreur lors du parsing des données utilisateur :", error);
      }
    }
    fetchData();
  }, []);

  return (
    <Provider store={store}>
      <div>
        <h1>Liste des Cours</h1>
        <div className='header'>
            <div className='class-list-header'>
              <div className='header-date'><span>Heure</span></div>
              <div className='type'><span>Type de cours</span></div>
              <div className='heure-debut'><span>Heure début</span></div>
              <div className='heure-fin'><span>Heure fin</span></div>
              <div className='rest'></div>
            </div>
        </div>
        <div className='class-list'>
          {cours.map((coursItem) => {
            return (
              <div className={`class-list-item ${coursItem.type_cours}`} key={coursItem.id}>
                <div className='date'>{new Date(coursItem.date_cours).toLocaleDateString()}</div>
                <div className='type'>{coursItem.type_cours}</div>
                <div className='heure-debut'>{coursItem.heure_debut}</div>
                <div className='heure-fin'>{coursItem.heure_fin}</div>
                {/* Bouton pour réserver ou annuler */}
                <button onClick={() => toggleReservation(coursItem)}>
                  {coursItem.utilisateurs?.some(
                    (utilisateur) =>
                      utilisateur.nom === userData?.nom && utilisateur.prenom === userData?.prenom
                  )
                    ? "Annuler"
                    : "Réserver"}
                </button>
                <div className='icon-more-informations' onClick={() => showParticipants(coursItem.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>
                </div>
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
      </div>
    </Provider>
  );
};

export default Cours;