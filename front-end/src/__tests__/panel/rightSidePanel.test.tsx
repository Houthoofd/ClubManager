import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RightSidePanel from '../../components/panel/rightSidePanel';

// Mock du composant PaymentForm
jest.mock('../../components/form/paymentForm', () => ({
  __esModule: true,
  default: ({ totalAmount, onClose }) => (
    <div data-testid="payment-form">
      <p>Total: {totalAmount} €</p>
      <button onClick={onClose}>Close Payment</button>
    </div>
  )
}));

describe('RightSidePanel Component', () => {
  const mockProps = {
    isExpanded: true,
    onClose: jest.fn(),
    articles: [
      {
        id: 1,
        nom: 'Article 1',
        description: 'Description de l\'article 1',
        prix: 25.99,
        taille: 'M',
        quantite: 2,
        stocks: [
          { taille: 'S', quantite: 5 },
          { taille: 'M', quantite: 3 },
          { taille: 'L', quantite: 0 }
        ]
      }
    ],
    onRemoveArticle: jest.fn(),
    onUpdateQuantite: jest.fn(),
    onUpdateTaille: jest.fn(),
    children: <div>Content</div>
  };

  test('renders correctly when expanded', () => {
    render(<RightSidePanel {...mockProps} />);
    
    // Vérifie que le panel et son contenu sont rendus
    expect(screen.getByText('Panier')).toBeInTheDocument();
    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Description de l\'article 1')).toBeInTheDocument();
    expect(screen.getByText('Prix : 25.99 €')).toBeInTheDocument();
    expect(screen.getByText('Taille : M')).toBeInTheDocument();
    expect(screen.getByText('Quantité : 2')).toBeInTheDocument();
    expect(screen.getByText('Prix Total: 51.98 €')).toBeInTheDocument();
  });

  test('does not render panel content when not expanded', () => {
    render(<RightSidePanel {...mockProps} isExpanded={false} />);
    
    // Le contenu principal est toujours rendu
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    // Mais pas le contenu du panel
    expect(screen.queryByText('Panier')).not.toBeInTheDocument();
  });

  test('renders empty cart message when no articles', () => {
    render(<RightSidePanel {...mockProps} articles={[]} />);
    
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });

  test('enters edit mode when "Modifier" is clicked', () => {
    render(<RightSidePanel {...mockProps} />);
    
    // Clique sur le bouton modifier
    fireEvent.click(screen.getByRole('button', { name: /Modifier/i }));
    
    // Vérifie que les contrôles d'édition sont affichés
    expect(screen.getByRole('button', { name: /Valider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
  });

  test('calls onRemoveArticle when "Supprimer" is clicked', () => {
    render(<RightSidePanel {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }));
    
    expect(mockProps.onRemoveArticle).toHaveBeenCalledWith(0);
  });

  test('opens payment modal when "Passer Commande" is clicked', () => {
    // Mock localStorage pour utilisateur connecté
    localStorage.getItem.mockImplementation(() => JSON.stringify({
      data: { id: 1 }
    }));
    
    render(<RightSidePanel {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Passer Commande/i }));
    
    // Vérifie que le modal de paiement est affiché
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    expect(screen.getByText('Total: 51.98 €')).toBeInTheDocument();
  });
});
