import React from 'react';
import { Radio, Stack, Button, Title } from '@patternfly/react-core';
import { CreditCardIcon, PaypalIcon, BitcoinIcon } from '@patternfly/react-icons';

// Composant pour le formulaire Bancontact
const BancontactForm = () => (
  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
    <h3>Formulaire Bancontact</h3>
    <p>Formulaire spécifique pour Bancontact</p>
    {/* Ajoutez ici le contenu spécifique pour Bancontact */}
  </div>
);

// Composant pour le formulaire PayPal
const PayPalForm = () => (
  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
    <h3>Formulaire PayPal</h3>
    <p>Formulaire spécifique pour PayPal</p>
    {/* Ajoutez ici le contenu spécifique pour PayPal */}
  </div>
);

// Composant pour le formulaire Bitcoin
const BitcoinForm = () => (
  <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
    <h3>Formulaire Bitcoin</h3>
    <p>Formulaire spécifique pour Bitcoin</p>
    {/* Ajoutez ici le contenu spécifique pour Bitcoin */}
  </div>
);

const PaymentForm = () => {
  const [paymentMethod, setPaymentMethod] = React.useState('bancontact');

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: 'auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Title headingLevel="h2" style={{ marginBottom: '30px', textAlign: 'center', color: '#333' }}>
        Choisissez votre moyen de paiement
      </Title>

      <Stack hasGutter>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'bancontact'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('bancontact')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <CreditCardIcon style={{ marginRight: '15px', color: '#0066cc' }} />
                Bancontact
              </div>
            }
            id="bancontact"
          />
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'paypal'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('paypal')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <PaypalIcon style={{ marginRight: '15px', color: '#009cde' }} />
                PayPal
              </div>
            }
            id="paypal"
          />
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #d1d1d1',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease-in-out',
        }}>
          <Radio
            isChecked={paymentMethod === 'bitcoin'}
            name="paymentMethod"
            onChange={() => handlePaymentMethodChange('bitcoin')}
            label={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}>
                <BitcoinIcon style={{ marginRight: '15px', color: '#f7931a' }} />
                Bitcoin
              </div>
            }
            id="bitcoin"
          />
        </div>
      </Stack>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        {paymentMethod === 'bancontact' && <BancontactForm />}
        {paymentMethod === 'paypal' && <PayPalForm />}
        {paymentMethod === 'bitcoin' && <BitcoinForm />}

        <Button
          variant="primary"
          style={{
            padding: '12px 24px',
            backgroundColor: '#0066cc',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            marginTop: '20px'
          }}
          onClick={() => alert(`Paiement via ${paymentMethod} (à implémenter)`)}
        >
          Plus d'informations
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;
