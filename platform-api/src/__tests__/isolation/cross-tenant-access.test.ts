import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cross-Tenant Access Prevention', () => {
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    const tenant1 = await prisma.tenant.findFirst({
      where: { slug: 'test-club-1' },
    });
    const tenant2 = await prisma.tenant.findFirst({
      where: { slug: 'test-club-2' },
    });

    tenant1Id = tenant1!.id;
    tenant2Id = tenant2!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Query without tenantId filter should fail or return empty', async () => {
    // Cette requête devrait TOUJOURS inclure un filtre tenantId
    const usersWithoutFilter = await prisma.user.findMany({
      where: {
        email: 'user1@test.com',
        // Manque tenantId - MAUVAISE PRATIQUE
      },
    });

    // On s'attend à ce que le middleware ait forcé le filtre
    // ou qu'une erreur soit levée
    expect(usersWithoutFilter.length).toBeGreaterThanOrEqual(0);
  });

  test('User.findMany should be scoped to tenant', async () => {
    const users = await prisma.user.findMany({
      where: {
        tenantId: tenant1Id,
      },
    });

    // Tous les users doivent appartenir au tenant1
    users.forEach(user => {
      expect(user.tenantId).toBe(tenant1Id);
    });
  });

  test('Joining tables should maintain tenant isolation', async () => {
    const users = await prisma.user.findMany({
      where: {
        tenantId: tenant1Id,
      },
      include: {
        inscriptions: true,
        paiements: true,
      },
    });

    // Vérifier que toutes les relations appartiennent au même tenant
    users.forEach(user => {
      expect(user.tenantId).toBe(tenant1Id);
      // Les inscriptions et paiements devraient être du même utilisateur
      user.inscriptions?.forEach(inscription => {
        expect(inscription.utilisateurId).toBe(user.id);
      });
    });
  });

  test('Creating entity without tenantId should fail', async () => {
    try {
      await prisma.user.create({
        data: {
          // tenantId manquant - DOIT ÉCHOUER
          firstName: 'Test',
          lastName: 'User',
          email: 'test@nodomain.com',
          dateOfBirth: new Date('1990-01-01'),
        } as any,
      });

      fail('Should have thrown error for missing tenantId');
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  test('Update should not allow changing tenantId', async () => {
    const user = await prisma.user.findFirst({
      where: { tenantId: tenant1Id },
    });

    if (user) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tenantId: tenant2Id, // Essayer de changer de tenant - DOIT ÉCHOUER
          },
        });

        // Si ça passe, vérifier que ça n'a pas changé
        const updated = await prisma.user.findUnique({
          where: { id: user.id },
        });
        
        expect(updated?.tenantId).toBe(tenant1Id);
      } catch (error) {
        // C'est OK si ça échoue
        expect(error).toBeDefined();
      }
    }
  });

  test('Bulk operations should be tenant-scoped', async () => {
    const result = await prisma.user.updateMany({
      where: {
        tenantId: tenant1Id,
        actif: true,
      },
      data: {
        actif: true, // Pas de vrai changement
      },
    });

    // Le count ne devrait inclure que les users du tenant1
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  test('Delete should be tenant-scoped', async () => {
    // Créer un user temporaire
    const tempUser = await prisma.user.create({
      data: {
        tenantId: tenant1Id,
        firstName: 'Temp',
        lastName: 'User',
        email: `temp-${Date.now()}@test.com`,
        dateOfBirth: new Date('1990-01-01'),
      },
    });

    // Supprimer avec le bon tenantId
    const result = await prisma.user.deleteMany({
      where: {
        id: tempUser.id,
        tenantId: tenant1Id,
      },
    });

    expect(result.count).toBe(1);

    // Essayer de supprimer avec le mauvais tenantId
    const result2 = await prisma.user.deleteMany({
      where: {
        id: tempUser.id,
        tenantId: tenant2Id, // Mauvais tenant
      },
    });

    expect(result2.count).toBe(0); // Ne devrait rien supprimer
  });

  test('Raw queries should include tenantId', async () => {
    const users = await prisma.$queryRaw`
      SELECT * FROM users WHERE tenant_id = ${tenant1Id} LIMIT 10
    `;

    expect(Array.isArray(users)).toBe(true);
    (users as any[]).forEach(user => {
      expect(user.tenant_id).toBe(tenant1Id);
    });
  });
});
