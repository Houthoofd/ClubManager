import { PrismaClient } from '@prisma/client';
import {
  setCurrentTenantId,
  clearCurrentTenantId,
  withTenantContext,
} from '../middleware/prisma/tenant-isolation.middleware.js';

describe('Tenant Isolation Tests', () => {
  let prisma: PrismaClient;
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test tenants
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Test Club A',
        slug: 'test-club-a',
        domain: 'test-club-a',
        status: 'ACTIVE',
        plan: 'FREE',
        maxUsers: 10,
        maxStorage: 1000,
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Test Club B',
        slug: 'test-club-b',
        domain: 'test-club-b',
        status: 'ACTIVE',
        plan: 'FREE',
        maxUsers: 10,
        maxStorage: 1000,
      },
    });

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;

    // Create users for tenant 1
    await withTenantContext(tenant1Id, async () => {
      const user1 = await prisma.user.create({
        data: {
          tenantId: tenant1Id,
          email: 'user1@test-club-a.com',
          firstName: 'User',
          lastName: 'One',
          dateOfBirth: new Date('1990-01-01'),
        },
      });
      user1Id = user1.id;
    });

    // Create users for tenant 2
    await withTenantContext(tenant2Id, async () => {
      const user2 = await prisma.user.create({
        data: {
          tenantId: tenant2Id,
          email: 'user2@test-club-b.com',
          firstName: 'User',
          lastName: 'Two',
          dateOfBirth: new Date('1990-01-01'),
        },
      });
      user2Id = user2.id;
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        OR: [{ tenantId: tenant1Id }, { tenantId: tenant2Id }],
      },
    });

    await prisma.tenant.deleteMany({
      where: {
        id: { in: [tenant1Id, tenant2Id] },
      },
    });

    await prisma.$disconnect();
  });

  afterEach(() => {
    clearCurrentTenantId();
  });

  describe('User Isolation', () => {
    it('should only return users from tenant 1 when tenant 1 context is set', async () => {
      setCurrentTenantId(tenant1Id);

      const users = await prisma.user.findMany();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('user1@test-club-a.com');
      expect(users[0].tenantId).toBe(tenant1Id);
    });

    it('should only return users from tenant 2 when tenant 2 context is set', async () => {
      setCurrentTenantId(tenant2Id);

      const users = await prisma.user.findMany();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('user2@test-club-b.com');
      expect(users[0].tenantId).toBe(tenant2Id);
    });

    it('should throw error when trying to query without tenant context', async () => {
      clearCurrentTenantId();

      await expect(prisma.user.findMany()).rejects.toThrow(
        /without tenant context/i
      );
    });

    it('should prevent cross-tenant data access via findUnique', async () => {
      setCurrentTenantId(tenant1Id);

      // Try to access user from tenant 2
      const user = await prisma.user.findUnique({
        where: { id: user2Id },
      });

      // Should return null because of tenant isolation
      expect(user).toBeNull();
    });

    it('should allow access to own tenant data via findUnique', async () => {
      setCurrentTenantId(tenant1Id);

      const user = await prisma.user.findUnique({
        where: { id: user1Id },
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe('user1@test-club-a.com');
    });
  });

  describe('User Creation', () => {
    it('should automatically set tenantId when creating a user', async () => {
      setCurrentTenantId(tenant1Id);

      const newUser = await prisma.user.create({
        data: {
          email: 'newuser@test-club-a.com',
          firstName: 'New',
          lastName: 'User',
          dateOfBirth: new Date('1995-01-01'),
        },
      });

      expect(newUser.tenantId).toBe(tenant1Id);

      // Clean up
      await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('should throw error when trying to create user for different tenant', async () => {
      setCurrentTenantId(tenant1Id);

      await expect(
        prisma.user.create({
          data: {
            tenantId: tenant2Id, // Trying to create for tenant 2
            email: 'hacker@test.com',
            firstName: 'Hacker',
            lastName: 'User',
            dateOfBirth: new Date('1995-01-01'),
          },
        })
      ).rejects.toThrow(/SECURITY/i);
    });
  });

  describe('User Update', () => {
    it('should allow updating user in own tenant', async () => {
      setCurrentTenantId(tenant1Id);

      const updated = await prisma.user.update({
        where: { id: user1Id },
        data: { firstName: 'Updated' },
      });

      expect(updated.firstName).toBe('Updated');

      // Restore original value
      await prisma.user.update({
        where: { id: user1Id },
        data: { firstName: 'User' },
      });
    });

    it('should prevent updating user from different tenant', async () => {
      setCurrentTenantId(tenant1Id);

      await expect(
        prisma.user.update({
          where: { id: user2Id },
          data: { firstName: 'Hacked' },
        })
      ).rejects.toThrow();
    });

    it('should prevent changing tenantId on existing user', async () => {
      setCurrentTenantId(tenant1Id);

      await expect(
        prisma.user.update({
          where: { id: user1Id },
          data: { tenantId: tenant2Id },
        })
      ).rejects.toThrow(/SECURITY/i);
    });
  });

  describe('User Deletion', () => {
    it('should allow deleting user from own tenant', async () => {
      setCurrentTenantId(tenant1Id);

      // Create a user to delete
      const userToDelete = await prisma.user.create({
        data: {
          email: 'delete-me@test-club-a.com',
          firstName: 'Delete',
          lastName: 'Me',
          dateOfBirth: new Date('1995-01-01'),
        },
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: userToDelete.id },
      });

      // Verify it's deleted
      const deleted = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });

      expect(deleted).toBeNull();
    });

    it('should prevent deleting user from different tenant', async () => {
      setCurrentTenantId(tenant1Id);

      await expect(
        prisma.user.delete({
          where: { id: user2Id },
        })
      ).rejects.toThrow();
    });
  });

  describe('Tenant Context Switching', () => {
    it('should correctly switch tenant context', async () => {
      // Start with tenant 1
      setCurrentTenantId(tenant1Id);
      let users = await prisma.user.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].email).toContain('test-club-a');

      // Switch to tenant 2
      setCurrentTenantId(tenant2Id);
      users = await prisma.user.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].email).toContain('test-club-b');
    });

    it('should handle nested tenant contexts with withTenantContext', async () => {
      setCurrentTenantId(tenant1Id);

      // Execute code in tenant 2 context
      await withTenantContext(tenant2Id, async () => {
        const users = await prisma.user.findMany();
        expect(users).toHaveLength(1);
        expect(users[0].tenantId).toBe(tenant2Id);
      });

      // Context should be restored to tenant 1
      const users = await prisma.user.findMany();
      expect(users).toHaveLength(1);
      expect(users[0].tenantId).toBe(tenant1Id);
    });
  });

  describe('Count and Aggregate Operations', () => {
    it('should only count users in current tenant', async () => {
      setCurrentTenantId(tenant1Id);

      const count = await prisma.user.count();
      expect(count).toBe(1);
    });

    it('should only aggregate users in current tenant', async () => {
      setCurrentTenantId(tenant1Id);

      const result = await prisma.user.aggregate({
        _count: true,
      });

      expect(result._count).toBe(1);
    });
  });

  describe('Unique Constraint Isolation', () => {
    it('should allow same email in different tenants', async () => {
      const email = 'same-email@test.com';

      // Create user with same email in tenant 1
      await withTenantContext(tenant1Id, async () => {
        const user = await prisma.user.create({
          data: {
            email,
            firstName: 'Same',
            lastName: 'Email',
            dateOfBirth: new Date('1990-01-01'),
          },
        });
        expect(user.email).toBe(email);
      });

      // Create user with same email in tenant 2 (should work due to unique constraint per tenant)
      await withTenantContext(tenant2Id, async () => {
        const user = await prisma.user.create({
          data: {
            email,
            firstName: 'Same',
            lastName: 'Email',
            dateOfBirth: new Date('1990-01-01'),
          },
        });
        expect(user.email).toBe(email);
      });

      // Clean up
      await prisma.user.deleteMany({
        where: { email },
      });
    });

    it('should prevent duplicate email within same tenant', async () => {
      setCurrentTenantId(tenant1Id);

      await expect(
        prisma.user.create({
          data: {
            email: 'user1@test-club-a.com', // Already exists
            firstName: 'Duplicate',
            lastName: 'User',
            dateOfBirth: new Date('1990-01-01'),
          },
        })
      ).rejects.toThrow(/Unique constraint/i);
    });
  });
});
