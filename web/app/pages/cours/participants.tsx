import React, {useState, useEffect} from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { useLocation } from 'react-router-dom';
import '../../styles/cours-style.css';
import { CoursData, DataAnnulation, Utilisateur } from '@clubmanager/types';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function convertToNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  const parsedValue = Number(value);
  return parsedValue;
}

const ParticipantsPage = () => {
  const location = useLocation();
  const coursData = location.state?.cours || { utilisateurs: [], date_cours: null };

  // État pour suivre le cours //
  const [cours, setCours] = useState<CoursData[]>(coursData.Cours || []);

  // État pour suivre les statuts des participants
  const [participants, setParticipants] = useState<Utilisateur[]>(coursData.Cours.utilisateurs || []);


  useEffect(() => {
    console.log("Participants mis à jour :", participants);
  }, [participants]);
  
  

  // Fonction pour gérer les actions de statut (valider ou annuler)
  const handleStatus = async (data: Record<string, string>, status: string) => {
    const convertedId = convertToNumber(cours.id);
    const dataToSend: DataAnnulation = {
      cours_id: convertedId,
      utilisateur_nom: data.nom,
      utilisateur_prenom: data.prenom
    };
    const endpoint = status === "annuler" 
      ? "http://localhost:3000/cours/inscription/annulation" 
      : "http://localhost:3000/cours/inscription/validation";
  
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
  
      if (response.ok) {
        setParticipants((prevParticipants) =>
          prevParticipants.map((utilisateur) =>
            utilisateur.nom === data.nom && utilisateur.prenom === data.prenom
              ? { ...utilisateur, presence: status === "valider" ? 1 : 0 }
              : utilisateur
          )
        );
      } else {
        console.error("Erreur de mise à jour");
      }
    } catch (error) {
      console.log(error);
    }
  };
  


  return (
    <div>
      <div className='informations-cours'>
        <h1>Cours du {cours.date_cours ? formatDateFromISO(cours.date_cours) : 'Inconnu'}</h1> 
        <h3>Nombre de participants : {cours.utilisateurs?.length}</h3>
      </div>
      <div className='utilisateur-list-infos'>
  {participants.map((utilisateur) => (
    <div 
      className={`participants-list-item ${utilisateur.presence === 1 ? "present" : "pas-present"}`} 
      key={utilisateur.id}
    >
      <div className='participants-list-item-nom'>{utilisateur.nom}</div>
      <div className='participants-list-item-prenom'>{utilisateur.prenom}</div>
      <div className='participants-list-item-icon validate' 
        onClick={() => handleStatus({nom: utilisateur.nom, prenom: utilisateur.prenom}, 'valider')}>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
        </svg>
      </div>
      <div className='participants-list-item-icon cancel' 
        onClick={() => handleStatus({nom: utilisateur.nom, prenom: utilisateur.prenom}, 'annuler')}>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>
      </div>
    </div>
  ))}
</div>

    </div>
  );
};

// Composant fonctionnel pour inclure le store Redux
const Participants = () => {
  return (
    <Provider store={store}>
      <ParticipantsPage /> {/* Utilisez ParticipantsPage à l'intérieur du Provider */}
    </Provider>
  );
};

export default Participants;
