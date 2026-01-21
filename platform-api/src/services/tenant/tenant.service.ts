import { PrismaClient, TenantStatus, SubscriptionStatus } from "@prisma/client";
import {
  TenantCreateInput,
  TenantUpdateInput,
  TenantWithSubscription,
  CreateSubscriptionInput,
} from "../types/tenant.js";

const prisma = new PrismaClient();

/**
 * Helper function to transform Prisma Decimal prices to numbers
 */
function transformTenantData(tenant: any): TenantWithSubscription {
  return {
    ...tenant,
    subscriptions: tenant.subscriptions.map((sub: any) => ({
      ...sub,
      price: Number(sub.price)
    }))
  };
}

export class TenantService {
  /**
   * Créer un nouveau tenant
   */
  async createTenant(data: TenantCreateInput): Promise<TenantWithSubscription> {
    const {
      name,
      slug,
      domain,
      plan,
      maxUsers = 10,
      maxStorage = 1000,
      settings,
    } = data;

    // Vérifier que le slug est unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new Error("Tenant slug already exists");
    }

    // Vérifier que le domaine est unique (si fourni)
    if (domain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { domain },
      });

      if (existingDomain) {
        throw new Error("Domain already exists");
      }
    }

    // Créer le tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain,
        plan,
        maxUsers,
        maxStorage,
        settings: settings || {},
        status: TenantStatus.TRIAL, // Nouveau tenant commence en trial
      },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    return transformTenantData(tenant);
  }

  /**
   * Mettre à jour un tenant
   */
  async updateTenant(
    tenantId: string,
    data: TenantUpdateInput,
  ): Promise<TenantWithSubscription> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    return transformTenantData(tenant);
  }

  /**
   * Récupérer un tenant par ID
   */
  async getTenantById(
    tenantId: string,
  ): Promise<TenantWithSubscription | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return tenant ? transformTenantData(tenant) : null;
  }

  /**
   * Récupérer un tenant par slug
   */
  async getTenantBySlug(slug: string): Promise<TenantWithSubscription | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return tenant as TenantWithSubscription | null;
  }

  /**
   * Lister tous les tenants avec pagination
   */
  async listTenants(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        include: {
          subscriptions: {
            include: {
              plan: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1, // Most recent subscription
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.tenant.count(),
    ]);

    return {
      tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Créer une souscription pour un tenant
   */
  async createSubscription(data: CreateSubscriptionInput) {
    const {
      tenantId,
      planId,
      startDate,
      endDate,
      price,
      currency = "EUR",
    } = data;

    // Vérifier que le plan existe
    const plan = await prisma.planTarifaire.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.actif) {
      throw new Error("Invalid or inactive plan");
    }

    // Créer la souscription
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        startDate,
        endDate,
        price,
        currency,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });

    // Mettre à jour le tenant avec le nouveau plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: plan.nom,
        maxUsers: plan.maxUsers,
        maxStorage: plan.maxStorage,
        status: TenantStatus.ACTIVE,
      },
    });

    return subscription;
  }

  /**
   * Suspendre un tenant
   */
  async suspendTenant(
    tenantId: string,
    reason?: string,
  ): Promise<TenantWithSubscription> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.SUSPENDED,
        settings: {
          suspensionReason: reason,
          suspendedAt: new Date().toISOString(),
        },
      },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    return transformTenantData(tenant);
  }

  /**
   * Réactiver un tenant
   */
  async reactivateTenant(tenantId: string): Promise<TenantWithSubscription> {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.ACTIVE,
      },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    return transformTenantData(tenant);
  }

  /**
   * Supprimer un tenant (soft delete)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: TenantStatus.INACTIVE,
      },
    });
  }

  /**
   * Obtenir les statistiques d'usage d'un tenant
   */
  async getTenantUsage(tenantId: string) {
    const [userCount, activeUsers, subscriptions] = await Promise.all([
      prisma.user.count({
        where: { tenantId },
      }),
      prisma.user.count({
        where: { tenantId, actif: true },
      }),
      prisma.tenantSubscription.findMany({
        where: { tenantId },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    // TODO: Calculate storage usage
    const storageUsage = 0; // Placeholder

    return {
      users: {
        total: userCount,
        active: activeUsers,
      },
      storage: {
        used: storageUsage,
        limit: subscriptions[0]?.plan?.maxStorage || 1000,
      },
      subscriptions,
    };
  }
}

const tenantServiceInstance = new TenantService();
export const tenantService = tenantServiceInstance;
export default tenantServiceInstance;
