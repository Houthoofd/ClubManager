import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { Abonnement, Grade, Genres, UserData } from '@clubmanager/types';
import '../enregistrement-style.css';

function convertToNumber(value: any): number | null {
  if (typeof value === 'number') {
    return value;
  }
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? null : parsedValue;
}

function removeDuplicates<T>(array: T[], key: keyof T): T[] {
  return array.filter((item, index, self) => 
    index === self.findIndex((t) => t[key] === item[key])
  );
}

const findValueById = <T, K extends keyof T, V>(array: T[], id: any, key: K, valueKey: K): V | undefined => {
  // Convertir l'ID en nombre pour éviter des problèmes de type
  const numericId = Number(id);

  // Trouver l'élément qui correspond à l'ID
  const foundItem = array.find(item => item[key] === numericId);

  // Log pour afficher le tableau, l'ID recherché et l'élément trouvé
  console.log("Array:", array);
  console.log("ID:", numericId);
  console.log("Found Item:", foundItem);

  // Si l'élément est trouvé, retourne la valeur de la clé spécifique (valueKey)
  // Assurez-vous que la valeur retournée est du bon type
  return foundItem ? (foundItem[valueKey] as V) : undefined;
};









const Enregistrement = () => {
  console.log("Enregistrement component rendered");

  const [grades, setGrades] = useState<Grade[]>([]);
  const [genres, setGenres] = useState<Genres[]>([]);
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Indicateur de chargement
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

    console.log(name, value)
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
      genre_id: convertToNumber(formData.genre_id),
      date_naissance: formData.date_naissance,
      password: formData.password,
      status_id: formData.status_id,
      grade_id: convertToNumber(formData.grade_id),
      abonnement_id: convertToNumber(formData.abonnement_id),
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

  const fetchData = async () => {
    try {
      const [gradesResponse, genresResponse, abonnementsResponse] = await Promise.all([
        fetch('http://localhost:3000/informations/grades'),
        fetch('http://localhost:3000/informations/genres'),
        fetch('http://localhost:3000/informations/abonnements'),
      ]);
  
      let grades = await gradesResponse.json();
      let genres = await genresResponse.json();
      let abonnements = await abonnementsResponse.json();
  
      grades = removeDuplicates(grades, 'grade_id');
      genres = removeDuplicates(genres, 'genre_name');
      abonnements = removeDuplicates(abonnements, 'nom_plan');
  
      setGrades(grades);
      setGenres(genres);
      setAbonnements(abonnements);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setDataLoaded(true);
      setIsLoading(false); // Mettre à jour l'indicateur de chargement
    }
  };
  

  useEffect(() => {
    if (!dataLoaded && isLoading) { // Vérifier si les données ont déjà été chargées et si le chargement est en cours
      fetchData();
    }
  }, [dataLoaded, isLoading]); // Tableau de dépendances pour s'assurer que cela ne s'exécute qu'une seule fois au montage

  const nextStep = () => setCurrentStep((prevStep) => Math.min(prevStep + 1, 5));
  const prevStep = () => setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));

  return (
    <Provider store={store}>
      <div className='enregistrement-container'>
        <h1>Enregistrement</h1>

        <div className="progress-indicator">
          {[
            { title: 'Personnelles', icon: 'personal' },
            { title: 'Confidentielles', icon: 'confidential' },
            { title: 'Connexion', icon: 'connexion' },
            { title: 'Abonnement', icon: 'subscription' },
            { title: 'Résumé', icon: 'summary' }
          ].map((step, index) => (
            <React.Fragment key={step.title}>
              <div className={`step ${currentStep === index + 1 ? 'active' : currentStep > index + 1 ? 'validate' : ''}`}>
                <div className="step-header">
                  <div className='icon'>
                    {currentStep > index + 1 ? (
                      <svg className="check-icon" width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="green" d="M9 16.2l-4.2-4.2-1.4 1.4L9 19l10-10-1.4-1.4L9 16.2z" />
                      </svg>
                    ) : (
                      <svg className={`icon ${step.icon}`} width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        {step.icon === 'personal' && (
                          <path d="M12 12c2.67 0 8 1.33 8 4v2H4v-2c0-2.67 5.33-4 8-4zm0-2C9.79 10 8 8.21 8 6s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                        )}
                        {step.icon === 'confidential' && (
                          <path d="M12 2C9.24 2 7 4.24 7 7v4H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v4H9V7c0-1.66 1.34-3 3-3zm-6 8h12v7H6v-7z" />
                        )}
                        {step.icon === 'connexion' && (
                          <path d="M10 3h4v2h-4V3zm1 14h2v2h-2v-2zM11 7h2v8h-2V7z" />
                        )}
                        {step.icon === 'subscription' && (
                          <path d="M17 7h2a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h2V4a5 5 0 0110 0v3zm-8-3v3h6V4a3 3 0 00-6 0zm11 5H4v11h14V9z" />
                        )}
                        {step.icon === 'summary' && (
                          <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                        )}
                      </svg>
                    )}
                  </div>
                  <h6 className="step-title">{step.title}</h6>
                </div>
              </div>
              {index < 4 && (
                <span className={`${currentStep > index + 1 ? 'progress' : ''}`}></span>
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className='form_1'>
              <div className='row_1'>
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
              </div>
              <div className='row_2'>
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
              </div>
              <button
                type="button"
                className={currentStep === 1 ? 'disabled' : ''}
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={nextStep}
              >
                Suivant
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className='form_2'>
              <div className='input-group'>
                <label htmlFor="genre_id">Genre :</label>
                <select
                  id="genre_id"
                  name="genre_id"
                  value={formData.genre_id ?? ""}
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

          {currentStep === 3 && (
            <div className='form_3'>
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
                  value={formData.grade_id ?? ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un grade</option>
                  {grades.map((grade: Grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade_id}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="button" onClick={nextStep}>Suivant</button>
            </div>
          )}

          {currentStep === 4 && (
            <div className='form_4'>
              <div className='input-group'>
                <label htmlFor="abonnement_id">Abonnement :</label>
                <select
                  id="abonnement_id"
                  name="abonnement_id"
                  value={formData.abonnement_id ?? ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un abonnement</option>
                  {abonnements.map((abonnement: Abonnement) => (
                    <option key={abonnement.id} value={abonnement.id}>
                      {abonnement.nom_plan}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="button" onClick={nextStep}>Suivant</button>
            </div>
          )}

          {currentStep === 5 && (
            <div className='form_5'>
              <h2>Résumé des informations</h2>
              <p><strong>Prénom :</strong> {formData.prenom}</p>
              <p><strong>Nom :</strong> {formData.nom}</p>
              <p><strong>Nom d'utilisateur :</strong> {formData.nom_utilisateur}</p>
              <p><strong>Email :</strong> {formData.email}</p>
              <p><strong>Genre :</strong> {formData.genre_id ? findValueById(genres, formData.genre_id, 'id', 'genre_name') : 'Aucun genre sélectionné'}</p>
              <p><strong>Date de naissance :</strong> {formData.date_naissance}</p>
              <p><strong>Grade :</strong> {formData.grade_id ? findValueById(grades, formData.grade_id, 'id', 'grade_id') : 'Aucun genre sélectionné'}</p>
              <p><strong>Abonnement :</strong> {formData.abonnement_id ? findValueById(abonnements, formData.abonnement_id, 'id', 'nom_plan') : 'Aucun genre sélectionné'}</p>
              <button type="button" onClick={prevStep}>Précédent</button>
              <button type="submit">Soumettre</button>
            </div>
          )}
        </form>
      </div>
    </Provider>
  );
};

export default Enregistrement;
