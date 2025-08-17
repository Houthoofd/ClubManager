import { Utilisateurs } from '../../../../db/clients/utilisateurs/utilisateurs.js';
import { jest } from '@jest/globals';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import bcrypt from 'bcrypt';

console.log('📌 utilisateurs.test.ts chargé'); // log au début du fichier

// Mock MySQL Connector
jest.mock('../../../../db/connector/mysqlconnector.js');

interface UserData {
  id?: number;
  prenom: string;
  nom: string;
  nom_utilisateur: string;
  email: string;
  genre_id: number;
  date_naissance: string;
  password: string;
  status_id: number;
  grade_id: number | null;
  abonnement_id: number | null;
}

describe('Utilisateurs Client', () => {
  let utilisateursClient: Utilisateurs;
  let mockMysqlConnector: any;

  // Mock bcrypt.compare pour éviter l'erreur et le timeout
  beforeAll(() => {
    jest.spyOn(bcrypt, 'compare').mockImplementation(async (data, hash) => {
      // Simule un match si le mot de passe est 'password123' et le hash est celui attendu
      // Pour le test "should return user data when credentials are valid", le hash doit correspondre à ce qui est retourné par la requête mockée
      return data === 'password123' && hash === '$2b$10$saltsaltsaltsaltsaltsaltsaltsaltsaltsalt1234567890';
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    utilisateursClient = new Utilisateurs();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];

    // S'assurer que close ne bloque pas
    mockMysqlConnector.close.mockImplementation(() => Promise.resolve(true));
  });

  describe('verifierUtilisateur', () => {
    it.each([
      ['user exists', true, [{ id: 1 }], { isFind: true, message: 'Utilisateur trouvé' }],
      ['user does not exist', false, [], { isFind: false, message: 'Utilisateur non trouvé' }],
    ])('should return correct result when %s', async (_desc, _exists, queryResult, expected) => {
      console.log(`▶ Test verifierUtilisateur: ${_desc}`);
      const mockUser = createMockUser();

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        console.log('Mock query called with:', _sql, _values);
        callback(null, queryResult);
      });

      const result = await utilisateursClient.verifierUtilisateur(mockUser);
      console.log('Result verifierUtilisateur:', result);

      expect(result).toEqual(expected);
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });

    it('should reject with error when query fails', async () => {
      console.log('▶ Test verifierUtilisateur: query fails');
      const mockUser = createMockUser();
      const mockError = new Error('Database error');

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(mockError, undefined);
      });

      await expect(utilisateursClient.verifierUtilisateur(mockUser)).rejects.toEqual(mockError);
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });
  });

  describe('checkUtilisateurByEmail', () => {
    it('should return isFind true if user exists', async () => {
      const email = 'john.doe@example.com';
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(null, [{ id: 1 }]);
      });

      const client = new Utilisateurs();
      const result = await client.checkUtilisateurByEmail(email);

      expect(result).toEqual({ isFind: true, message: "Utilisateur déjà existant" });
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM utilisateurs'),
        [email],
        expect.any(Function)
      );
    });

    it('should return isFind false if user does not exist', async () => {
      const email = 'notfound@example.com';
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(null, []);
      });

      const client = new Utilisateurs();
      const result = await client.checkUtilisateurByEmail(email);

      expect(result).toEqual({ isFind: false, message: "Utilisateur non trouvé" });
    });

    it('should reject with error if query fails', async () => {
      const email = 'error@example.com';
      const mockError = new Error('DB error');
      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(mockError, undefined);
      });

      const client = new Utilisateurs();
      await expect(client.checkUtilisateurByEmail(email)).rejects.toEqual(mockError);
    });
  });

  describe('inscriptionUtilisateurSimple', () => {
    it('should insert user and return insertId and affectedRows', async () => {
      const data = {
        nom: 'Doe',
        prenom: 'John',
        email: 'newuser@example.com',
        password: 'securepass',
        date: '2024-06-01',
        abonnement: 1,
        genre: 1
      };
      const mockResult = { insertId: 2, affectedRows: 1 };

      mockMysqlConnector.query.mockImplementation((_sql: string, values: any[], callback: Function) => {
        callback(null, mockResult);
      });

      const client = new Utilisateurs();
      const result = await client.inscriptionUtilisateurSimple(data);

      expect(result).toEqual(mockResult);
      expect(mockMysqlConnector.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO utilisateurs'),
        expect.arrayContaining([
          data.prenom,
          data.nom,
          data.email,
          data.password,
          data.date,
          data.abonnement,
          data.genre,
          1 // grade_id
        ]),
        expect.any(Function)
      );
    });

    it('should reject with error if query fails', async () => {
      const data = {
        nom: 'Doe',
        prenom: 'John',
        email: 'fail@example.com',
        password: 'failpass',
        date: '2024-06-01',
        abonnement: 1,
        genre: 1
      };
      const mockError = new Error('Insert error');

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(mockError, undefined);
      });

      const client = new Utilisateurs();
      await expect(client.inscriptionUtilisateurSimple(data)).rejects.toEqual(mockError);
    });
  });

  describe('validerConnexion', () => {
    it('should return user data when credentials are valid', async () => {
      const loginData = { email: 'john.doe@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        date_of_birth: '1990-01-01',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
        password: '$2b$10$saltsaltsaltsaltsaltsaltsaltsaltsaltsalt1234567890'
      };

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      // Patch bcrypt.compare to return true for this test
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(async (data, hash) => true);

      const result = await utilisateursClient.validerConnexion(loginData);

      expect(result.isFind).toBe(true);
      expect(result.dataToStore).toMatchObject({
        id: 1,
        nom_utilisateur: 'johndoe',
        email: 'john.doe@example.com',
        status_id: 1,
        grade_id: 1,
        abonnement_id: 1,
        prenom: 'John',
        nom: 'Doe',
        date_naissance: '1990-01-01'
      });
    });

    it('should return isFind false when credentials are invalid', async () => {
      console.log('▶ Test validerConnexion: credentials invalid');
      const loginData = { email: 'wrong@example.com', password: 'wrongpassword' };

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(null, []);
      });

      const result = await utilisateursClient.validerConnexion(loginData);
      console.log('Result validerConnexion (invalid):', result);

      expect(result.isFind).toBe(false);
      // Mettre à jour pour correspondre à la structure réelle
      expect(result.dataToStore).toEqual({
        id: null,
        prenom: '',
        nom: '',
        nom_utilisateur: '',
        email: '',
        date_naissance: '',
        status_id: 0,
        grade_id: null,
        abonnement_id: null
      });
    });
  });

  describe('modifierInfosUtilisateur', () => {
    it('should update status, grade, and abonnement and return confirmation', async () => {
      const mockUserId = 1;
      const mockResult = { affectedRows: 1 };
      const updateData = { id: mockUserId, status_id: 2, grade_id: 3, abonnement_id: 4 };

      mockMysqlConnector.query.mockImplementation((sql: string, values: any[], callback: Function) => {
        expect(sql).toContain('UPDATE utilisateurs SET');
        expect(values).toEqual([2, 3, 4, mockUserId]);
        callback(null, mockResult);
      });

      const client = new Utilisateurs();
      const result = await client.modifierInfosUtilisateur(updateData);

      expect(result).toEqual({ isConfirm: true, message: `Utilisateur avec ID ${mockUserId} modifié avec succès.` });
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const mockUserId = 2;
      const mockResult = { affectedRows: 1 };
      const updateData = { id: mockUserId, status_id: 5 };

      mockMysqlConnector.query.mockImplementation((sql: string, values: any[], callback: Function) => {
        expect(sql).toContain('status_id = ?');
        expect(sql).not.toContain('grade_id = ?');
        expect(sql).not.toContain('abonnement_id = ?');
        expect(values).toEqual([5, mockUserId]);
        callback(null, mockResult);
      });

      const client = new Utilisateurs();
      const result = await client.modifierInfosUtilisateur(updateData);

      expect(result).toEqual({ isConfirm: true, message: `Utilisateur avec ID ${mockUserId} modifié avec succès.` });
      expect(mockMysqlConnector.query).toHaveBeenCalled();
    });

    it('should return no modification if no fields provided', async () => {
      const mockUserId = 3;
      const client = new Utilisateurs();
      const result = await client.modifierInfosUtilisateur({ id: mockUserId });

      expect(result).toEqual({ isConfirm: false, message: "Aucune donnée à modifier." });
    });

    it('should reject with error if query fails', async () => {
      const mockUserId = 4;
      const mockError = new Error('Update error');
      const updateData = { id: mockUserId, grade_id: 10 };

      mockMysqlConnector.query.mockImplementation((_sql: string, _values: any[], callback: Function) => {
        callback(mockError, undefined);
      });

      const client = new Utilisateurs();
      await expect(client.modifierInfosUtilisateur(updateData)).rejects.toEqual(mockError);
    });

    it('should throw error if id is missing', async () => {
      const client = new Utilisateurs();
      // Ajoute un id manquant pour tester l'erreur
      // @ts-expect-error: test volontaire d'un appel sans id
      await expect(client.modifierInfosUtilisateur({ status_id: 1 })).rejects.toThrow("L'identifiant de l'utilisateur est requis pour la modification.");
    });
  });
});

// Helpers
const createMockUser = (overrides: Partial<UserData> = {}): UserData => {
  return {
    id: 1,
    prenom: 'John',
    nom: 'Doe',
    nom_utilisateur: 'johndoe',
    email: 'john.doe@example.com',
    genre_id: 1,
    date_naissance: '1990-01-01',
    password: 'password123',
    status_id: 1,
    grade_id: 1,
    abonnement_id: 1,
    ...overrides,
  };
};