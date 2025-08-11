import request from 'supertest';
import express, { Request, Response } from 'express';
import indexRouter from '../../routes/index.js';

// Mock all the routers that are imported in index.ts
jest.mock('../../routes/utilisateurs.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'utilisateurs' });
  });
  return { default: router };
});

jest.mock('../../routes/informations.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'informations' });
  });
  return { default: router };
});

jest.mock('../../routes/cours.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'cours' });
  });
  return { default: router };
});

jest.mock('../../routes/paiements.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'paiements' });
  });
  return { default: router };
});

jest.mock('../../routes/statistiques.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'statistiques' });
  });
  return { default: router };
});

jest.mock('../../routes/magasin.js', () => {
  const router = express.Router();
  router.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ route: 'magasin' });
  });
  return { default: router };
});

// Create an Express app for testing
const app = express();
app.use('/', indexRouter);

describe('Index Router', () => {
  it('should route to utilisateurs correctly', async () => {
    const response = await request(app).get('/utilisateurs/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'utilisateurs' });
  });

  it('should route to informations correctly', async () => {
    const response = await request(app).get('/informations/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'informations' });
  });

  it('should route to cours correctly', async () => {
    const response = await request(app).get('/cours/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'cours' });
  });

  it('should route to paiements correctly', async () => {
    const response = await request(app).get('/paiements/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'paiements' });
  });

  it('should route to cours/statistiques correctly', async () => {
    const response = await request(app).get('/cours/statistiques/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'statistiques' });
  });

  it('should route to magasin correctly', async () => {
    const response = await request(app).get('/magasin/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ route: 'magasin' });
  });
});
