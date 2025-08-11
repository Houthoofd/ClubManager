import MysqlConnector from '../../db/connector/mysqlconnector.js';

// Mock the MySQL connector for integration tests
jest.mock('../../db/connector/mysqlconnector.js', () => {
  const mockData = {
    // Courses data
    courses: [
      { 
        id: 1, 
        date_cours: '2023-06-01', 
        type_cours: 'Karate débutant', 
        heure_debut: '18:00:00', 
        heure_fin: '19:30:00' 
      },
      { 
        id: 2, 
        date_cours: '2023-06-08', 
        type_cours: 'Karate avancé', 
        heure_debut: '20:00:00', 
        heure_fin: '21:30:00' 
      }
    ],
    // Users data
    users: [
      { 
        id: 1, 
        first_name: 'John', 
        last_name: 'Doe', 
        email: 'john.doe@example.com', 
        nom_utilisateur: 'johndoe',
        genre_id: 1,
        date_of_birth: '1990-01-01',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1 
      },
      { 
        id: 2, 
        first_name: 'Jane', 
        last_name: 'Smith', 
        email: 'jane.smith@example.com',
        nom_utilisateur: 'janesmith',
        genre_id: 2,
        date_of_birth: '1992-05-15',
        status_id: 1,
        grade_id: 2,
        abonnement_id: 2
      },
      { 
        id: 3, 
        first_name: 'Admin', 
        last_name: 'User', 
        email: 'admin@example.com',
        nom_utilisateur: 'admin',
        genre_id: 1,
        date_of_birth: '1985-12-10',
        status_id: 4, // Admin
        grade_id: 3,
        abonnement_id: 3
      }
    ],
    // Grades data
    grades: [
      { id: 1, nom: 'Ceinture blanche', ordre: 1 },
      { id: 2, nom: 'Ceinture jaune', ordre: 2 },
      { id: 3, nom: 'Ceinture orange', ordre: 3 }
    ],
    // Genres data
    genres: [
      { id: 1, nom: 'Homme' },
      { id: 2, nom: 'Femme' }
    ],
    // Status data
    status: [
      { id: 1, nom: 'Membre' },
      { id: 2, nom: 'Invité' },
      { id: 3, nom: 'Professeur' },
      { id: 4, nom: 'Administrateur' }
    ],
    // Plans tarifaires data
    plans_tarifaires: [
      { id: 1, nom_plan: 'Basic', prix: 50.00 },
      { id: 2, nom_plan: 'Premium', prix: 100.00 },
      { id: 3, nom_plan: 'Pro', prix: 150.00 }
    ],
    // User courses
    inscriptions: [
      { id: 1, cours_id: 1, utilisateur_id: 1, status_id: 1 },
      { id: 2, cours_id: 2, utilisateur_id: 2, status_id: 1 }
    ],
    // Statistics data
    statistics: {
      totalFrequentation: 120,
      frequentationParCours: [
        { cours_id: 1, titre: 'Karate Débutant', frequentation: 50 },
        { cours_id: 2, titre: 'Karate Avancé', frequentation: 70 }
      ],
      frequentationParMois: [
        { mois: 'Janvier', frequentation: 30 },
        { mois: 'Février', frequentation: 40 },
        { mois: 'Mars', frequentation: 50 }
      ]
    }
  };

  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn((sql, values, callback) => {
        console.log('Mock query:', sql);
        console.log('Query params:', values);
        
        // Simulate different query results based on SQL
        if (sql.includes('SELECT * FROM grades')) {
          callback(null, mockData.grades);
        } else if (sql.includes('SELECT * FROM genres')) {
          callback(null, mockData.genres);
        } else if (sql.includes('SELECT * FROM status')) {
          callback(null, mockData.status);
        } else if (sql.includes('SELECT * FROM plans_tarifaires')) {
          callback(null, mockData.plans_tarifaires);
        } else if (sql.includes('SELECT * FROM utilisateurs WHERE status_id = 5')) {
          callback(null, mockData.users.filter(u => u.status_id === 3)); // Professors have status_id 3
        } else if (sql.includes('SELECT * FROM utilisateurs WHERE id = ?')) {
          const userId = values[0];
          const user = mockData.users.find(u => u.id === userId);
          callback(null, user ? [user] : []);
        } else if (sql.includes('SELECT c.* FROM cours c JOIN inscriptions i')) {
          // Query for participant courses
          const participantId = values[0];
          const userInscriptions = mockData.inscriptions.filter(i => i.utilisateur_id === participantId);
          const courseIds = userInscriptions.map(i => i.cours_id);
          const courses = mockData.courses.filter(c => courseIds.includes(c.id));
          callback(null, courses);
        } else if (sql.includes('SELECT * FROM cours WHERE date_cours >= CURRENT_DATE')) {
          callback(null, mockData.courses);
        } else {
          // Default fallback for unhandled queries
          callback(null, []);
        }
      }),
      close: jest.fn(),
      beginTransaction: jest.fn(callback => callback(null)),
      commit: jest.fn(callback => callback(null)),
      rollback: jest.fn(callback => callback())
    };
  });
});

// Mock pg Pool for PostgreSQL tests
jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => {
      return {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn()
        }),
        end: jest.fn().mockResolvedValue(undefined)
      };
    })
  };
});

export const resetMocks = () => {
  jest.clearAllMocks();
};
