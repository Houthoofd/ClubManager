/**
 * Product Factory
 *
 * Factory for generating mock product data for testing purposes.
 *
 * Usage:
 *   import { ProductFactory } from '@/__test-utils__/factories/product.factory';
 *
 *   const product = ProductFactory.create();
 *   const products = ProductFactory.createMany(5);
 *   const customProduct = ProductFactory.create({ name: 'Custom Product', price: 99.99 });
 */

export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sku?: string;
  tags?: string[];
  discount?: number;
}

/**
 * Product categories
 */
export const PRODUCT_CATEGORIES = [
  'Équipement',
  'Vêtements',
  'Accessoires',
  'Nutrition',
  'Électronique',
  'Autre',
] as const;

/**
 * Default product data
 */
const DEFAULT_PRODUCT: Product = {
  id: 1,
  name: 'Test Product',
  description: 'This is a test product description',
  price: 49.99,
  currency: 'EUR',
  category: 'Équipement',
  stock: 100,
  imageUrl: 'https://via.placeholder.com/300x300?text=Product',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sku: 'PROD-001',
  tags: ['test', 'sample'],
  discount: 0,
};

/**
 * Sample product names for variety
 */
const PRODUCT_NAMES = [
  'Ballon de Football',
  'Raquette de Tennis',
  'Tapis de Yoga',
  'Haltères 5kg',
  'Gants de Boxe',
  'Short de Sport',
  'Chaussures de Running',
  'Bouteille d\'Eau',
  'Sac de Sport',
  'Montre Connectée',
];

/**
 * Sample descriptions
 */
const PRODUCT_DESCRIPTIONS = [
  'Produit de haute qualité pour sportifs professionnels',
  'Équipement durable et confortable pour tous les niveaux',
  'Accessoire essentiel pour votre pratique sportive',
  'Matériel professionnel aux normes de compétition',
  'Produit innovant avec technologie avancée',
];

/**
 * Product Factory
 */
