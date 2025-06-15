import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { Tabs, TabPanel } from '../../../components/ui/tabs';
import Modal from '@/components/ui/modal';
import type { AjoutCours, JourCours, Professeur } from '@clubmanager/types';
import '../../styles/pages/ajouter_cours.css';

function convertTimeToSQLTime(value: string): string | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':');
  if (!hours || !minutes) return null;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`; // format HH:MM:SS
}

const AjouterCOurs = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [joursCours, setJoursCours] = useState<JourCours[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [isOpen, setIsOpen] = useState(false);


  const [formData, setFormData] = useState({
    type_cours: '',
    heure_debut: '',
    heure_fin: '',
    jour_semaine: '',
    professeurs: [] as string[], // 🔥 ici on reste en string[], comme AjoutCours
  });

  const [joursSemaine, setJoursSemaine] = useState([
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi'
  ]);


  // Fonction pour récupérer les professeurs depuis le backend
  const fetchProfesseurs = async () => {
    try {
      const response = await fetch('http://localhost:3000/professeurs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setProfesseurs(data.data); // Stockage des professeurs dans l'état
      } else {
        setModalMessage('Erreur lors de la récupération des professeurs');
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage('Erreur lors de la récupération des professeurs');
      setShowModal(true);
    }
  };

  // Fonction pour récupérer les cours depuis le backend
  const fetchJoursCours = async () => {
    try {
      const response = await fetch('http://localhost:3000/cours/informations/planning', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const data: JourCours[] = await response.json(); // Notez l'utilisation de `JourCours[]` au lieu de `JourCours`
        setJoursCours(data);
      } else {
        setModalMessage('Erreur lors de la récupération des cours');
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage('Erreur lors de la récupération des cours');
      setShowModal(true);
    }
  };

  // Récupérer la liste des cours au chargement du composant
  useEffect(() => {
    fetchJoursCours(); // Appel de la fonction asynchrone pour charger les cours
    fetchProfesseurs();
  }, []); // Tableau vide signifie que cela s'exécute une seule fois au montage du composant

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    if (name === 'professeurs') {
      // Vérifier si l'élément cible est un <select> multiple
      if (e.target instanceof HTMLSelectElement) {
        const selectedProfesseurs = Array.from(e.target.selectedOptions, (option) => option.value);
        setFormData((prevData) => ({
          ...prevData,
          [name]: selectedProfesseurs, // Mettre à jour le tableau des professeurs sélectionnés
        }));
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  console.log(joursCours)
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const dataToSend: AjoutCours = {
      heure_debut: convertTimeToSQLTime(formData.heure_debut),
      heure_fin: convertTimeToSQLTime(formData.heure_fin),
      jour_semaine: formData.jour_semaine,
      type_cours: formData.type_cours,
      professeurs: formData.professeurs, // ✅ string[] attendu, string[] fourni
    };
  
    try {
      const response = await fetch('http://localhost:3000/cours/ajouter', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        fetchJoursCours(); // Recharger les cours
        setModalMessage('Cours ajouté avec succès');
        setShowModal(true);
      } else {
        setModalMessage('Erreur lors de l’ajout du cours');
        setShowModal(true);
      }
    } catch (error) {
      setModalMessage('Erreur lors de l’ajout du cours');
      setShowModal(true);
    }
  };

  async function deleteCours(jourSemaine: string): Promise<void> {
    console.log(jourSemaine)
    try {
        // Envoi de la requête de suppression vers le back-end
        const response = await fetch(`http://localhost:3000/cours/supprimer`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jourSemaine }),
        });
  
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression des cours');
        }
  
        const result = await response.json();
        console.log(result.message); // Affiche le message du back-end
        setModalMessage('Cours supprimé avec succès');
        setShowModal(true);
  
        // Appel de supprimerJour avec le jourSupprimé
        supprimerJour(jourSemaine);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la suppression des cours.');
    }
  }
  

  const supprimerJour = (jourSupprimé: string) => {
    setJoursCours(prev => prev.filter(c => c.jour !== jourSupprimé));
  };

  
  

  return (
    <Provider store={store}>
      <Tabs>
        <TabPanel label="Jours de cours">
          <h1>Liste des cours</h1>
          <ul className='list'>
            {joursCours.map((cours, index) => (
              <li key={index} className='list-item'>
                <span className='list-item-infos'>{cours.jour}</span>
                <span className='list-item-infos'>{cours.type_cours}</span>
                <span className='list-item-infos'>{cours.heure_debut}</span>
                <span className='list-item-infos'>{cours.heure_fin}</span>
                <span className='icons'>
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                      <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                      <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                    </svg>
                  )}
                </span>
                <span className='icon' onClick={() => deleteCours(cours.jour)}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/></svg>
                </span>
              </li>
            ))}
          </ul>
        </TabPanel>
        <TabPanel label="Ajouter un cours">
          <h1>Ajouter un cours</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="type_cours">Type de cours :</label>
              <select
                id="type_cours"
                name="type_cours"
                value={formData.type_cours}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionner --</option>
                <option value="Grappling">Grappling</option>
                <option value="JJB">JJB</option>
              </select>
            </div>
            <div>
              <label htmlFor="heure_debut">Heure de début :</label>
              <input
                type="time"
                id="heure_debut"
                name="heure_debut"
                value={formData.heure_debut}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="heure_fin">Heure de fin :</label>
              <input
                type="time"
                id="heure_fin"
                name="heure_fin"
                value={formData.heure_fin}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="jour_semaine">Jour de la semaine :</label>
              <select
                id="jour_semaine"
                name="jour_semaine"
                value={formData.jour_semaine}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un jour</option>
                {joursSemaine.map((jour, index) => (
                  <option key={index} value={jour}>
                    {jour}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="professeurs">Sélectionner un ou plusieurs professeurs :</label>
              <select
                id="professeurs"
                name="professeurs"
                value={formData.professeurs}
                onChange={handleChange} // nouveau handler spécial pour ce select multiple
                multiple
                required
              >
                {professeurs.map((professeur) => (
                  <option key={professeur.id} value={professeur.id}>
                    {professeur.first_name} {professeur.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button type="submit">Ajouter le cours</button>
            </div>
          </form>
        </TabPanel>
      </Tabs>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </Provider>
  );
};

export default AjouterCOurs;
