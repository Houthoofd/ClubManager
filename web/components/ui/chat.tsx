import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import '../../app/styles/components/chat.css';

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
  const [loading, setLoading] = useState(true); // Nouvel état pour le chargement

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
      setLoading(true); // Déclenche le "chargement" quand on change d'utilisateur
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
        sender_id: userId
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
      setLoading(false); // Fin du chargement une fois qu'on a les messages
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

  // ==> On récupère userId UNE SEULE FOIS avant le .map
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'auto' }}>
      <h1>Chat avec {selectedUser?.first_name} {selectedUser?.last_name}</h1>
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>Chargement des messages...</div>
        ) : (
          [...messages]
            .sort((a, b) => {
              const dateA = new Date(a.date_envoi || a.created_at).getTime();
              const dateB = new Date(b.date_envoi || b.created_at).getTime();
              return dateA - dateB;
            })
            .map((msg, index) => {
              const isSentByMe = msg.sender_id?.toString() === userId;

              const userName = isSentByMe
                ? 'Moi'
                : `${selectedUser?.first_name || 'Utilisateur'} ${selectedUser?.last_name || ''}`;

              return (
                <div key={index} style={{ textAlign: isSentByMe ? 'right' : 'left' }}>
                  <strong>{userName} :</strong>
                  <div
                    style={{
                      backgroundColor: isSentByMe ? '#222533' : '#222533',
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
            })
        )}
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
        <button
          onClick={handleSendMessage}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            border: 'none',
            backgroundColor: '#d1e7dd',
            cursor: 'pointer',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#5f6368"
          >
            <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;
