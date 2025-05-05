import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { SET_RIGHT_SIDEBAR_USERS } from '../../redux/actions';  // Assurez-vous d'importer le bon type d'action

interface Message {
  utilisateur: string;
  message: string;
  date_envoi: string;
}

interface Utilisateur {
  id: string;
  prenom: string;
  nom: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Sélectionner l'état des utilisateurs sélectionnés depuis Redux
  const selectedUser = useSelector((state: any) => state.navigation.selecte_chat_user);

  const dispatch = useDispatch();

  console.log(selectedUser)

  useEffect(() => {
    // ✅ Connexion socket
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.emit('getHistorique');

    newSocket.on('historique', (historique: Message[]) => {
      setMessages(historique);
    });

    newSocket.on('chatMessage', (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // ✅ On fetch la liste des utilisateurs pour la sidebar
    fetch("http://localhost:3000/utilisateurs")
      .then((res) => res.json())
      .then((data) => {
        // ✅ Vérifie bien la structure de la réponse, ici data.data doit être un tableau d'utilisateurs
        if (data && data.data) {

          // ✅ On dispatch avec la nouvelle action pour stocker des users (id/prenom/nom)
          dispatch({
            type: "SET_RIGHT_SIDEBAR_USERS",
            payload: data.data, // On passe directement les utilisateurs récupérés
          });

          // ✅ Et on dispatch pour VIDER les items
        dispatch({
          type: "SET_RIGHT_SIDEBAR_ITEMS",
          payload: {}, // On vide tous les items
        });
        }
      })
      .catch((error) => {
        console.error("Erreur lors du fetch des utilisateurs :", error);
      });

    // ⛔️ Fermer le socket à la fin
    return () => {
      newSocket.disconnect();
    };
  }, [dispatch]);

  const handleSendMessage = () => {
    if (messageInput && socket) {
      socket.emit('chatMessage', { utilisateur: 'User', message: messageInput });
      setMessageInput('');
    }
  };

  return (
    <div>
      <h1>Chat en ligne</h1>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.utilisateur} :</strong> {msg.message}
            <span> {new Date(msg.date_envoi).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <input 
        type="text" 
        value={messageInput} 
        onChange={(e) => setMessageInput(e.target.value)} 
        placeholder="Entrez un message" 
      />
      <button onClick={handleSendMessage}>Envoyer</button>
    </div>
  );
};

export default Chat;