export class ProductFactory {
  private static idCounter = 1;

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    this.idCounter = 1;
  }

  /**
   * Create a single product with optional overrides
   */
  static create(overrides: Partial<Product> = {}): Product {
    const id = overrides.id ?? this.idCounter++;
    const randomIndex = Math.floor(Math.random() * PRODUCT_NAMES.length);
    const name = overrides.name ?? PRODUCT_NAMES[randomIndex];
    const description =
      overrides.description ??
      PRODUCT_DESCRIPTIONS[Math.floor(Math.random() * PRODUCT_DESCRIPTIONS.length)];

    return {
      ...DEFAULT_PRODUCT,
      id,
      name,
      description,
      sku: `PROD-${String(id).padStart(3, '0')}`,
      ...overrides,
    };
  }

  /**
   * Create multiple products
   */
  static createMany(count: number, overrides: Partial<Product> = {}): Product[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        id: overrides.id ?? this.idCounter + index,
      })
    );
  }

  /**
   * Create a product with specific category
   */
  static createWithCategory(
    category: typeof PRODUCT_CATEGORIES[number],
    overrides: Partial<Product> = {}
  ): Product {
    return this.create({
      category,
      ...overrides,
    });
  }

  /**
   * Create an out-of-stock product
   */
  static createOutOfStock(overrides: Partial<Product> = {}): Product {
    return this.create({
      stock: 0,
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a discounted product
   */
  static createWithDiscount(discountPercent: number = 20, overrides: Partial<Product> = {}): Product {
    const product = this.create(overrides);
    return {
      ...product,
      discount: discountPercent,
      price: product.price,
    };
  }

  /**
   * Create a premium/expensive product
   */
  static createPremium(overrides: Partial<Product> = {}): Product {
    return this.create({
      price: 299.99,
      category: 'Équipement',
      tags: ['premium', 'professionnel', 'haute-qualité'],
      ...overrides,
    });
  }

  /**
   * Create a budget/cheap product
   */
  static createBudget(overrides: Partial<Product> = {}): Product {
    return this.create({
      price: 9.99,
      tags: ['économique', 'débutant'],
      ...overrides,
    });
  }

  /**
   * Create a product with low stock warning
   */
  static createLowStock(overrides: Partial<Product> = {}): Product {
    return this.create({
      stock: 5,
      ...overrides,
    });
  }

  /**
   * Create an inactive product
   */
  static createInactive(overrides: Partial<Product> = {}): Product {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  /**
   * Create a product with all optional fields populated
   */
  static createFull(overrides: Partial<Product> = {}): Product {
    return this.create({
      imageUrl: 'https://via.placeholder.com/600x600?text=Full+Product',
      sku: `FULL-${String(this.idCounter).padStart(6, '0')}`,
      tags: ['featured', 'popular', 'new-arrival'],
      discount: 15,
      ...overrides,
    });
  }

  /**
   * Create a product with minimal fields (only required)
   */
  static createMinimal(overrides: Partial<Product> = {}): Product {
    const id = overrides.id ?? this.idCounter++;
    return {
      id,
      name: overrides.name ?? 'Minimal Product',
      description: overrides.description ?? 'Basic description',
      price: overrides.price ?? 19.99,
      currency: overrides.currency ?? 'EUR',
      category: overrides.category ?? 'Autre',
      stock: overrides.stock ?? 10,
      isActive: overrides.isActive ?? true,
      createdAt: overrides.createdAt ?? new Date().toISOString(),
      updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    };
  }

  /**
   * Create a batch of products with different categories
   */
  static createBatchWithCategories(): Product[] {
    return PRODUCT_CATEGORIES.map((category, index) =>
      this.create({
        id: this.idCounter + index,
        category,
        name: `${category} Product ${index + 1}`,
      })
    );
  }

  /**
   * Create products with various price ranges
   */
  static createPriceRange(): Product[] {
    const priceRanges = [9.99, 29.99, 49.99, 99.99, 199.99, 499.99];
    return priceRanges.map((price, index) =>
      this.create({
        id: this.idCounter + index,
        price,
        name: `Product €${price}`,
      })
    );
  }

  /**
   * Create a product for API response testing
   */
  static createApiResponse(overrides: Partial<Product> = {}): { data: Product } {
    return {
      data: this.create(overrides),
    };
  }

  /**
   * Create multiple products for API list response
   */
  static createApiListResponse(
    count: number = 10,
    overrides: Partial<Product> = {}
  ): { data: Product[]; total: number; page: number; pageSize: number } {
    const products = this.createMany(count, overrides);
    return {
      data: products,
      total: count,
      page: 1,
      pageSize: count,
    };
  }

  /**
   * Create a product with GraphQL response structure
   */
  static createGraphQLResponse(overrides: Partial<Product> = {}): {
    data: { product: Product };
  } {
    return {
      data: {
        product: this.create(overrides),
      },
    };
  }

  /**
   * Create multiple products with GraphQL response structure
   */
  static createGraphQLListResponse(count: number = 10, overrides: Partial<Product> = {}): {
    data: { products: Product[] };
  } {
    return {
      data: {
        products: this.createMany(count, overrides),
      },
    };
  }

  /**
   * Create a product with validation errors (for testing error states)
   */
  static createInvalid(): Partial<Product> {
    return {
      id: -1,
      name: '',
      description: '',
      price: -10,
      stock: -5,
      currency: 'INVALID',
      category: 'NonExistent' as any,
    };
  }

  /**
   * Create a realistic product dataset for testing
   */
  static createRealisticDataset(): Product[] {
    return [
      this.create({ name: 'Ballon de Football Pro', price: 29.99, category: 'Équipement', stock: 50 }),
      this.create({ name: 'Raquette de Tennis Wilson', price: 149.99, category: 'Équipement', stock: 20, discount: 10 }),
      this.create({ name: 'Tapis de Yoga Premium', price: 39.99, category: 'Accessoires', stock: 35 }),
      this.create({ name: 'Gants de Boxe 12oz', price: 89.99, category: 'Équipement', stock: 15 }),
      this.create({ name: 'Short de Running', price: 24.99, category: 'Vêtements', stock: 100 }),
      this.create({ name: 'Montre GPS Sport', price: 299.99, category: 'Électronique', stock: 8, tags: ['premium'] }),
      this.create({ name: 'Bouteille Isotherme 1L', price: 19.99, category: 'Accessoires', stock: 200 }),
      this.create({ name: 'Chaussures Running Nike', price: 129.99, category: 'Vêtements', stock: 0, isActive: false }),
      this.create({ name: 'Protéines Whey 1kg', price: 34.99, category: 'Nutrition', stock: 45, discount: 20 }),
      this.create({ name: 'Sac de Sport XL', price: 44.99, category: 'Accessoires', stock: 60 }),
    ];
  }
}

export default ProductFactory;
