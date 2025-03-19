import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { Abonnement, Grade, Genres, UserData } from '@clubmanager/types';
import '../enregistrement-style.css';

function convertToNumberIfNeeded(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? null : parsedValue;
}

const Enregistrement = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [genres, setGenres] = useState<Genres[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [formData, setFormData] = useState<UserData>({
    prenom: '',
    nom: '',
    nom_utilisateur: '',
    email: '',
    genre_id: 1,
    date_naissance: '',
    password: '',
    status_id: 1,
    grade_id: 1,
    abonnement_id: 1,
  });

  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    const dataToSend: UserData = {
      prenom: formData.prenom,
      nom: formData.nom,
      nom_utilisateur: formData.nom_utilisateur,
      email: formData.email,
      genre_id: convertToNumberIfNeeded(formData.genre_id),
      date_naissance: formData.date_naissance,
      password: formData.password,
      status_id: formData.status_id,
      grade_id: convertToNumberIfNeeded(formData.grade_id),
      abonnement_id: convertToNumberIfNeeded(formData.abonnement_id),
    };

    try {
      const response = await fetch('http://localhost:3000/utilisateurs/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Utilisateur inscrit avec succès', data);
      } else {
        console.error('Erreur de l\'API:', data.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/grades');
        const grades = await response.json();
        setGrades(grades);
      } catch (error) {
        console.error('Erreur lors de la récupération des grades:', error);
      }
    };

    const fetchGenres = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/genres');
        const genres = await response.json();
        setGenres(genres);
      } catch (error) {
        console.error('Erreur lors de la récupération des genres:', error);
      }
    };

    const fetchAbonnements = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/abonnements');
        const abonnements = await response.json();
        setAbonnements(abonnements);
      } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
      }
    };

    fetchGrades();
    fetchGenres();
    fetchAbonnements();
  }, []);

  const nextStep = () => setCurrentStep((prevStep) => Math.min(prevStep + 1, 4));
  const prevStep = () => setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));

  return (
    <Provider store={store}>
      <div className='enregistrement-container'>
        <h1>Enregistrement</h1>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`step ${currentStep === 1 ? 'active' : ''}`}>1</div>
          <span style={{ width: currentStep > 1 ? '33%' : '0%' }}></span>
          <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2</div>
          <span style={{ width: currentStep > 2 ? '33%' : '0%' }}></span>
          <div className={`step ${currentStep === 3 ? 'active' : ''}`}>3</div>
          <span style={{ width: currentStep > 3 ? '34%' : '0%' }}></span>
          <div className={`step ${currentStep === 4 ? 'active' : ''}`}>4</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Information Personnelle */}
          {currentStep === 1 && (
            <div>
              <div className='input-group'>
                <label htmlFor="prenom">Prénom :</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='input-group'>
                <label htmlFor="nom">Nom :</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='input-group'>
                <label htmlFor="nom_utilisateur">Nom d'utilisateur :</label>
                <input
                  type="text"
                  id="nom_utilisateur"
                  name="nom_utilisateur"
                  value={formData.nom_utilisateur}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='input-group'>
                <label htmlFor="email">Email :</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="button" onClick={nextStep}>Suivant</button>
            </div>
          )}

          {/* Step 2: Genre et Date de Naissance */}
          {currentStep === 2 && (
            <div>
              <div className='input-group'>
                <label htmlFor="genre_id">Genre :</label>
                <select
                  id="genre_id"
                  name="genre_id"
                  value={formData.genre_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un genre</option>
                  {genres.map((genre: Genres) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.genre_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='input-group'>
                <label htmlFor="date_naissance">Date de naissance :</label>
                <input
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="button" onClick={nextStep}>Suivant</button>
            </div>
          )}

          {/* Step 3: Mot de Passe et Grade */}
          {currentStep === 3 && (
            <div>
              <div className='input-group'>
                <label htmlFor="password">Mot de Passe :</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='input-group'>
                <label htmlFor="grade_id">Grade :</label>
                <select
                  id="grade_id"
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un grade</option>
                  {grades.map((grade: Grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="button" onClick={nextStep}>Suivant</button>
            </div>
          )}

          {/* Step 4: Abonnement */}
          {currentStep === 4 && (
            <div>
              <div className='input-group'>
                <label htmlFor="abonnement_id">Abonnement :</label>
                <select
                  id="abonnement_id"
                  name="abonnement_id"
                  value={formData.abonnement_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un abonnement</option>
                  {abonnements.map((abonnement: Abonnement) => (
                    <option key={abonnement.id} value={abonnement.id}>
                      {abonnement.abonnement_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="submit">S'inscrire</button>
            </div>
          )}
        </form>
      </div>
    </Provider>
  );
};

export default Enregistrement;
