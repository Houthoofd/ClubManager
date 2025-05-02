import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { Tabs, TabPanel } from '../../../components/ui/tabs';
import Modal from '@/components/ui/modal';
import type { AjoutCours, JourCours, Professeur } from '@clubmanager/types';

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


  const [formData, setFormData] = useState({
    type_cours: '',
    heure_debut: '',
    heure_fin: '',
    jour_semaine: '',
    professeurs: [] as string[]
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
  
  
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const dataToSend: AjoutCours = {
      heure_debut: convertTimeToSQLTime(formData.heure_debut),
      heure_fin: convertTimeToSQLTime(formData.heure_fin),
      jour_semaine: formData.jour_semaine,
      type_cours: formData.type_cours,
      professeurs: formData.professeurs, // Tableau des professeurs
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
  
  

  return (
    <Provider store={store}>
      <Tabs>
        <TabPanel label="Jours de cours">
          <h1>Liste des cours</h1>
          <ul>
            {joursCours.map((cours, index) => (
              <li key={index}>
                {cours.jour} - {cours.type_cours} - {cours.heure_debut} - {cours.heure_fin}
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
              <label htmlFor="professeurs">Sélectionner les professeurs :</label>
              <select
                id="professeurs"
                name="professeurs"
                value={formData.professeurs}
                onChange={handleChange}
                required
              >
                {professeurs.map((professeur) => {
                  console.log(professeur.first_name);
                  return (
                    <option key={professeur.id} value={professeur.id}>
                      {professeur.first_name} {professeur.last_name}
                    </option>
                  );
                })}

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
