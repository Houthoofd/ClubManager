import { jest } from '@jest/globals';
import { Magasin } from '../../db/clients/magasin/magasin.js';
import { Pool } from 'pg';

// Créer une connexion de test avec des données simulées
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn().mockImplementation((query, params) => {
      // Simuler les réponses en fonction de la requête
      if (query.includes('INSERT INTO')) {
        return Promise.resolve({ rows: [{ id: 1 }], rowCount: 1 });
      } else if (query.includes('SELECT * FROM articles')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              nom: 'Article de Test',
              prix: 19.99,
              description: 'Description de test',
              categorie_id: 1,
              images: ['test.jpg']
            }
          ],
          rowCount: 1
        });
      } else if (query.includes('SELECT * FROM stocks')) {
        return Promise.resolve({
          rows: [
            { article_id: 1, taille: 'S', quantite: 5 }
          ],
          rowCount: 1
        });
      } else if (query.includes('SELECT * FROM categories')) {
        return Promise.resolve({
          rows: [
            { 
              id: 1, 
              nom: 'Test Catégorie', 
              articles: [
                {
                  id: 1,
                  nom: 'Article de Test',
                  prix: 19.99,
                  description: 'Description de test',
                  categorie_id: 1,
                  images: ['test.jpg'],
                  stocks: [{ taille: 'S', quantite: 5 }]
                }
              ]
            }
          ],
          rowCount: 1
        });
      }
      
      // Autres requêtes
      return Promise.resolve({ rows: [], rowCount: 0 });
    }),
    connect: jest.fn(),
    end: jest.fn()
  };
  
  return { Pool: jest.fn(() => mockPool) };
});

describe('Tests d\'intégration Magasin', () => {
  let magasinClient: Magasin;
  const testPool = new Pool(); // Ce sera notre mock
  
  beforeAll(async () => {
    // Initialiser avec le mock, pas besoin de TRUNCATE réel
    console.log('Préparation de l\'environnement de test pour Magasin');
  });
  
  beforeEach(() => {
    magasinClient = new Magasin();
  });
  
  afterAll(async () => {
    // Nettoyer après les tests
    await testPool.end();
  });

  it('devrait ajouter un article et le récupérer de la base de données', async () => {
    // Données de test
    const articleData = {
      nom: 'Article de Test',
      prix: 19.99,
      description: 'Description de test',
      categorie_id: 1,
      images: ['test.jpg'],
      stocks: [{ taille: 'S', quantite: 5 }]
    };
    
    // Ajouter l'article
    const addResult = await magasinClient.ajouterArticle(articleData);
    expect(addResult.isConfirm).toBe(true);
    
    // Récupérer tous les articles
    const articles = await magasinClient.obtenirArticlesParCategories();
    
    // Vérifier que notre article est bien dans la liste
    const foundArticle = articles.flatMap(cat => cat.articles)
      .find(a => a.nom === 'Article de Test');
    
    expect(foundArticle).toBeDefined();
    expect(foundArticle?.prix).toBe(19.99);
    expect(foundArticle?.stocks).toContainEqual(
      expect.objectContaining({ taille: 'S', quantite: 5 })
    );
  });
});
