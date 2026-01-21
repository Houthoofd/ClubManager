import { PrismaClient } from '@prisma/client';
import { generateUUID } from '../../../utils/helpers.js';

export interface MultiTenantSettings {
  maxUsers: number;
  maxCourses: number;
  customBranding: boolean;
  apiAccess: boolean;
  storage: number; // in MB
  features: string[];
}

export interface CreateTenantInput {
  name: string;
  subdomain: string;
  adminEmail: string;
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
}

export interface TenantContext {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  settings: MultiTenantSettings;
}

/**
 * Enhanced Multi-Tenant Service
 * Handles SaaS multi-tenancy with proper isolation
 */
export class MultiTenantService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new tenant
   */
  async createTenant(input: CreateTenantInput): Promise<TenantContext> {
    const tenantId = this.generateTenantId();
    
    // Validate subdomain
    await this.validateSubdomain(input.subdomain);

    const tenant = await this.prisma.tenant.create({
      data: {
        id: tenantId,
        name: input.name,
        domain: input.subdomain,
        slug: input.subdomain.toLowerCase(),
        status: 'TRIAL',
        plan: input.plan || 'FREE',
        settings: JSON.stringify(this.getPlanSettings(input.plan || 'FREE')),
        createdAt: new Date(),
      },
    });

    return this.formatTenantContext(tenant);
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantContext | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain: subdomain },
    });

    if (!tenant) return null;
    return this.formatTenantContext(tenant);
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<TenantContext | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return null;
    return this.formatTenantContext(tenant);
  }

  /**
   * Check if user can perform action based on tenant limits
   */
  async checkTenantLimit(
    tenantId: string,
    resource: 'users' | 'courses' | 'storage'
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const usage = await this.getTenantUsage(tenantId);
    
    let current: number;
    let limit: number;

    switch (resource) {
      case 'users':
        current = usage.userCount;
        limit = tenant.settings.maxUsers;
        break;
      case 'courses':
        current = usage.courseCount;
        limit = tenant.settings.maxCourses;
        break;
      case 'storage':
        current = usage.storageUsed;
        limit = tenant.settings.storage;
        break;
      default:
        return { allowed: true, current: 0, limit: -1 };
    }

    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
    };
  }

  /**
   * Get tenant resource usage
   */
  async getTenantUsage(tenantId: string) {
    // Mock data for now since exact Prisma schema fields need verification
    const [userCount, courseCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      0, // Mock cours count until schema is confirmed
    ]);

    return {
      userCount,
      courseCount,
      storageUsed: 0, // TODO: Implement storage calculation
    };
  }

  /**
   * Validate subdomain availability and format
   */
  private async validateSubdomain(subdomain: string): Promise<void> {
    // Check format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      throw new Error('Invalid subdomain format');
    }

    // Check reserved names
    const reserved = ['api', 'www', 'admin', 'app', 'mail', 'ftp'];
    if (reserved.includes(subdomain)) {
      throw new Error('Subdomain is reserved');
    }

    // Check availability
    const existing = await this.prisma.tenant.findUnique({
      where: { domain: subdomain },
    });

    if (existing) {
      throw new Error('Subdomain already taken');
    }
  }

  /**
   * Get plan settings
   */
  private getPlanSettings(plan: string): MultiTenantSettings {
    const settings: Record<string, MultiTenantSettings> = {
      FREE: {
        maxUsers: 10,
        maxCourses: 5,
        customBranding: false,
        apiAccess: false,
        storage: 100,
        features: ['basic'],
      },
      STARTER: {
        maxUsers: 50,
        maxCourses: 25,
        customBranding: false,
        apiAccess: true,
        storage: 1000,
        features: ['basic', 'analytics'],
      },
      PRO: {
        maxUsers: 200,
        maxCourses: 100,
        customBranding: true,
        apiAccess: true,
        storage: 5000,
        features: ['basic', 'analytics', 'custom-branding'],
      },
      ENTERPRISE: {
        maxUsers: -1, // unlimited
        maxCourses: -1,
        customBranding: true,
        apiAccess: true,
        storage: -1,
        features: ['*'],
      },
    };

    return settings[plan] || settings.FREE;
  }

  /**
   * Get plan limits
   */
  getPlanLimits(plan: string) {
    const settings = this.getPlanSettings(plan);
    return {
      users: settings.maxUsers,
      courses: settings.maxCourses,
      storage: settings.storage || 100,
    };
  }

  /**
   * Generate unique tenant ID
   */
  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format tenant data for context
   */
  private formatTenantContext(tenant: any): any {
    return {
      tenantId: tenant.id,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.domain,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
      },
    };
  }

  // Méthodes pour la facturation (stubs pour l'instant)
  async getTenantSubscription(tenantId: string) {
    // TODO: Implémenter avec Stripe
    return {
      id: 'sub_123',
      plan: 'FREE',
      status: 'active',
      currentPeriodEnd: new Date(),
    };
  }

  async changeTenantPlan(tenantId: string, options: any) {
    // TODO: Implémenter avec Stripe
    return {
      success: true,
      plan: options.newPlan,
    };
  }

  async getTenantInvoices(tenantId: string, options: any) {
    // TODO: Implémenter avec Stripe
    return {
      data: [],
      page: options.page,
      limit: options.limit,
      total: 0,
    };
  }

  async updatePaymentMethod(tenantId: string, options: any) {
    // TODO: Implémenter avec Stripe
    return {
      success: true,
    };
  }

  async cancelSubscription(tenantId: string, options: any) {
    // TODO: Implémenter avec Stripe
    return {
      success: true,
    };
  }

  async reactivateSubscription(tenantId: string, options: any) {
    // TODO: Implémenter avec Stripe
    return {
      success: true,
    };
  }

  async getTenantSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.domain,
      timezone: 'Europe/Brussels',
      language: 'fr',
      settings: tenant.settings,
    };
  }

  async updateTenantSettings(tenantId: string, settings: any) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: settings.name,
        domain: settings.subdomain,
        updatedAt: new Date(),
      },
    });

    return this.formatTenantContext(updated);
  }

  async getTenantAnalytics(tenantId: string, options: any) {
    // TODO: Implémenter avec vraies données
    return {
      users: 10,
      courses: 5,
      messages: 100,
      period: options.period,
    };
  }

  async exportTenantData(tenantId: string, options: any) {
    // TODO: Implémenter
    return {
      id: 'job_123',
      status: 'pending',
    };
  }

  async deleteTenant(tenantId: string, options: any) {
    // TODO: Implémenter
    return {
      id: 'deletion_123',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async getAllTenants(options: any) {
    const tenants = await this.prisma.tenant.findMany({
      take: options.limit,
      skip: (options.page - 1) * options.limit,
      orderBy: {
        [options.sortBy]: options.sortOrder,
      },
    });

    const total = await this.prisma.tenant.count();

    return {
      data: tenants.map(t => this.formatTenantContext(t)),
      page: options.page,
      limit: options.limit,
      total,
    };
  }

  async getTenantDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      ...this.formatTenantContext(tenant),
      userCount: tenant._count.users,
    };
  }

  async updateTenantStatus(tenantId: string, options: any) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: options.status,
        updatedAt: new Date(),
      },
    });

    return this.formatTenantContext(updated);
  }

  async getPlatformAnalytics(options: any) {
    const total = await this.prisma.tenant.count();
    const active = await this.prisma.tenant.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalTenants: total,
      activeTenants: active,
      totalRevenue: 0,
      period: options.period,
    };
  }

  async getRevenueAnalytics(options: any) {
    // TODO: Implémenter avec données Stripe
    return {
      monthlyRevenue: 0,
      totalRevenue: 0,
      period: options.period,
    };
  }

  async createImpersonationToken(tenantId: string, options: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // TODO: Créer un vrai token JWT
    return {
      token: `impersonation_${tenantId}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      tenant: { subdomain: tenant.domain },
    };
  }

  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    };
  }

  async setMaintenanceMode(options: any) {
    // TODO: Implémenter avec Redis ou base de données
    return {
      enabled: options.enabled,
      message: options.message,
      setBy: options.setBy,
      timestamp: new Date(),
    };
  }

  async getAuditLogs(options: any) {
    // TODO: Implémenter avec table audit_logs
    return {
      data: [],
      page: options.page,
      limit: options.limit,
      total: 0,
    };
  }
}

export const multiTenantService = new MultiTenantService();