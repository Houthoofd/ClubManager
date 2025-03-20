import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux'; // Assurez-vous d'importer le Provider
import store from '../../redux/store'; // Importation du store
import { CoursData } from '@clubmanager/types';
import '../cours-style.css'; 

const Cours = () => {
  const [cours, setCours] = useState<CoursData[]>([]);
  const [reservations, setReservations] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/cours'); // Assurez-vous que l'URL est correcte
      if (!response.ok) {
        throw new Error('Erreur réseau lors de la récupération des cours');
      }
      const data: CoursData[] = await response.json(); // Assurez-vous que la réponse est bien du type Cours[]
      setCours(data); // Mise à jour de l'état avec les cours récupérés
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    }
  };

  const toggleReservation = (coursId: number) => {
    if (reservations.includes(coursId)) {
      setReservations(reservations.filter(id => id !== coursId)); // Annuler la réservation
    } else {
      setReservations([...reservations, coursId]); // Réserver le cours
    }
  };

  useEffect(() => {
    fetchData(); // Appel à fetchData lors du montage du composant
  }, []); // Le tableau vide assure que la requête est faite uniquement au montage

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
          {cours.map((coursItem) => (
            <div className='class-list-item' key={coursItem.id}>
              <div className='date'>{new Date(coursItem.date_cours).toLocaleDateString()}<div/></div>
              <div className='type'><div>{coursItem.type_cours}</div></div>
              <div className='heure-debut'><div>{coursItem.heure_debut}</div></div>
              <div className='heure-fin'><div>{coursItem.heure_fin}</div></div>
              {/* Bouton pour réserver ou annuler */}
              <button 
                onClick={() => toggleReservation(coursItem.id)}
              >
                {reservations.includes(coursItem.id) ? 'Annuler' : 'Réserver'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Provider>
  );
};

export default Cours;