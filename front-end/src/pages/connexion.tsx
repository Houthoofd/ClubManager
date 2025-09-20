import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  PageSection,
} from '@patternfly/react-core';
import ModalWithHelp from '../components/common/modal/ModalWithHelp'; // Importer ModalWithHelp
import { useConnexion } from '../hooks/useConnexion';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';

const LoginPage = ({ onSuccess }: { onSuccess?: (data: any) => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const connexion = useConnexion();

  // Fonction pour obtenir l'URL de base
  const getBasePath = () => {
    // En production, l'application peut être servie depuis un sous-chemin
    // Cette fonction détecte automatiquement la base
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1] === 'votre-app') {
      return `/${pathParts[1]}`;
    }
    return '';
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await connexion.mutateAsync(formData);
      console.log('Réponse de l\'API:', data);

      if (!data || !data.user) {
        throw new Error('Données utilisateur manquantes dans la réponse.');
      }

      const { user, token } = data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        nom_utilisateur: user.nom_utilisateur || '',
        email: user.email,
        status: user.status,
        genres: user.genres,
        grades: user.grades,
        abonnement: user.abonnement,
        date_of_birth: user.date_of_birth,
        token,
      }));

      dispatch(loginSuccess(user));

      if (onSuccess) {
        onSuccess(data);
      }

      setIsModalOpen(true);
      setModalData({
        Prénom: user.first_name,
        Nom: user.last_name,
        Email: user.email,
      });
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.message || 'Erreur lors de la tentative de connexion');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);

    // Utilisation de navigate avec un chemin relatif à la base
    // Cela fonctionne à la fois en dev et en prod
    navigate('/pages/dashboard', {
      replace: true,
      state: { from: location }
    });
  };

  return (
    <PageSection style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      {/* ... reste du JSX ... */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p>
          Pas encore inscrit ?{' '}
          <Link to="/pages/inscription" style={{
            color: '#007bff',
            textDecoration: 'none'
          }}>
            Créez un compte
          </Link>
        </p>
      </div>
      {/* ... reste du JSX ... */}

      <ModalWithHelp
        title="Connexion réussie"
        isOpen={isModalOpen}
        onClose={handleModalClose}
        variant="success"
        context="connexion"
        data={modalData}
        successMessage="Vous êtes maintenant connecté avec succès !"
        size="large"
        autoCloseDelay={3000}
      />
    </PageSection>
  );
};

export default LoginPage;
