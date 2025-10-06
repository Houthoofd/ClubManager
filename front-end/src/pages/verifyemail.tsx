import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiUrl } from './apiUrl';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('userId');

      if (!token || !userId) {
        setStatus('error');
        setMessage('Token ou ID utilisateur manquant');
        return;
      }

      try {
        const response = await fetch(apiUrl(`auth/confirm-email?userId=${userId}&token=${token}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion au serveur');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Vérification d'email
          </h2>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Email vérifié !</h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <Link 
                to="/login" 
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Se connecter
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                {message === 'Email déjà confirmé' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {message === 'Email déjà confirmé' ? 'Email déjà vérifié' : 'Erreur de vérification'}
              </h3>
              <p className="mt-2 text-gray-600">
                {message === 'Email déjà confirmé' 
                  ? 'Votre email a déjà été confirmé. Vous pouvez vous connecter.' 
                  : message
                }
              </p>
              <Link 
                to={message === 'Email déjà confirmé' ? '/pages/connexion' : '/pages/inscription'} 
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {message === 'Email déjà confirmé' ? 'Se connecter' : 'Retour à l\'inscription'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
