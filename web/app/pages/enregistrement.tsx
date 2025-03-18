import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { Abonnement, Grade, Genres, UserData} from '@clubmanager/types'


function convertToNumberIfNeeded(value: any): number | null {
  // Si la valeur est déjà un nombre, on la retourne telle quelle
  if (typeof value === 'number') {
    return value;
  }

  // Si la valeur n'est pas un nombre, on essaie de la convertir
  const parsedValue = Number(value);

  // Si la conversion échoue (par exemple, une chaîne qui n'est pas un nombre), on retourne null
  return isNaN(parsedValue) ? null : parsedValue;
}

const Enregistrement = () => {
  // Définir l'état du formulaire avec des valeurs par défaut
  // État pour stocker les grades récupérés
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

  // Gérer les changements des champs
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Conversion des données en nombres si nécessaire
    const dataToSend: UserData = {
      prenom: formData.prenom,
      nom: formData.nom,
      nom_utilisateur: formData.nom_utilisateur,
      email: formData.email,
      genre_id: convertToNumberIfNeeded(formData.genre_id), // S'assurer que genre_id est un nombre
      date_naissance: formData.date_naissance,
      password: formData.password,
      status_id: formData.status_id,
      grade_id: convertToNumberIfNeeded(formData.grade_id), // S'assurer que grade_id est un nombre
      abonnement_id: convertToNumberIfNeeded(formData.abonnement_id), // S'assurer que abonnement_id est un nombre
    };
    
    console.log('Données envoyées :', dataToSend);
    
    try {
      const response = await fetch('http://localhost:3000/utilisateurs/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend), // Envoyer les données dans le bon ordre
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
  
  
  

  // Utiliser useEffect pour récupérer les grades lors du chargement du composant
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/grades'); // Remplacez l'URL si nécessaire
        const grades = await response.json();
        setGrades(grades); // Mettre à jour l'état avec les grades récupérés
      } catch (error) {
        console.error('Erreur lors de la récupération des grades:', error);
      }
    };

    const fetchGenres = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/genres'); // Remplacez l'URL si nécessaire
        const genres = await response.json();
        setGenres(genres); // Mettre à jour l'état avec les genres récupérés
      } catch (error) {
        console.error('Erreur lors de la récupération des genres:', error);
      }
    };

    const fetchAbonnements = async () => {
      try {
        const response = await fetch('http://localhost:3000/informations/abonnements'); // Remplacez l'URL si nécessaire
        const abonnements = await response.json();
        setAbonnements(abonnements); // Mettre à jour l'état avec les genres récupérés
      } catch (error) {
        console.error('Erreur lors de la récupération des plans tarifaires:', error);
      }
    };

    fetchGrades();
    fetchGenres()
    fetchAbonnements()
  }, []); // Le tableau vide assure que l'appel à fetch est effectué uniquement lors du premier rendu

  return (
    <Provider store={store}>
      <h1>Enregistrement</h1>
      <form onSubmit={handleSubmit}>
        {/* Prénom */}
        <label htmlFor="prenom">Prénom :</label>
        <input
          type="text"
          id="prenom"
          name="prenom"
          value={formData.prenom}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Nom */}
        <label htmlFor="nom">Nom :</label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Nom d'utilisateur */}
        <label htmlFor="nom_utilisateur">Nom d'utilisateur :</label>
        <input
          type="text"
          id="nom_utilisateur"
          name="nom_utilisateur"
          value={formData.nom_utilisateur}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Email */}
        <label htmlFor="email">Email :</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Genres */}
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
        <br /><br />

        {/* Date de naissance */}
        <label htmlFor="date_naissance">Date de naissance :</label>
        <input
          type="date"
          id="date_naissance"
          name="date_naissance"
          value={formData.date_naissance}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Mot de passe */}
        <label htmlFor="password">Mot de passe :</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <br /><br />

        {/* Grade - Récupération dynamique */}
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
              {grade.grade_id}
            </option>
          ))}
        </select>
        <br /><br />

        {/* Abonnement */}
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
                {abonnement.nom_plan} {/* Affichage du nom de l'abonnement */}
              </option>
            ))}
          </select>
          <br /><br />


        {/* Soumettre le formulaire */}
        <button type="submit" onClick={handleSubmit}>S'inscrire</button>
      </form>
    </Provider>
  );
};

export default Enregistrement;
