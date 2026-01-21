// Tenant types

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  plan: string;
  maxUsers: number;
  maxStorage: number;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantConfig {
  tenantId: string;
  settings: Record<string, any>;
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  TRIAL = 'TRIAL'
}

export interface TenantCreateInput {
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  maxUsers?: number;
  maxStorage?: number;
  settings?: any;
}

export interface TenantUpdateInput {
  name?: string;
  slug?: string;
  domain?: string;
  status?: TenantStatus;
  plan?: string;
  maxUsers?: number;
  maxStorage?: number;
  settings?: any;
}

export interface TenantWithSubscription extends Tenant {
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