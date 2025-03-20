import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { UserDataLogin } from '@clubmanager/types';
import Modal from '../../components/ui/modal';
import '../connexion-style.css';
import backGroundImage from '../../assets/images/bg.jpg' // Adjust the import according to your file structure

const Connexion = () => {
  console.log("Connexion component rendered");
  const [formData, setFormData] = useState<UserDataLogin>({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    const dataToSend: UserDataLogin = {
      email: formData.email,
      password: formData.password,
    };

    console.log(dataToSend);
    try {
      const response = await fetch('http://localhost:3000/utilisateurs/connexion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Utilisateur trouvé avec succès', data);
        setModalMessage('Connexion réussie !');
        setShowModal(true);
      } else {
        setError(data.message || 'Erreur inconnue');
      }
    } catch (error) {
      setError('Erreur de connexion');
    }
  };

  return (
    <Provider store={store}>
      <div className="login-container">
          <h2>Bienvenue</h2>
          <p>Veuillez vous connecter pour continuer.</p>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit">Se connecter</button>
          </form>
          <Modal
            showModal={showModal}
            setShowModal={setShowModal}
            message={modalMessage}
            title="Notification"
            redirectUrl="/" // Exemple de redirection avec '/pages'
          />
        </div>
    </Provider>
  );
};

export default Connexion;
