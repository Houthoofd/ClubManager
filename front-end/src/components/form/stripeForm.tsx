import React, { useState } from 'react';
import { Form, FormGroup, TextInput, Button, Title } from '@patternfly/react-core';

const StripeForm = ({ onSubmit }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici, vous pouvez ajouter la logique pour envoyer les données à Stripe
    onSubmit({ cardNumber, expiryDate, cvv, cardHolderName });
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <Title headingLevel="h2" style={{ marginBottom: '20px' }}>
        Paiement par Carte de Crédit
      </Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup label="Numéro de Carte" isRequired fieldId="card-number">
          <TextInput
            isRequired
            type="text"
            id="card-number"
            name="card-number"
            value={cardNumber}
            onChange={(value) => setCardNumber(value)}
            placeholder="1234 5678 9012 3456"
          />
        </FormGroup>
        <FormGroup label="Date d'Expiration" isRequired fieldId="expiry-date">
          <TextInput
            isRequired
            type="text"
            id="expiry-date"
            name="expiry-date"
            value={expiryDate}
            onChange={(value) => setExpiryDate(value)}
            placeholder="MM/AA"
          />
        </FormGroup>
        <FormGroup label="CVV" isRequired fieldId="cvv">
          <TextInput
            isRequired
            type="text"
            id="cvv"
            name="cvv"
            value={cvv}
            onChange={(value) => setCvv(value)}
            placeholder="123"
          />
        </FormGroup>
        <FormGroup label="Nom du Titulaire de la Carte" isRequired fieldId="card-holder-name">
          <TextInput
            isRequired
            type="text"
            id="card-holder-name"
            name="card-holder-name"
            value={cardHolderName}
            onChange={(value) => setCardHolderName(value)}
            placeholder="Nom comme sur la carte"
          />
        </FormGroup>
        <Button variant="primary" type="submit">
          Payer
        </Button>
      </Form>
    </div>
  );
};

export default StripeForm;
