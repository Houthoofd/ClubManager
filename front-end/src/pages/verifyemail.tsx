import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ✅ URL API pour ClubManager
const getApiUrl = (endpoint: string) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:3000';
  return `${baseUrl}/api/${endpoint}`;
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const userId = searchParams.get('userId');

      console.log('🔍 [VerifyEmail] Paramètres reçus:', { token: token?.substring(0, 8) + '...', userId });

      if (!token || !userId) {
        setStatus('error');
        setMessage('Token ou ID utilisateur manquant dans le lien de vérification');
        return;
      }

      try {
        setMessage('Vérification de votre email en cours...');
        
        // ✅ Utiliser la route auth/confirm-email qui redirige
        const response = await fetch(getApiUrl(`auth/confirm-email?token=${token}&userId=${userId}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          redirect: 'manual' // Empêcher la redirection automatique
        });

        console.log('🔍 [VerifyEmail] Réponse API:', response.status, response.statusText);

        // Si c'est une redirection (302), c'est un succès
        if (response.status === 302 || response.type === 'opaqueredirect') {
          setStatus('success');
          setMessage('Votre email a été vérifié avec succès !');
          setDetails({ 
            userId, 
            email: 'Email vérifié',
            redirect: 'Redirection automatique activée'
          });
          
          // Démarrer le countdown
          let timeLeft = 5;
          const countdownInterval = setInterval(() => {
            timeLeft--;
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
              clearInterval(countdownInterval);
              navigate('/pages/connexion?verified=true', { replace: true });
            }
          }, 1000);
          
          return;
        }

        // Sinon, traiter comme une réponse JSON normale
        const data = await response.json();
        console.log('🔍 [VerifyEmail] Données reçues:', data);

        if (data.success || response.ok) {
          setStatus('success');
          setMessage(data.message || 'Votre email a été vérifié avec succès !');
          setDetails(data.data);
        } else {
          setStatus('error');
          setMessage(data.error || data.message || 'Erreur lors de la vérification');
        }
      } catch (error: any) {
        console.error('❌ [VerifyEmail] Erreur:', error);
        setStatus('error');
        setMessage('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    setStatus('loading');
    setMessage('Nouvelle tentative de vérification...');
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate('/pages/connexion?verified=true', { replace: true });
  };

  const handleGoToRegister = () => {
    navigate('/pages/inscription', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center p-4">
      {/* Animations de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-yellow-300/10 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-lg w-full space-y-8">
        {/* Header avec logo */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
            <span className="text-3xl animate-bounce">🥋</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            ClubManager
          </h1>
          <p className="text-xl text-indigo-200 font-medium">
            Vérification d'email
          </p>
        </div>
        
        {/* Carte principale */}
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20">
          {status === 'loading' && (
            <div className="text-center">
              <div className="relative mx-auto mb-6">
                {/* Spinner personnalisé */}
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Vérification en cours...
              </h3>
              <p className="text-gray-600 font-medium mb-4">{message}</p>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  ⏳ Validation de votre token de sécurité...
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              {/* Animation de succès */}
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                {/* Particules de célébration */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-3 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-300"></div>
                <div className="absolute -bottom-2 left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-700"></div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                🎉 Email vérifié avec succès !
              </h3>
              <p className="text-gray-600 mb-6 text-lg">{message}</p>
              
              {details && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6 shadow-inner">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center justify-center">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-2">✓</span>
                    Compte vérifié
                  </h4>
                  <div className="space-y-2 text-sm text-green-700">
                    {details.prenom && details.nom && (
                      <p><strong>👤 Nom :</strong> {details.prenom} {details.nom}</p>
                    )}
                    {details.email && (
                      <p><strong>📧 Email :</strong> {details.email}</p>
                    )}
                    {details.userId && (
                      <p><strong>🆔 ID utilisateur :</strong> {details.userId}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Countdown et boutons */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 mb-2">
                    🚀 Redirection automatique dans :
                  </p>
                  <div className="text-2xl font-bold text-blue-600">
                    {countdown}s
                  </div>
                </div>
                
                <button 
                  onClick={handleGoToLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  🚀 Se connecter maintenant
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              {/* Animation d'erreur */}
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                ⚠️ Erreur de vérification
              </h3>
              <p className="text-gray-600 mb-6 text-lg">{message}</p>
              
              {/* Conseils d'aide */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-inner">
                <h4 className="font-bold text-amber-800 mb-3">💡 Que faire ?</h4>
                <ul className="text-sm text-amber-700 space-y-2 text-left">
                  <li>• Vérifiez que le lien n'est pas expiré (24h max)</li>
                  <li>• Assurez-vous d'avoir cliqué sur le bon lien</li>
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Contactez l'administration si le problème persiste</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  🔄 Réessayer la vérification
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGoToLogin}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-gray-200"
                  >
                    🔑 Connexion
                  </button>
                  <button 
                    onClick={handleGoToRegister}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all duration-200 font-medium border border-gray-200"
                  >
                    📝 Inscription
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-indigo-200">
            © 2024 ClubManager - Gestion de club sportif
          </p>
          <p className="text-xs text-indigo-300">
            🔒 Connexion sécurisée • 🥋 Arts martiaux
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-yellow-300 bg-yellow-900/20 px-3 py-1 rounded-full inline-block">
              🛠️ Mode développement
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
