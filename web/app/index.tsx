import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../redux/store';
import Cours from '../app/pages/cours';
import AjouterCours from '../app/pages/cours/ajouterCours';
import AjouterProf from '../app/pages/cours/ajouterProf';
import Dashboard from '../app/pages/dashboard';
import Connexion from '../app/pages/connexion';
import Enregistrement from '../app/pages/enregistrement';
import Chat from '../app/pages/chat';
import Magasin from '../app/pages/magasin/magasin';
import AjouterArticle from '../app/pages/magasin/ajouterArticle';
import ModifierArticle from '../app/pages/magasin/modifierArticle';
import Settings from '../app/pages/settings';
import Compte from '../app/pages/compte';
import Utilisateurs from '../app/pages/utilisateurs';
import Utilisateur from './pages/utilisateurs/consulterUtilisateur';
import AjouterUtilisateur from './pages/utilisateurs/ajouterUtilisateur';
import Paiements from '../app/pages/paiements';
import MainLayout from '../components/ui/mainlayout';
import Messages from './pages/messages';
import Participants from './pages/cours/consulterParticipants';

const App = () => {

  return (
    <Provider store={store}>
      <Router>
        <MainLayout>
          <Routes>
            {/* Définir les routes ici */}
            <Route path="/pages/cours" element={<Cours />} />
            <Route path="/pages/cours/participants" element={<Participants />} />
            <Route path="/pages/cours/ajouter_cours" element={<AjouterCours />} />
            <Route path="/pages/cours/ajouter_professeur" element={<AjouterProf />} />

            <Route path="/pages/dashboard" element={<Dashboard />} />

            <Route path="/pages/messages" element={<Messages />} />

            <Route path="/pages/connexion" element={<Connexion />} />

            <Route path="/pages/chat" element={<Chat />} />

            <Route path="/pages/magasin/articles" element={<Magasin />} />
            <Route path="/pages/magasin/ajouter_article" element={<AjouterArticle />} />
            <Route path="/pages/magasin/modifier_article" element={<ModifierArticle />} />

            <Route path="/pages/settings" element={<Settings />} />

            <Route path="/pages/compte" element={<Compte />} />

            <Route path="/pages/utilisateurs" element={<Utilisateurs />} />
            <Route path="/pages/utilisateurs/utilisateur" element={<Utilisateur />} />
            <Route path="/pages/utilisateurs/ajouter_utilisateur" element={<AjouterUtilisateur />} />
            
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
