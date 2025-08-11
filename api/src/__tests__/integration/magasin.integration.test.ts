import { Magasin } from '../../db/clients/magasin/magasin.js';
import { Pool } from 'pg';

// Connexion à une vraie base de données de test
const testPool = new Pool({
  host: process.env.TEST_DB_HOST,
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME,
  user: process.env.TEST_DB_USER,
  password: process.env.TEST_DB_PASSWORD
});

describe('Tests d\'intégration Magasin', () => {
  let magasinClient: Magasin;
  
  beforeAll(async () => {
    // Initialiser la base de données de test
    await testPool.query('TRUNCATE TABLE articles CASCADE');
    await testPool.query('TRUNCATE TABLE stocks CASCADE');
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
