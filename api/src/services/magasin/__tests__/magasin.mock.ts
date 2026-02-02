/**
 * Mocks locaux pour les tests du service Magasin
 */

import { jest } from '@jest/globals';
import type {
  Article,
  MagasinCategorie as Categorie,
  Stock
} from '@clubmanager/types';

// Types internes pour simuler les données Prisma
interface MockArticle {
  id: number;
  nom: string;
  description: string;
  prix: number;
  categorie_id: number;
  images: { id: number; url: string; article_id: number }[];
  stocks: { id: number; quantite: number; article_id: number; taille_id: number; tailles: { id: number; nom: string } }[];
  categories: { id: number; nom: string };
}

interface MockCommande {
  id: number;
  utilisateur_id: number;
  statut: string;
  date: Date;
  total: number;
  utilisateurs: { id: number; nom: string; email: string };
  commandes_articles: {
    id: number;
    commande_id: number;
    article_id: number;
    taille_id: number | null;
    quantite: number;
    prix: number;
    articles: { id: number; nom: string };
    tailles: { id: number; nom: string } | null;
  }[];
}

interface MockCategorie {
  id: number;
  nom: string;
  _count?: { articles: number };
  articles?: MockArticle[];
}

interface MockStock {
  id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
  articles: { id: number; nom: string; prix: number };
  tailles: { id: number; nom: string };
}

interface MockTaille {
  id: number;
  nom: string;
}

// Données de test
const mockTailles: MockTaille[] = [
  { id: 1, nom: 'S' },
  { id: 2, nom: 'M' },
  { id: 3, nom: 'L' },
  { id: 4, nom: 'XL' },
];

const mockCategories: MockCategorie[] = [
  { id: 1, nom: 'T-shirts' },
  { id: 2, nom: 'Pantalons' },
  { id: 3, nom: 'Vestes' },
];

const mockArticles: MockArticle[] = [
  {
    id: 1,
    nom: 'T-shirt Basic',
    description: 'T-shirt basique en coton',
    prix: 25.99,
    categorie_id: 1,
    images: [
      { id: 1, url: 'https://example.com/tshirt1.jpg', article_id: 1 },
      { id: 2, url: 'https://example.com/tshirt1-back.jpg', article_id: 1 },
    ],
    stocks: [
      { id: 1, quantite: 10, article_id: 1, taille_id: 1, tailles: { id: 1, nom: 'S' } },
      { id: 2, quantite: 15, article_id: 1, taille_id: 2, tailles: { id: 2, nom: 'M' } },
      { id: 3, quantite: 5, article_id: 1, taille_id: 3, tailles: { id: 3, nom: 'L' } },
    ],
    categories: { id: 1, nom: 'T-shirts' },
  },
  {
    id: 2,
    nom: 'Jean Slim',
    description: 'Jean slim fit',
    prix: 89.99,
    categorie_id: 2,
    images: [
      { id: 3, url: 'https://example.com/jean1.jpg', article_id: 2 },
    ],
    stocks: [
      { id: 4, quantite: 8, article_id: 2, taille_id: 2, tailles: { id: 2, nom: 'M' } },
      { id: 5, quantite: 12, article_id: 2, taille_id: 3, tailles: { id: 3, nom: 'L' } },
    ],
    categories: { id: 2, nom: 'Pantalons' },
  },
];

const mockUtilisateurs = [
  { id: 1, nom: 'Jean Dupont', email: 'jean@example.com' },
  { id: 2, nom: 'Marie Martin', email: 'marie@example.com' },
];

const mockCommandes: MockCommande[] = [
  {
    id: 1,
    utilisateur_id: 1,
    statut: 'confirmee',
    date: new Date('2024-01-15'),
    total: 115.98,
    utilisateurs: mockUtilisateurs[0],
    commandes_articles: [
      {
        id: 1,
        commande_id: 1,
        article_id: 1,
        taille_id: 2,
        quantite: 2,
        prix: 25.99,
        articles: { id: 1, nom: 'T-shirt Basic' },
        tailles: { id: 2, nom: 'M' },
      },
      {
        id: 2,
        commande_id: 1,
        article_id: 2,
        taille_id: 3,
        quantite: 1,
        prix: 89.99,
        articles: { id: 2, nom: 'Jean Slim' },
        tailles: { id: 3, nom: 'L' },
      },
    ],
  },
];

const mockStocks: MockStock[] = [
  {
    id: 1,
    article_id: 1,
    taille_id: 1,
    quantite: 10,
    articles: { id: 1, nom: 'T-shirt Basic', prix: 25.99 },
    tailles: { id: 1, nom: 'S' },
  },
  {
    id: 2,
    article_id: 1,
    taille_id: 2,
    quantite: 15,
    articles: { id: 1, nom: 'T-shirt Basic', prix: 25.99 },
    tailles: { id: 2, nom: 'M' },
  },
];

/**
 * Crée un client Prisma mocké pour les tests
 */
