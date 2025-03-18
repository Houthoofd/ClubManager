import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from '../../redux/store';
import { UserDataLogin } from '@clubmanager/types';
import Modal from '../../components/ui/modal'; // Adjust the import according to your file structure

const Connexion = () => {
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
      <div>
        <h1>Connexion</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email :</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              aria-label="Email"
            />
          </div>
          <div>
            <label htmlFor="password">Mot de passe :</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              aria-label="Mot de passe"
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
