import React, { useState, useEffect } from 'react';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

const EmailSandbox: React.FC = () => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: 'Test Email - Club Manager',
    message: '<h1>Test Email</h1><p>Ceci est un test du système d\'email.</p>'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/health/email');
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      }
    } catch (error) {
      console.error('Erreur vérification config email:', error);
    }
  };

  const sendTestEmail = async () => {
    if (!emailData.to) {
      setResult({ success: false, error: 'Email destinataire requis' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/messages/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          isHtml: true
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erreur lors de l\'envoi'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/test-config', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erreur test configuration'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#fff'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          🧪 Email Sandbox - Test des Templates
          {configStatus && (
            <span style={{
              marginLeft: '10px',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: configStatus.status === 'healthy' ? '#d4edda' : '#f8d7da',
              color: configStatus.status === 'healthy' ? '#155724' : '#721c24'
            }}>
              {configStatus.status === 'healthy' ? 'Config OK' : 'Config KO'}
            </span>
          )}
        </h2>

        {/* Configuration de base */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email destinataire *
          </label>
          <input
            type="email"
            placeholder="test@example.com"
            value={emailData.to}
            onChange={(e) => setEmailData({...emailData, to: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Sujet
          </label>
          <input
            type="text"
            value={emailData.subject}
            onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Message (HTML supporté)
          </label>
          <textarea
            rows={6}
            value={emailData.message}
            onChange={(e) => setEmailData({...emailData, message: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={sendTestEmail} 
            disabled={loading || !emailData.to}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Envoi...' : '📧 Envoyer Test Email'}
          </button>
          <button 
            onClick={testConfiguration}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            🔧 Test Config
          </button>
          <button 
            onClick={checkEmailConfig}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            🔄 Recharger
          </button>
        </div>

        {/* Résultats */}
        {result && (
          <div style={{
            padding: '15px',
            borderRadius: '4px',
            border: `2px solid ${result.success ? '#28a745' : '#dc3545'}`,
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '18px' }}>{result.success ? '✅' : '❌'}</span>
              <strong style={{ marginLeft: '10px' }}>
                {result.success ? 'Succès' : 'Erreur'}
              </strong>
            </div>
            
            {result.success && result.messageId && (
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>Message ID:</strong> {result.messageId}
              </div>
            )}
            
            {result.error && (
              <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '10px' }}>
                <strong>Erreur:</strong> {result.error}
              </div>
            )}
            
            {result.details && (
              <details style={{ fontSize: '12px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Détails techniques
                </summary>
                <pre style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '11px',
                  overflow: 'auto',
                  border: '1px solid #dee2e6'
                }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Status de configuration */}
        {configStatus && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Configuration Email</h4>
            <div style={{
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '14px',
              border: '1px solid #dee2e6'
            }}>
              <div><strong>Status:</strong> {configStatus.status}</div>
              {configStatus.email && (
                <>
                  <div><strong>Configuré:</strong> {configStatus.email.configured ? 'Oui' : 'Non'}</div>
                  {configStatus.email.error && (
                    <div style={{ color: '#dc3545' }}><strong>Erreur:</strong> {configStatus.email.error}</div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Instructions pour résoudre le problème */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <h4 style={{ color: '#856404', marginBottom: '10px' }}>
            🚨 Problème détecté : Sender Identity non vérifiée
          </h4>
          <div style={{ fontSize: '14px', color: '#856404' }}>
            <p><strong>Email expéditeur actuel :</strong> no-reply@clubmanagement.com</p>
            
            <p><strong>📋 ÉTAPES À SUIVRE :</strong></p>
            <ol style={{ marginLeft: '20px' }}>
              <li>🌐 Connectez-vous à votre dashboard SendGrid : <a href="https://app.sendgrid.com" target="_blank">https://app.sendgrid.com</a></li>
              <li>🔍 Allez dans "Settings" → "Sender Authentication"</li>
              <li>⚡ <strong>Option Rapide</strong> - Cliquez sur "Verify a Single Sender"</li>
              <li>✉️ Ajoutez l'email : <code>no-reply@clubmanagement.com</code></li>
              <li>📧 Confirmez dans votre boîte mail</li>
              <li>⏱️ Attendez la vérification (quelques minutes)</li>
              <li>🔄 Relancez ce test après vérification</li>
            </ol>
            
            <p><strong>💡 Alternative temporaire :</strong> Changez SENDGRID_FROM_EMAIL dans votre .env vers un email déjà vérifié (ex: clubmanagement043@gmail.com)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSandbox;
                      