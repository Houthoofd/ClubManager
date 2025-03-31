import React, {useState} from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { useLocation } from 'react-router-dom';
import '../../styles/cours-style.css';

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ParticipantsPage = () => {
  const location = useLocation();
  const coursData = location.state?.cours || { utilisateurs: [], date_cours: null };


  // État pour suivre les statuts des participants
  const [cours, setParticipants] = useState(coursData.Cours);

  // Fonction pour gérer les actions de statut (valider ou annuler)
  const handleStatus = (participantId: number, status: string) => {
    console.log(`Participant ${participantId} status set to ${status}`);
  };


  return (
    <div>
      <div className='informations-cours'>
        <h1>Cours du {cours.date_cours ? formatDateFromISO(cours.date_cours) : 'Inconnu'}</h1> 
        <h3>Nombre de participants : {cours.utilisateurs?.length}</h3>
      </div>
      <div className='utilisateur-list-infos'>
        {cours.utilisateurs.map((participant: any) => (
          <div className='participants-list-item' key={participant.id}>
            <div className='participants-list-item-nom'>{participant.nom}</div>
            <div className='participants-list-item-prenom'>{participant.prenom}</div>
            <div className='participants-list-item-icon validate' onClick={() => handleStatus(participant.utilisateurId, 'validate')}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></div>
            <div className='participants-list-item-icon cancel' onClick={() => handleStatus(participant.utilisateurId, 'cancel')}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></div>
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
