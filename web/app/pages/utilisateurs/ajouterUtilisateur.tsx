import React, { useEffect, useState } from 'react';
import { Tabs, TabPanel } from '../../../components/ui/tabs';
import Modal from '@/components/ui/modal';
import type { UserData } from '@clubmanager/types';

const AjouterUtilisateur = () => {
  const [utilisateur, setUtilisateur] = useState<UserData>();
  const [userSchema, setUserSchema] = useState<UserData>();
  const [formData, setFormData] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  useEffect(() => {
    const fetchUserSchema = async () => {
      try {
        const response = await fetch('http://localhost:3000/utilisateurs');
        const data = await response.json();
        setUserSchema(data.data);
        if (data.data.length > 0) {
          const initialFormData: any = {};
          Object.keys(data.data[0]).forEach((key) => {
            if (key !== 'id') initialFormData[key] = '';
          });
          setFormData(initialFormData);

          // On charge les options pour chaque champ relationnel *_id
          Object.keys(data.data[0]).forEach((key) => {
            console.log(key)
            if (key.endsWith('_id')) {
              console.log(key)
              fetchSelectOptions(key);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des professeurs:', error);
      }
    };

    fetchUserSchema();
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
      console.log(data)
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

  const fetchProfesseur = async () => {
      try {
        const response = await fetch('http://localhost:3000/professeurs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        if (response.ok) {
          const data = await response.json(); // Notez l'utilisation de `JourCours[]` au lieu de `JourCours`
          setUtilisateur(data.data);
        } else {
          setModalMessage('Erreur lors de la récupération des professeurs');
          setShowModal(true);
        }
      } catch (error) {
        setModalMessage('Erreur lors de la récupération des professeurs');
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
      const response = await fetch('http://localhost:3000/utilisateurs/ajouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUtilisateur(data.data);
        setModalMessage("L'ajout de l'utilisateur à bien été realisé");
        setShowModal(true);
      } else {
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
        <button type="submit">Ajouter</button>
      </form>
    );
  };
  
  

  return (
    <div>
          <h1>Ajouter un utilisateur</h1>
          {CreerFormulaire()}
      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </div>
  );
};

export default AjouterUtilisateur;
