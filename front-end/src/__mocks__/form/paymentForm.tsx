import React from 'react';

// Composant PaymentForm factice pour les tests
const PaymentForm = ({ onSubmit, formData, handleChange }) => (
  <form data-testid="payment-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
    <div>
      <label htmlFor="cardholderName">Nom du titulaire</label>
      <input
        id="cardholderName"
        name="cardholderName"
        value={formData?.cardholderName || ''}
        onChange={handleChange}
        placeholder="Nom du titulaire de la carte"
        required
      />
    </div>
    <div data-testid="card-element">
      {/* Élément de carte simulé */}
    </div>
    <button type="submit">Payer</button>
  </form>
);

export default PaymentForm;
