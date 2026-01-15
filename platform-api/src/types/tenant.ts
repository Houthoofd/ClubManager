import { TenantStatus, SubscriptionStatus } from '@prisma/client';

export interface TenantCreateInput {
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  maxUsers?: number;
  maxStorage?: number;
  settings?: Record<string, any>;
}

export interface TenantUpdateInput {
  name?: string;
  domain?: string;
  status?: TenantStatus;
  plan?: string;
  maxUsers?: number;
  maxStorage?: number;
  settings?: Record<string, any>;
}

export interface TenantWithSubscription {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  plan: string;
  maxUsers: number;
  maxStorage: number;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  subscriptions: TenantSubscriptionData[];
}

export interface TenantSubscriptionData {
  id: string;
  tenantId: string;
  planId: number;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  price: number;
  currency: string;
  plan: {
    nom: string;
    features?: Record<string, any>;
  };
}

export interface CreateSubscriptionInput {
  tenantId: string;
  planId: number;
  startDate: Date;
  endDate?: Date;
  price: number;
  currency?: string;
}

export interface TenantContext {
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    plan: string;
    maxUsers: number;
    maxStorage: number;
  };
}

// Extend Express Request with tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}