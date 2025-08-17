// api/src/__tests__/routes/index.test.ts
import express from 'express';
import type { Request, Response, Router } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

describe('Test du router principal avec toutes les méthodes HTTP', () => {
  let app: express.Application;

  const routesToMock = [
    'utilisateurs',
    'informations',
    'cours',
    'paiements',
    'statistiques',
    'magasin',
    'inscription'
  ];

  const httpMethods: ('get' | 'post' | 'put' | 'delete')[] = [
    'get',
    'post',
    'put',
    'delete'
  ];

  beforeAll(async () => {
    await jest.unstable_mockModule('@clubmanager/types', () => ({
      datannulationSchema: {},
      datareservationSchema: {},
    }));

    // Fonction utilitaire pour créer un router mock avec toutes les méthodes HTTP
    const createMockRouter = (routeName: string) => {
      const r = express.Router();

      httpMethods.forEach(method => {
        (r as any)[method]('/test', (_req: any, res: any) => {
          res.status(200).json({ route: routeName, method: method.toUpperCase() });
        });
      });

      // Pour toutes les routes, y compris statistiques, on retourne juste 'r'
      return r;
    };

    // Mock toutes les routes dynamiquement
    await Promise.all(
      routesToMock.map(route =>
        jest.unstable_mockModule(`../../routes/${route}.js`, async () => ({
          default: createMockRouter(route)
        }))
      )
    );

    // Import dynamique du router principal
    const { default: indexRouter } = await import('../../routes/index.js');

    // Création de l’app Express
    app = express();
    app.use(express.json());
    app.use('/', indexRouter as express.Router);
  });

  // Tests générés automatiquement pour chaque route et chaque méthode HTTP
  routesToMock.forEach(route => {
    httpMethods.forEach(method => {
      it(`devrait répondre pour ${method.toUpperCase()} sur la route ${route}`, async () => {
        // Correction : pour 'statistiques', testez uniquement /statistiques/test
        const routePaths =
          route === 'statistiques'
            ? ['/statistiques/test']
            : [`/${route}/test`];

        for (const routePath of routePaths) {
          const res = await request(app)[method](routePath);
          expect(res.status).toBe(200);
          expect(res.body).toEqual({ route, method: method.toUpperCase() });
        }
      });
    });
  });
});

// Rien à modifier ici tant que votre router statistiques est bien monté sur /statistiques dans index.ts.
// Le test vérifie /statistiques/test uniquement : il est aligné avec votre configuration actuelle.