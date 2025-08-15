import { jest } from '@jest/globals';
import { Cours } from '../../../../db/clients/cours/cours.js';
import MysqlConnector from '../../../../db/connector/mysqlconnector.js';
import type { AjoutCours } from '../../../../../../packages/types/dist/index.js';

jest.mock('../../../../db/connector/mysqlconnector.js');

describe('Cours Client compact', () => {
  let coursClient: Cours;
  let mockMysqlConnector: any;

  const mockQuery = (results: any) =>
    (_sql: string, _values: any[] | Function, callback?: Function) => {
      if (typeof _values === 'function') _values(null, results);
      else if (callback) callback(null, results);
    };

  const mockData = {
    courses: [
      { id: 1, date_cours: '2023-06-01', type_cours: 'Karate débutant', heure_debut: '18:00:00', heure_fin: '19:30:00' }
    ],
    users: { utilisateurs: [{ nom: 'Doe', prenom: 'John', presence: 1 }] },
    courseDays: [
      { jour: 'Lundi', type_cours: 'Karate débutant', heure_debut: '18:00', heure_fin: '19:30', professeur: 'John Doe' },
      { jour: 'Lundi', type_cours: 'Karate débutant', heure_debut: '18:00', heure_fin: '19:30', professeur: 'Jane Smith' }
    ]
  };

  const setup = () => {
    coursClient = new Cours();
    mockMysqlConnector = (MysqlConnector as jest.Mock).mock.instances[0];
    jest.clearAllMocks();
  };

  beforeEach(setup);

  const itReturns = (methodName: keyof Cours, mockResult: any, expected: any) => {
    it(`${methodName} should return expected result`, async () => {
      mockMysqlConnector.query.mockImplementation(mockQuery(mockResult));
      const result = await (coursClient[methodName] as any)(1);
      expect(result).toEqual(expected);
    });
  };

  itReturns('obtenirLesCoursPourParticipant', mockData.courses, mockData.courses);
  itReturns('obtenirUtilisateursParCours', [{ first_name: 'John', last_name: 'Doe' }], expect.any(Object));
  itReturns('obtenirLesJoursDeCours', mockData.courseDays, expect.any(Array));

  describe('obtenirCoursAvecUtilisateurs', () => {
    it('should return courses with users', async () => {
      jest.spyOn(coursClient, 'obtenirLesCoursPourParticipant').mockResolvedValue(mockData.courses);
      jest.spyOn(coursClient, 'obtenirUtilisateursParCours').mockResolvedValue(mockData.users);

      const result = await coursClient.obtenirCoursAvecUtilisateurs(1);
      expect(result[0]).toHaveProperty('utilisateurs');
    });
  });

  describe('ajouterCoursRecurrentAvecProfesseurs', () => {
    const baseData: AjoutCours = {
      jour_semaine: 'lundi',
      type_cours: 'Karate débutant',
      heure_debut: '18:00:00',
      heure_fin: '19:30:00',
      professeurs: ['Emmanuel', 'John'],
    };

    const mockMysqlSequence = [
      { insertId: 1 },
      {},
      { affectedRows: 52 },
      [{ professeur_id: 10 }, { professeur_id: 11 }],
      { affectedRows: 2 }
    ];

    it('should add recurring course with professors', async () => {
      mockMysqlConnector.query.mockImplementationOnce(mockQuery(mockMysqlSequence[0]))
        .mockImplementationOnce(mockQuery(mockMysqlSequence[1]))
        .mockImplementationOnce(mockQuery(mockMysqlSequence[2]))
        .mockImplementationOnce(mockQuery(mockMysqlSequence[3]))
        .mockImplementationOnce(mockQuery(mockMysqlSequence[4]));

      const result = await coursClient.ajouterCoursRecurrentAvecProfesseurs(baseData);
      expect(result).toEqual({ isConfirm: true, message: expect.any(String) });
    });

    it('should reject invalid weekday', async () => {
      await expect(
        coursClient.ajouterCoursRecurrentAvecProfesseurs({ ...baseData, jour_semaine: 'invalidDay' })
      ).rejects.toEqual('Jour de la semaine invalide');
    });

    it('should handle no professors', async () => {
      const data = { ...baseData, professeurs: [] };
      mockMysqlConnector.query
        .mockImplementationOnce(mockQuery({ insertId: 1 }))
        .mockImplementationOnce(mockQuery({}))
        .mockImplementationOnce(mockQuery({ affectedRows: 52 }));

      const result = await coursClient.ajouterCoursRecurrentAvecProfesseurs(data);
      expect(result).toEqual({ affectedRows: 52 });
    });
  });
});
