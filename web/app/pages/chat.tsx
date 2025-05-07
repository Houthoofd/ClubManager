import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';

interface Message {
  utilisateur: string;
  message: string;
  date_envoi: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const selectedUser = useSelector((state: any) => state.navigation.selecte_chat_user);
  const dispatch = useDispatch();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ✅ Scroll automatique
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput && socket) {
      const storedData = localStorage.getItem('userData');
      let userId = null;

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          userId = parsedData?.data.id;
        } catch (error) {
          console.error('Erreur lors du parsing de userData', error);
        }
      }

      const messageData = {
        utilisateur: userId,
        message: messageInput,
        receiverId: selectedUser ? selectedUser.id : null,
      };

      console.log('✅ Message envoyé côté client :', messageData);
      socket.emit('chatMessage', messageData);

      setMessageInput('');
    }
  };

  useEffect(() => {
    // ✅ On récupère l'id du user connecté
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setCurrentUserId(parsedData?.data.id?.toString() || null);
      } catch (error) {
        console.error('Erreur lors du parsing de userData', error);
      }
    }

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

    fetch("http://localhost:3000/utilisateurs")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          dispatch({
            type: "SET_RIGHT_SIDEBAR_USERS",
            payload: data.data,
          });

          dispatch({
            type: "SET_RIGHT_SIDEBAR_ITEMS",
            payload: {},
          });
        }
      })
      .catch((error) => {
        console.error("Erreur lors du fetch des utilisateurs :", error);
      });

    return () => {
      newSocket.disconnect();
    };
  }, [dispatch]);

  return (
    <div>
      <h1>Chat {selectedUser?.first_name} {selectedUser?.last_name}</h1>
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
