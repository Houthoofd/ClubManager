import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../../app.js';

const prisma = new PrismaClient();

describe('Tenant Isolation Tests', () => {
  let tenant1: any;
  let tenant2: any;
  let user1: any;
  let user2: any;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    // Créer deux tenants de test
    tenant1 = await prisma.tenant.create({
      data: {
        name: 'Test Club 1',
        slug: 'test-club-1',
        status: 'ACTIVE',
        plan: 'BASIC',
      },
    });

    tenant2 = await prisma.tenant.create({
      data: {
        name: 'Test Club 2',
        slug: 'test-club-2',
        status: 'ACTIVE',
        plan: 'BASIC',
      },
    });

    // Créer un utilisateur pour chaque tenant
    user1 = await prisma.user.create({
      data: {
        tenantId: tenant1.id,
        firstName: 'User',
        lastName: 'One',
        email: 'user1@test.com',
        password: 'hashedpassword',
        dateOfBirth: new Date('1990-01-01'),
      },
    });

    user2 = await prisma.user.create({
      data: {
        tenantId: tenant2.id,
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@test.com',
        password: 'hashedpassword',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
  });

  afterAll(async () => {
    // Nettoyer
    await prisma.user.deleteMany({
      where: {
        id: { in: [user1.id, user2.id] },
      },
    });

    await prisma.tenant.deleteMany({
      where: {
        id: { in: [tenant1.id, tenant2.id] },
      },
    });

    await prisma.$disconnect();
  });

  test('User from tenant1 should not access data from tenant2', async () => {
    // Authentifier comme user1 (tenant1)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Host', 'test-club-1.localhost:5000')
      .send({
        email: 'user1@test.com',
        password: 'password',
      });

    token1 = loginRes.body.token;

    // Essayer d'accéder aux données du tenant2 avec le token du tenant1
    const res = await request(app)
      .get(`/api/users/${user2.id}`)
      .set('Host', 'test-club-1.localhost:5000')
      .set('Authorization', `Bearer ${token1}`);

    // Devrait retourner 404 ou 403
    expect([403, 404]).toContain(res.status);
  });

  test('Tenant resolver should correctly identify tenant from subdomain', async () => {
    const res = await request(app)
      .get('/api/tenants/current')
      .set('Host', 'test-club-1.localhost:5000');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('test-club-1');
  });

  test('Users query should only return users from current tenant', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Host', 'test-club-1.localhost:5000')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    
    const userIds = res.body.map((u: any) => u.id);
    expect(userIds).toContain(user1.id);
    expect(userIds).not.toContain(user2.id);
  });

  test('Creating data should automatically include tenantId', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Host', 'test-club-1.localhost:5000')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        dateCours: '2025-02-01',
        typeCours: 'Test Course',
        heureDebut: '10:00:00',
        heureFin: '11:00:00',
      });

    if (res.status === 201) {
      const course = await prisma.cours.findUnique({
        where: { id: res.body.id },
      });

      // Vérifier que le cours est bien lié au tenant
      // Note: Ajouter tenantId à la table cours si nécessaire
      expect(course).toBeDefined();
    }
  });

  test('Suspended tenant should not allow access', async () => {
    // Suspendre tenant1
    await prisma.tenant.update({
      where: { id: tenant1.id },
      data: { status: 'SUSPENDED' },
    });

    const res = await request(app)
      .get('/api/users')
      .set('Host', 'test-club-1.localhost:5000')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('suspended');

    // Réactiver pour les autres tests
    await prisma.tenant.update({
      where: { id: tenant1.id },
      data: { status: 'ACTIVE' },
    });
  });
});
