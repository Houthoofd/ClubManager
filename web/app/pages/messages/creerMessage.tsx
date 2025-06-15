import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from '../../../redux/store';
import { Tabs, TabPanel } from '../../../components/ui/tabs';

const CreerMessage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]); // Tableau pour stocker les messages récupérés

  // Fonction pour récupérer les messages existants
  const fetchMessages = async () => {
    try {
      const res = await fetch('http://localhost:3000/messages');
      const data = await res.json();

      if (res.ok) {
        setMessages(data.data);
      } else {
        console.error('Erreur lors de la récupération des messages :', data.error);
      }
    } catch (error) {
      console.error('Erreur de connexion au serveur :', error);
    }
  };

  // useEffect pour récupérer les messages au chargement
  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/messages/creer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Message créé :', data);
        setResponseMessage(data.message);
        setTitle('');
        setContent('');
        fetchMessages(); // On recharge la liste après création
      } else {
        setResponseMessage(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors de l’envoi :', error);
      setResponseMessage('Erreur de connexion au serveur');
    }
  };

  return (
    <Provider store={store}>
      <Tabs label="Creer son message">
        <TabPanel label="Créer son message">
          <h1>Créer son message</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <div>
              <label>Titre :</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>Contenu :</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{ width: '100%', height: '100px' }}
              />
            </div>
            <button type="submit">Envoyer</button>
          </form>

          {responseMessage && <p>{responseMessage}</p>}
        </TabPanel>

        <TabPanel label="Messages déjà existants">
          <h1>Messages déjà existants</h1>
          {messages.length === 0 ? (
            <p>Aucun message pour le moment.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {messages.map((msg) => (
                <li key={msg.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <div className='row' style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{msg.title}</h3>
                    <p>{msg.content}</p>
                    <small>Créé le : {new Date(msg.created_at).toLocaleString()}</small>
                  </div>

                  <div className='row' style={{ display: 'flex', gap: '1rem' }}>
                    <div className='icon' style={{ cursor: 'pointer' }}>
                      {/* Icône de poubelle */}
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm80-160h80v-360h-80v360Zm160 0h80v-360h-80v360Z"/>
                      </svg>
                    </div>
                    <div className='icon' style={{ cursor: 'pointer' }}>
                      {/* Icône crayon */}
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                      </svg>
                    </div>
                  </div>
                </li>
              ))}

            </ul>
          )}
        </TabPanel>
      </Tabs>
    </Provider>
  );
};

export default CreerMessage;
