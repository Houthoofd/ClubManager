import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/modal';

const Messages = () => {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [typesMessages, setTypesMessages] = useState<any[]>([]); // Nouveau : types de messages
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>(''); // Nouveau : type de message sélectionné

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les utilisateurs
        const responseUsers = await fetch('http://localhost:3000/utilisateurs');
        if (!responseUsers.ok) {
          throw new Error('Erreur réseau lors de la récupération des utilisateurs');
        }
        const utilisateurs = await responseUsers.json();
        setUtilisateurs(utilisateurs.data);

        // Récupérer les types de messages
        const responseTypes = await fetch('http://localhost:3000/messages');
        if (!responseTypes.ok) {
          throw new Error('Erreur réseau lors de la récupération des types de messages');
        }
        const types = await responseTypes.json();
        setTypesMessages(types.data);

      } catch (error) {
        setError('Erreur lors de la récupération des données');
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, []);

  // Gestion de la sélection multiple (utilisateurs)
  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setSelectedUsers(selectedOptions);
  };

  // Fonction pour envoyer le message
  const handleSendMessage = async () => {
    if (selectedUsers.length === 0) {
      setModalMessage('Veuillez sélectionner au moins un utilisateur.');
      setShowModal(true);
      return;
    }

    if (selectedType === '') {
      setModalMessage('Veuillez sélectionner un type de message.');
      setShowModal(true);
      return;
    }

    console.log({ destinataires: selectedUsers, type_message_id: selectedType });
    

    try {
      const response = await fetch(`http://localhost:3000/messages/envoie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinataires: selectedUsers,
          type_message_id: selectedType, // On envoie l'ID du type de message
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur réseau lors de l\'envoi du message');
      }

      const result = await response.json();
      console.log(result);

      const selectedNames = utilisateurs
        .filter((u) => selectedUsers.includes(u.id.toString()))
        .map((u) => `${u.first_name} ${u.last_name}`)
        .join(', ');

      setModalMessage(`Message de type "${getTypeTitle(selectedType)}" envoyé à : ${selectedNames}`);
      setShowModal(true);

      // Réinitialisation
      setSelectedType('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setModalMessage('Erreur lors de l\'envoi du message.');
      setShowModal(true);
    }
  };

  // Pour retrouver le titre du type sélectionné
  const getTypeTitle = (id: string) => {
    const found = typesMessages.find((t) => t.id.toString() === id);
    return found ? found.titre : '';
  };

  return (
    <div>
      <h1>Messages</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Sélection des utilisateurs */}
      <label htmlFor="users">Sélectionnez des utilisateurs :</label>
      <select id="users" multiple value={selectedUsers} onChange={handleSelectionChange}>
        {utilisateurs.map((utilisateur) => (
          <option key={utilisateur.id} value={utilisateur.id}>
            {utilisateur.first_name} {utilisateur.last_name}
          </option>
        ))}
      </select>

      <p>
        Utilisateurs sélectionnés :{' '}
        {utilisateurs
          .filter((u) => selectedUsers.includes(u.id.toString()))
          .map((u) => `${u.first_name} ${u.last_name}`)
          .join(', ')}
      </p>

      {/* Sélection du type de message */}
      <label htmlFor="types">Sélectionnez un type de message :</label>
      <select id="types" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
        <option value="">-- Choisissez un type --</option>
        {typesMessages.map((type) => (
          <option key={type.id} value={type.id}>
            {type.title}
          </option>
        ))}
      </select>

      {/* Bouton envoyer */}
      <br />
      <button onClick={handleSendMessage}>Envoyer le message</button>

      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
      />
    </div>
  );
};

export default Messages;
