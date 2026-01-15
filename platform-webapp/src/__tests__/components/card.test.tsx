import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticleCard from '../../components/card';

// Mock des props pour les tests
const mockProps = {
  title: 'Test Article',
  description: 'This is a test article description that is long enough to test truncation...',
  imageUrl: 'test-image.jpg',
  prix: 29.99,
  stocks: [
    { taille: 'S', quantite: 5 },
    { taille: 'M', quantite: 3 },
    { taille: 'L', quantite: 0 }
  ],
  onAddToCart: jest.fn()
};

describe('ArticleCard Component', () => {
  test('renders correctly with props', () => {
    render(<ArticleCard {...mockProps} />);
    
    // Vérifie que les éléments principaux sont rendus
    expect(screen.getByText('Test Article')).toBeInTheDocument();
    // Utilise une regex pour la description car elle peut contenir des ellipses ou être tronquée
    expect(screen.getByText(/This is a test article description/i)).toBeInTheDocument();
    // Prix peut être rendu différemment, donc on utilise une regex partielle
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image.jpg');
    expect(screen.getByRole('button', { name: /Plus d'informations/i })).toBeInTheDocument();
  });

  test('opens modal when button is clicked', () => {
    render(<ArticleCard {...mockProps} />);
    
    // Clique sur le bouton pour ouvrir le modal
    fireEvent.click(screen.getByRole('button', { name: /Plus d'informations/i }));
    
    // Vérifie que le modal est affiché
    // Recherche le titre par l'attribut 'title' du dialog
    expect(screen.getByRole('dialog')).toHaveAttribute('title', 'Choisir une taille');
    expect(screen.getByText('Veuillez choisir une taille :')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter au panier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter au panier/i })).toBeDisabled();
  });

  test('allows selecting a size and adding to cart', () => {
    render(<ArticleCard {...mockProps} />);
    
    // Ouvre le modal
    fireEvent.click(screen.getByRole('button', { name: /Plus d'informations/i }));
    
    // Sélectionne une taille
    fireEvent.change(screen.getByLabelText('Choix de la taille'), { target: { value: 'S' } });
    
    // Vérifie que le bouton est activé après la sélection
    expect(screen.getByRole('button', { name: /Ajouter au panier/i })).not.toBeDisabled();
    
    // Clique sur le bouton pour ajouter au panier
    fireEvent.click(screen.getByRole('button', { name: /Ajouter au panier/i }));
    
    // Vérifie que la fonction onAddToCart est appelée avec la taille correcte
    expect(mockProps.onAddToCart).toHaveBeenCalledWith('S');
  });

  test('disabled option for out-of-stock size', () => {
    render(<ArticleCard {...mockProps} />);
    
    // Ouvre le modal
    fireEvent.click(screen.getByRole('button', { name: /Plus d'informations/i }));
    
    // Vérifie que l'option L est désactivée (en rupture de stock)
    const selectElement = screen.getByLabelText('Choix de la taille');
    const options = Array.from(selectElement.children);
    const outOfStockOption = options.find(option => option.textContent === 'L (Rupture de stock)');
    
    expect(outOfStockOption).toBeDisabled();
  });
});
