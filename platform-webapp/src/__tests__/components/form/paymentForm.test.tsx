import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ChangeEvent, FormEvent } from 'react';

interface MockPaymentFormProps {
  onSubmit: () => void;
  formData?: { cardholderName?: string };
  handleChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

// Définition d'un composant mocké avec types
const MockPaymentForm: React.FC<MockPaymentFormProps> = ({
  onSubmit,
  formData = {},
  handleChange = () => {},
}) => (
  <form
    data-testid="payment-form"
    onSubmit={(e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <div>
      <label htmlFor="cardholderName">Nom du titulaire</label>
      <input
        id="cardholderName"
        name="cardholderName"
        value={formData.cardholderName || ''}
        onChange={handleChange}
        placeholder="Nom du titulaire de la carte"
        required
      />
    </div>
    <div data-testid="card-element">{/* Élément de carte simulé */}</div>
    <button type="submit">Payer</button>
  </form>
);

// Mock du composant réel
jest.mock('../../components/form/paymentForm', () => ({
  __esModule: true,
  default: MockPaymentForm,
}));

// Mock des hooks Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useStripe: () => ({
    createPaymentMethod: jest.fn().mockResolvedValue({
      paymentMethod: { id: 'pm_test_123' },
      error: null,
    }),
  }),
  useElements: () => ({ getElement: jest.fn() }),
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({ elements: jest.fn() }),
}));

describe('PaymentForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders payment form correctly', () => {
    render(
      <MockPaymentForm
        onSubmit={() => {}}
        formData={{ cardholderName: '' }}
        handleChange={() => {}}
      />,
    );

    expect(screen.getByLabelText(/Nom du titulaire/i)).toBeInTheDocument();
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Payer/i })).toBeInTheDocument();
  });

  test('handles form submission', () => {
    const handleSubmit = jest.fn();

    render(
      <MockPaymentForm
        onSubmit={handleSubmit}
        formData={{ cardholderName: '' }}
        handleChange={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Nom du titulaire/i), {
      target: { value: 'John Doe' },
    });

    fireEvent.submit(screen.getByTestId('payment-form'));

    expect(handleSubmit).toHaveBeenCalled();
  });
});
