/**
 * ProductCard Stories
 *
 * Storybook stories for the ProductCard component
 * Demonstrates various product states and configurations
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof ProductCard> = {
  title: 'Features/Shop/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    id: { control: 'text' },
    name: { control: 'text' },
    description: { control: 'text' },
    price: { control: 'number' },
    category: { control: 'text' },
    image: { control: 'text' },
    stock: { control: 'number' },
    available: { control: 'boolean' },
    featured: { control: 'boolean' },
    discount: { control: 'number' },
    onClick: { action: 'clicked' },
    onAddToCart: { action: 'add-to-cart' },
    onQuickView: { action: 'quick-view' },
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default ProductCard
 * Basic product card with standard information
 */
export const Default: Story = {
  args: {
    id: '1',
    name: 'T-Shirt Club',
    description: 'T-shirt officiel du club avec logo brodé',
    price: 25.99,
    category: 'Vêtements',
    image: 'https://via.placeholder.com/300x300?text=T-Shirt',
    stock: 50,
    available: true,
  },
};

/**
 * Featured Product
 * Highlighted product with special badge
 */
export const Featured: Story = {
  args: {
    id: '2',
    name: 'Sac de Sport Premium',
    description: 'Sac de sport grande capacité avec compartiments multiples',
    price: 79.99,
    category: 'Accessoires',
    image: 'https://via.placeholder.com/300x300?text=Sac+Sport',
    stock: 25,
    available: true,
    featured: true,
  },
};

/**
 * Product with Discount
 * Product showing original and discounted price
 */
export const WithDiscount: Story = {
  args: {
    id: '3',
    name: 'Gourde Isotherme',
    description: 'Gourde isotherme 750ml en acier inoxydable',
    price: 29.99,
    category: 'Accessoires',
    image: 'https://via.placeholder.com/300x300?text=Gourde',
    stock: 100,
    available: true,
    discount: 20, // 20% off
  },
};

/**
 * Low Stock Product
 * Product with limited availability warning
 */
export const LowStock: Story = {
  args: {
    id: '4',
    name: 'Short de Sport',
    description: 'Short léger et respirant pour le sport',
    price: 34.99,
    category: 'Vêtements',
    image: 'https://via.placeholder.com/300x300?text=Short',
    stock: 3,
    available: true,
  },
};

/**
 * Out of Stock Product
 * Product currently unavailable
 */
export const OutOfStock: Story = {
  args: {
    id: '5',
    name: 'Sweat à Capuche',
    description: 'Sweat confortable avec capuche et poche kangourou',
    price: 49.99,
    category: 'Vêtements',
    image: 'https://via.placeholder.com/300x300?text=Sweat',
    stock: 0,
    available: false,
  },
};

/**
 * Premium Product
 * High-end product with higher price point
 */
export const Premium: Story = {
  args: {
    id: '6',
    name: 'Veste Technique Pro',
    description: 'Veste technique imperméable et respirante pour professionnels',
    price: 149.99,
    category: 'Vêtements',
    image: 'https://via.placeholder.com/300x300?text=Veste+Pro',
    stock: 15,
    available: true,
    featured: true,
  },
};

/**
 * Budget Product
 * Affordable entry-level product
 */
export const Budget: Story = {
  args: {
    id: '7',
    name: 'Serviette Microfibre',
    description: 'Serviette en microfibre légère et absorbante',
    price: 12.99,
    category: 'Accessoires',
    image: 'https://via.placeholder.com/300x300?text=Serviette',
    stock: 200,
    available: true,
  },
};

/**
 * Product with Long Name
 * Test truncation and layout with long product name
 */
export const LongName: Story = {
  args: {
    id: '8',
    name: 'Ensemble Complet de Vêtements de Sport Professionnel avec Technologies Avancées',
    description: 'Description du produit avec toutes les caractéristiques détaillées et avantages',
    price: 199.99,
    category: 'Ensembles',
    image: 'https://via.placeholder.com/300x300?text=Ensemble',
    stock: 10,
    available: true,
  },
};

/**
 * Product with Long Description
 * Test description truncation
 */
export const LongDescription: Story = {
  args: {
    id: '9',
    name: 'Chaussures de Course',
    description: 'Chaussures de course haute performance avec amorti avancé, semelle en mousse réactive, tige respirante en mesh technique, support de la voûte plantaire, système de laçage rapide, design ergonomique pour coureurs de tous niveaux',
    price: 129.99,
    category: 'Chaussures',
    image: 'https://via.placeholder.com/300x300?text=Chaussures',
    stock: 35,
    available: true,
  },
};

/**
 * Product with Actions
 * Product card with add to cart and quick view actions
 */
export const WithActions: Story = {
  args: {
    id: '10',
    name: 'Casquette Club',
    description: 'Casquette ajustable avec logo brodé',
    price: 19.99,
    category: 'Accessoires',
    image: 'https://via.placeholder.com/300x300?text=Casquette',
    stock: 75,
    available: true,
    onAddToCart: (product) => console.log('Add to cart:', product),
    onQuickView: (product) => console.log('Quick view:', product),
  },
};

/**
 * Featured Product with Discount
 * Combination of featured status and discount
 */
export const FeaturedWithDiscount: Story = {
  args: {
    id: '11',
    name: 'Kit Complet Débutant',
    description: 'Kit complet pour débutants incluant tous les essentiels',
    price: 89.99,
    category: 'Kits',
    image: 'https://via.placeholder.com/300x300?text=Kit+Debutant',
    stock: 20,
    available: true,
    featured: true,
    discount: 15,
  },
};

/**
 * Multiple Categories
 * Product that belongs to multiple categories
 */
export const MultiCategory: Story = {
  args: {
    id: '12',
    name: 'Leggings Sport Femme',
    description: 'Leggings techniques pour femme, taille haute, anti-transpiration',
    price: 44.99,
    category: 'Vêtements / Femme',
    image: 'https://via.placeholder.com/300x300?text=Leggings',
    stock: 60,
    available: true,
  },
};

/**
 * Free Product
 * Product with price 0 (free item or gift)
 */
export const FreeProduct: Story = {
  args: {
    id: '13',
    name: 'Sticker Logo Club',
    description: 'Autocollant logo du club - Offert avec tout achat',
    price: 0,
    category: 'Goodies',
    image: 'https://via.placeholder.com/300x300?text=Sticker',
    stock: 500,
    available: true,
  },
};

/**
 * Pre-order Product
 * Product available for pre-order
 */
export const PreOrder: Story = {
  args: {
    id: '14',
    name: 'Maillot Saison 2025',
    description: 'Nouveau maillot de la saison 2025 - Disponible en pré-commande',
    price: 69.99,
    category: 'Vêtements',
    image: 'https://via.placeholder.com/300x300?text=Maillot+2025',
    stock: 0,
    available: true, // Pre-order available even with 0 stock
    featured: true,
  },
};

/**
 * Interactive Playground
 * Playground to test all combinations
 */
export const Playground: Story = {
  args: {
    id: '999',
    name: 'Produit Test',
    description: 'Description du produit test',
    price: 49.99,
    category: 'Catégorie',
    image: 'https://via.placeholder.com/300x300?text=Produit',
    stock: 50,
    available: true,
    featured: false,
    discount: 0,
  },
};
