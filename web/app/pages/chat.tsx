import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';

interface Message {
  utilisateur: string;
  message: string;
  date_envoi: string;
  sender_id?: string; // Ajouté pour comparaison
}

function formatDateFromISO(isoDateString: string) {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const selectedUser = useSelector((state: any) => state.navigation.selecte_chat_user);
  const dispatch = useDispatch();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && currentUserId && selectedUser?.id) {
      socket.emit('getHistorique', { userId: currentUserId, receiverId: selectedUser.id });
    }
  }, [selectedUser, socket, currentUserId]);

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
        date_envoi: new Date().toISOString(),
        sender_id: userId // Ajouté pour comparer
      };

      socket.emit('chatMessage', messageData);

      setMessages((prevMessages) => [...prevMessages, messageData]);

      setMessageInput('');
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setCurrentUserId(parsedData?.data.id?.toString() || null);
      } catch (error) {
        console.error('Erreur lors du parsing de userData', error);
      }
    }

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.emit('getHistorique', { userId: currentUserId, receiverId: selectedUser?.id });

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

  // ==> ICI on récupère userId UNE SEULE FOIS avant le .map
  let userId = null;
  const storedData = localStorage.getItem('userData');
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData);
      userId = parsedData?.data.id?.toString() || null;
    } catch (error) {
      console.error('Erreur lors du parsing de userData', error);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '750px' }}>
      <h1>Chat avec {selectedUser?.first_name} {selectedUser?.last_name}</h1>
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
        {[...messages]
          .sort((a, b) => {
            const dateA = new Date(a.date_envoi || a.created_at).getTime();
            const dateB = new Date(b.date_envoi || b.created_at).getTime();
            return dateA - dateB;
          })
          .map((msg, index) => {
            // Bonne condition : si moi = sender_id
            const isSentByMe = msg.sender_id?.toString() === userId;

            const userName = isSentByMe
              ? 'Moi'
              : `${selectedUser?.first_name || 'Utilisateur'} ${selectedUser?.last_name || ''}`;

            return (
              <div key={index} style={{ textAlign: isSentByMe ? 'right' : 'left' }}>
                <strong>{userName} :</strong>
                <div
                  style={{
                    backgroundColor: isSentByMe ? '#d1e7dd' : '#f8d7da',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    marginBottom: '10px',
                  }}
                >
                  {msg.contenu || msg.message}
                </div>
                <span>
                  {formatDateFromISO(msg.date_envoi || msg.created_at)}
                </span>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '10px', display: 'flex' }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Entrez un message"
          style={{
            flexGrow: 1,
            padding: '5px',
            marginRight: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
        <button onClick={handleSendMessage} style={{ padding: '5px 15px' }}>
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default Chat;
