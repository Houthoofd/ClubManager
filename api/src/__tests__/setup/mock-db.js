/**
 * Configuration de base de données simulée pour les tests
 * Cela évite d'avoir besoin d'une connexion réelle à la base de données pour les tests unitaires
 */

import mysql from 'mysql';

// Mock de la bibliothèque mysql
const mockConnection = {
  connect: jest.fn(callback => callback()),
  query: jest.fn((sql, values, callback) => {
    // Si appelé avec seulement 2 arguments (sql, callback)
    if (typeof values === 'function') {
      callback = values;
      values = [];
    }
    
    // Simuler une réponse de base de données vide par défaut
    callback(null, []);
  }),
  close: jest.fn(callback => callback && callback()),
  end: jest.fn(callback => callback && callback()),
  beginTransaction: jest.fn(callback => callback && callback()),
  commit: jest.fn(callback => callback && callback()),
  rollback: jest.fn(callback => callback && callback()),
};

// Mock de createConnection pour toujours renvoyer notre mock
const mockCreateConnection = jest.fn().mockImplementation(() => mockConnection);

// Remplacer la méthode createConnection originale
mysql.createConnection = mockCreateConnection;

export { mysql, mockConnection, mockCreateConnection };
