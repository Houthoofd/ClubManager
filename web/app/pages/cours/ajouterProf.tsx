import React, { useEffect, useState } from 'react';
import { Tabs, TabPanel } from '../../../components/ui/tabs';
import Modal from '@/components/ui/modal';

const AjouterProf = () => {
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  useEffect(() => {
    const fetchProfesseurs = async () => {
      try {
        const response = await fetch('http://localhost:3000/professeurs');
        const data = await response.json();
        setProfesseurs(data);

        if (data.length > 0) {
          const initialFormData: any = {};
          Object.keys(data[0]).forEach((key) => {
            if (key !== 'id') initialFormData[key] = '';
          });
          setFormData(initialFormData);

          // On charge les options pour chaque champ relationnel *_id
          Object.keys(data[0]).forEach((key) => {
            if (key.endsWith('_id')) {
              fetchSelectOptions(key);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des professeurs:', error);
      }
    };

    fetchProfesseurs();
  }, []);

  const pluralize = (word: string) => {
    // Mots qui ne prennent pas de "s" au pluriel dans tes routes
    const exceptions = ['status'];

    if (exceptions.includes(word)) {
      return word;
    }

    // Règle simple : on ajoute juste "s"
    return word + 's';
  };

  const fetchSelectOptions = async (key: string) => {
    const apiName = key.replace('_id', ''); // Ex: abonnement_id ➔ abonnement
    const pluralApiName = pluralize(apiName); // Ex: abonnement ➔ abonnements

    try {
      const response = await fetch(`http://localhost:3000/informations/${pluralApiName}`);
      const data = await response.json();

      setSelectOptions((prev: any) => ({
        ...prev,
        [key]: data,
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des options pour ${key}:`, error);
      setModalMessage(`Erreur lors de la récupération des options pour ${key}:`);
      setShowModal(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulaire soumis avec:', formData);

    try {
      const response = await fetch('http://localhost:3000/professeurs/ajouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Professeur ajouté avec succès');
        const updatedProfesseurs = await fetch('http://localhost:3000/professeurs');
        const data = await updatedProfesseurs.json();
        setProfesseurs(data);
      } else {
        alert('Erreur lors de l\'ajout');
        setModalMessage('Erreur lors de l\'ajout');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi :', error);
      setModalMessage('Erreur lors de l\'envoi :');
      setShowModal(true);
    }
  };

  const CreerFormulaire = () => {
    const formatLabel = (label: string) => {
      // Enlever les underscores et les remplacer par des espaces
      let formattedLabel = label.replace(/_/g, ' ');
  
      // Si le label se termine par '_id', on le coupe pour enlever le 'id'
      if (formattedLabel.endsWith(' id')) {
        formattedLabel = formattedLabel.slice(0, -3); // Enlever " id" à la fin
      }
  
      // Remplacer 'first name' par 'Nom' et 'last name' par 'Prénom'
      if (formattedLabel.toLowerCase() === 'first name') {
        formattedLabel = 'Nom';
      } else if (formattedLabel.toLowerCase() === 'last name') {
        formattedLabel = 'Prénom';
      }else if (formattedLabel.toLowerCase() === 'date of birth') {
        formattedLabel = 'Date de naissance';
      }
  
      return formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1); // Capitaliser la première lettre
    };
  
    return (
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((key) => {
          if (key === 'id') return null; // Ne pas afficher l'ID
  
          // Si c’est une relation *_id ➔ on affiche un select dynamique
          if (key.endsWith('_id')) {
            return (
              <div key={key} style={{ marginBottom: '10px' }}>
                <label>{formatLabel(key)} :</label>
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  style={{ marginLeft: '10px' }}
                >
                  <option value="">Sélectionner</option>
                  {(selectOptions[key] || []).map((option: any) => {
                    return (
                      <option key={option.id} value={option.id}>
                        {/* Affichage dynamique des valeurs en fonction des clés présentes dans l'objet */}
                        {option.nom_plan || option.nom_role || option.grade_id || option.genre_name || `ID ${option.id}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          }
  
          const inputType = key.toLowerCase().includes('email') ? 'email' : 'text';
  
          return (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label>{formatLabel(key)} :</label>
              <input
                type={inputType}
                name={key}
                value={formData[key]}
                onChange={handleChange}
                style={{ marginLeft: '10px' }}
              />
            </div>
          );
        })}
        <button type="submit">Ajouter Professeur</button>
      </form>
    );
  };
  
  

  return (
    <div>
      <Tabs>
        <TabPanel label="Ajouter un professeur">
          <h1>Ajouter un professeur</h1>
          {CreerFormulaire()}
        </TabPanel>

        <TabPanel label="Liste des professeurs">
          <h1>Liste des professeurs</h1>
          <ul>
            {professeurs.map((prof: any) => (
              <li key={prof.id}>
                {prof.first_name} {prof.last_name} - {prof.email}
              </li>
            ))}
          </ul>
        </TabPanel>
      </Tabs>
      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </div>
  );
};

export default AjouterProf;
