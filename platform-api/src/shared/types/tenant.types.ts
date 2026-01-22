/**
 * Tenant related types for multi-tenant SaaS
 */

export interface TenantCreateInput {
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  settings?: any;
}

export interface TenantUpdateInput {
  name?: string;
  domain?: string;
  plan?: string;
  maxUsers?: number;
  maxStorage?: number;
  settings?: any;
}

export interface TenantWithSubscription {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  maxUsers: number;
  maxStorage: number;
  subscriptions: any[];
}

export interface CreateSubscriptionInput {
  tenantId: string;
  planId: number;
  startDate: Date;
  endDate?: Date;
  price: number;
  currency?: string;
}