export function createMockPrisma(): any {
  const mockPrisma = {
    articles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    commandes: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    commandes_articles: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categories: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stocks: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    tailles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    images: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    utilisateurs: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  // Configuration des mocks par défaut

  // Articles
  mockPrisma.articles.findMany.mockResolvedValue(mockArticles);
  mockPrisma.articles.findUnique.mockImplementation(({ where }: any) => {
    const article = mockArticles.find(a => a.id === where.id);
    return Promise.resolve(article || null);
  });
  mockPrisma.articles.create.mockImplementation(({ data }: any) => {
    const newArticle = {
      ...data,
      id: mockArticles.length + 1,
      images: [],
      stocks: [],
      categories: mockCategories.find(c => c.id === data.categorie_id)!,
    };
    mockArticles.push(newArticle);
    return Promise.resolve(newArticle);
  });
  mockPrisma.articles.count.mockResolvedValue(mockArticles.length);

  // Catégories
  mockPrisma.categories.findMany.mockResolvedValue(mockCategories);
  mockPrisma.categories.findUnique.mockImplementation(({ where }: any) => {
    const categorie = mockCategories.find(c => c.id === where.id);
    return Promise.resolve(categorie || null);
  });
  mockPrisma.categories.findFirst.mockImplementation(({ where }: any) => {
    let categorie;
    if (where.nom?.equals) {
      categorie = mockCategories.find(c => c.nom.toLowerCase() === where.nom.equals.toLowerCase());
    }
    return Promise.resolve(categorie || null);
  });
  mockPrisma.categories.create.mockImplementation(({ data }: any) => {
    const newCategorie = {
      ...data,
      id: mockCategories.length + 1,
    };
    mockCategories.push(newCategorie);
    return Promise.resolve(newCategorie);
  });
  mockPrisma.categories.update.mockImplementation(({ where, data }: any) => {
    const categorie = mockCategories.find(c => c.id === where.id);
    if (categorie) {
      Object.assign(categorie, data);
    }
    return Promise.resolve(categorie);
  });

  // Commandes
  mockPrisma.commandes.findMany.mockResolvedValue(mockCommandes);
  mockPrisma.commandes.findUnique.mockImplementation(({ where }: any) => {
    const commande = mockCommandes.find(c => c.id === where.id);
    return Promise.resolve(commande || null);
  });
  mockPrisma.commandes.create.mockImplementation(({ data }: any) => {
    const newCommande = {
      ...data,
      id: mockCommandes.length + 1,
      date: new Date(data.date || new Date()),
      utilisateurs: mockUtilisateurs.find(u => u.id === data.utilisateur_id)!,
      commandes_articles: [],
    };
    mockCommandes.push(newCommande);
    return Promise.resolve(newCommande);
  });
  mockPrisma.commandes.update.mockImplementation(({ where, data }: any) => {
    const commande = mockCommandes.find(c => c.id === where.id);
    if (commande) {
      Object.assign(commande, data);
    }
    return Promise.resolve(commande);
  });

  // Commandes Articles
  mockPrisma.commandes_articles.create.mockImplementation(({ data }: any) => {
    const article = mockArticles.find(a => a.id === data.article_id);
    const taille = data.taille_id ? mockTailles.find(t => t.id === data.taille_id) : null;
    
    const nouvelArticleCommande = {
      ...data,
      id: Date.now(), // ID unique
      articles: { id: article!.id, nom: article!.nom },
      tailles: taille,
    };
    
    const commande = mockCommandes.find(c => c.id === data.commande_id);
    if (commande) {
      commande.commandes_articles.push(nouvelArticleCommande);
    }
    
    return Promise.resolve(nouvelArticleCommande);
  });

  // Stocks
  mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
  mockPrisma.stocks.findFirst.mockImplementation(({ where }: any) => {
    const stock = mockStocks.find(s => 
      s.article_id === where.article_id && 
      s.taille_id === where.taille_id
    );
    return Promise.resolve(stock || null);
  });
  mockPrisma.stocks.create.mockImplementation(({ data }: any) => {
    const article = mockArticles.find(a => a.id === data.article_id);
    const taille = mockTailles.find(t => t.id === data.taille_id);
    
    const newStock = {
      ...data,
      id: mockStocks.length + 1,
      articles: { id: article!.id, nom: article!.nom, prix: article!.prix },
      tailles: { id: taille!.id, nom: taille!.nom },
    };
    mockStocks.push(newStock);
    return Promise.resolve(newStock);
  });
  mockPrisma.stocks.update.mockImplementation(({ where, data }: any) => {
    const stock = mockStocks.find(s => s.id === where.id);
    if (stock) {
      Object.assign(stock, data);
    }
    return Promise.resolve(stock);
  });
  mockPrisma.stocks.updateMany.mockResolvedValue({ count: 1 });

  // Tailles
  mockPrisma.tailles.findMany.mockImplementation(({ where }: any) => {
    if (where?.nom?.in) {
      return Promise.resolve(mockTailles.filter(t => where.nom.in.includes(t.nom)));
    }
    return Promise.resolve(mockTailles);
  });
  mockPrisma.tailles.findUnique.mockImplementation(({ where }: any) => {
    const taille = mockTailles.find(t => t.id === where.id);
    return Promise.resolve(taille || null);
  });

  // Images
  mockPrisma.images.createMany.mockResolvedValue({ count: 1 });

  // Utilisateurs
  mockPrisma.utilisateurs.findUnique.mockImplementation(({ where }: any) => {
    const utilisateur = mockUtilisateurs.find(u => u.id === where.id);
    return Promise.resolve(utilisateur || null);
  });

  // Transactions
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return await callback(mockPrisma);
    }
    return Promise.resolve();
  });

  // Fonction de reset pour les tests
  mockPrisma._reset = () => {
    // Reset tous les mocks
    jest.clearAllMocks();
    
    // Reconfigurer les mocks par défaut
    mockPrisma.articles.findMany.mockResolvedValue(mockArticles);
    mockPrisma.categories.findMany.mockResolvedValue(mockCategories);
    mockPrisma.commandes.findMany.mockResolvedValue(mockCommandes);
    mockPrisma.stocks.findMany.mockResolvedValue(mockStocks);
    mockPrisma.tailles.findMany.mockResolvedValue(mockTailles);
  };

  return mockPrisma;
}

