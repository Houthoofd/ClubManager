import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../redux/store';
import Cours from '../app/pages/cours';
import Dashboard from '../app/pages/dashboard';
import Connexion from '../app/pages/connexion';
import Enregistrement from '../app/pages/enregistrement';
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
