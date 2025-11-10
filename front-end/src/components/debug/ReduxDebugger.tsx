import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { debugPanier } from '../../redux/slices/panierSlice';

const ReduxDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch();
  
  // Récupérer tous les états Redux
  const auth = useSelector((state: RootState) => state.auth);
  const panier = useSelector((state: RootState) => state.panier);
  
  const handleDebugPanier = () => {
    dispatch(debugPanier());
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Ne pas afficher en production
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        🔍 Redux Debug {isVisible ? '🔽' : '🔼'}
      </button>
      
      {isVisible && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>🛒 Panier Redux</h4>
            <div><strong>Ouvert:</strong> {panier.isOpen ? '✅' : '❌'}</div>
            <div><strong>Nombre d'articles:</strong> {panier.articles.length}</div>
            <div><strong>Total:</strong> {panier.articles.reduce((total, article) => 
              total + (article.prix * (article.quantite || 1)), 0
            ).toFixed(2)} €</div>
            
            <button
              onClick={handleDebugPanier}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '5px'
              }}
            >
              Debug Panier dans Console
            </button>
            
            <div style={{ marginTop: '10px', maxHeight: '200px', overflow: 'auto' }}>
              <strong>Articles:</strong>
              {panier.articles.length === 0 ? (
                <div style={{ color: '#ffc107' }}>Panier vide</div>
              ) : (
                panier.articles.map((article, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    margin: '5px 0',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    <div><strong>[{index}]</strong> {article.nom}</div>
                    <div>ID: {article.id} | Prix: {article.prix}€</div>
                    <div>Taille: {article.taille || '❌'} | Qté: {article.quantite || '❌'}</div>
                    <div>Images: {article.images?.length || 0} | Stocks: {article.stocks?.length || 0}</div>
                    {article.stocks && article.stocks.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#ccc' }}>
                        Stocks: {article.stocks.map(s => `${s.taille}(${s.quantite})`).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>👤 Auth Redux</h4>
            <div><strong>Connecté:</strong> {auth.isAuthenticated ? '✅' : '❌'}</div>
            <div><strong>Utilisateur:</strong> {auth.user?.nom_utilisateur || auth.user?.first_name || 'Non connecté'}</div>
            <div><strong>ID:</strong> {auth.user?.id || 'N/A'}</div>
            <div><strong>Rôle:</strong> {auth.user?.role || 'N/A'}</div>
            <div><strong>Token présent:</strong> {auth.token ? '✅' : '❌'}</div>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffd700' }}>💾 LocalStorage</h4>
            <div><strong>userData:</strong> {localStorage.getItem('userData') ? '✅' : '❌'}</div>
            <div><strong>token:</strong> {localStorage.getItem('token') ? '✅' : '❌'}</div>
            <div><strong>authToken:</strong> {localStorage.getItem('authToken') ? '✅' : '❌'}</div>
            
            <button
              onClick={() => {
                console.log('💾 [Debug] LocalStorage userData:', JSON.parse(localStorage.getItem('userData') || '{}'));
                console.log('💾 [Debug] LocalStorage token:', localStorage.getItem('token'));
                console.log('💾 [Debug] LocalStorage authToken:', localStorage.getItem('authToken'));
              }}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                marginTop: '5px'
              }}
            >
              Debug LocalStorage dans Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReduxDebugger;
