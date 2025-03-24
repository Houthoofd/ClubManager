import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../redux/store';
import Cours from '../app/pages/cours';
import Dashboard from '../app/pages/dashboard';
import Connexion from '../app/pages/connexion';
import Enregistrement from '../app/pages/enregistrement';
import Chat from '../app/pages/chat';
import Magasin from '../app/pages/magasin';
import Settings from '../app/pages/settings';
import Compte from '../app/pages/compte';
import Utilisateurs from '../app/pages/utilisateurs';
import Paiements from '../app/pages/paiements';
import MainLayout from '../components/ui/mainlayout';
import Messages from './pages/messages';
import Participants from './pages/cours/participants';

const App = () => {

  return (
    <Provider store={store}>
      <Router>
        <MainLayout>
          <Routes>
            {/* Définir les routes ici */}
            <Route path="/pages/cours" element={<Cours />} />
            <Route path="/pages/cours/participants" element={<Participants />} />
            <Route path="/pages/dashboard" element={<Dashboard />} />
            <Route path="/pages/messages" element={<Messages />} />
            <Route path="/pages/connexion" element={<Connexion />} />
            <Route path="/pages/chat" element={<Chat />} />
            <Route path="/pages/magasin" element={<Magasin />} />
            <Route path="/pages/settings" element={<Settings />} />
            <Route path="/pages/compte" element={<Compte />} />
            <Route path="/pages/utilisateurs" element={<Utilisateurs />} />
            <Route path="/pages/paiements" element={<Paiements />} />
            <Route path="/pages/enregistrement" element={<Enregistrement />} />

            {/* Redirection de la page d'accueil vers /pages/cours */}
            <Route path="/" element={<Navigate to="/pages/cours" />} />
          </Routes>
        </MainLayout>
      </Router>
    </Provider>
  );
};

export default App;