/**
 * Reset les données de test à leur état initial
 */
export function resetMockData() {
  // Reset articles
  mockArticles.length = 0;
  mockArticles.push(
    {
      id: 1,
      nom: 'T-shirt Basic',
      description: 'T-shirt basique en coton',
      prix: 25.99,
      categorie_id: 1,
      images: [
        { id: 1, url: 'https://example.com/tshirt1.jpg', article_id: 1 },
      ],
      stocks: [
        { id: 1, quantite: 10, article_id: 1, taille_id: 1, tailles: { id: 1, nom: 'S' } },
        { id: 2, quantite: 15, article_id: 1, taille_id: 2, tailles: { id: 2, nom: 'M' } },
      ],
      categories: { id: 1, nom: 'T-shirts' },
    },
    {
      id: 2,
      nom: 'Jean Slim',
      description: 'Jean slim fit',
      prix: 89.99,
      categorie_id: 2,
      images: [],
      stocks: [
        { id: 3, quantite: 8, article_id: 2, taille_id: 2, tailles: { id: 2, nom: 'M' } },
      ],
      categories: { id: 2, nom: 'Pantalons' },
    }
  );

  // Reset catégories
  mockCategories.length = 0;
  mockCategories.push(
    { id: 1, nom: 'T-shirts' },
    { id: 2, nom: 'Pantalons' },
    { id: 3, nom: 'Vestes' }
  );

  // Reset commandes
  mockCommandes.length = 0;
  mockCommandes.push({
    id: 1,
    utilisateur_id: 1,
    statut: 'confirmee',
    date: new Date('2024-01-15'),
    total: 115.98,
    utilisateurs: mockUtilisateurs[0],
    commandes_articles: [
      {
        id: 1,
        commande_id: 1,
        article_id: 1,
        taille_id: 2,
        quantite: 2,
        prix: 25.99,
        articles: { id: 1, nom: 'T-shirt Basic' },
        tailles: { id: 2, nom: 'M' },
      },
    ],
  });

  // Reset stocks
  mockStocks.length = 0;
  mockStocks.push(
    {
      id: 1,
      article_id: 1,
      taille_id: 1,
      quantite: 10,
      articles: { id: 1, nom: 'T-shirt Basic', prix: 25.99 },
      tailles: { id: 1, nom: 'S' },
    },
    {
      id: 2,
      article_id: 1,
      taille_id: 2,
      quantite: 15,
      articles: { id: 1, nom: 'T-shirt Basic', prix: 25.99 },
      tailles: { id: 2, nom: 'M' },
    }
  );
}

/**
 * Utilitaires pour les tests
 */
export const mockHelpers = {
  createMockArticle: (overrides: Partial<MockArticle> = {}): MockArticle => ({
    id: 999,
    nom: 'Article Test',
    description: 'Description test',
    prix: 29.99,
    categorie_id: 1,
    images: [],
    stocks: [],
    categories: { id: 1, nom: 'Test Category' },
    ...overrides,
  }),

  createMockCommande: (overrides: Partial<MockCommande> = {}): MockCommande => ({
    id: 999,
    utilisateur_id: 1,
    statut: 'en_attente',
    date: new Date(),
    total: 100.00,
    utilisateurs: mockUtilisateurs[0],
    commandes_articles: [],
    ...overrides,
  }),

  createMockStock: (overrides: Partial<MockStock> = {}): MockStock => ({
    id: 999,
    article_id: 1,
    taille_id: 1,
    quantite: 10,
    articles: { id: 1, nom: 'Test Article', prix: 25.99 },
    tailles: { id: 1, nom: 'S' },
    ...overrides,
  }),
};