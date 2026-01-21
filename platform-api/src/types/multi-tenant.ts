/**
 * Multi-Tenant Architecture Strategy
 * 
 * Nous utilisons une approche "Row Level Security" (RLS) avec isolation par tenantId
 * Chaque table contient une colonne tenantId qui isole les données
 */

// === SCHEMA EVOLUTION ===

/**
 * 1. Tenant Management Schema
 */
export interface TenantSchema {
  id: string; // UUID
  name: string;
  domain?: string; // custom domain (premium feature)
  subdomain: string; // tenant.clubmanager.app
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  settings: TenantSettings;
  billing: TenantBilling;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  maxUsers: number;
  maxCourses: number;
  customBranding: boolean;
  apiAccess: boolean;
  storage: number; // in MB
  features: string[]; // feature flags
}

export interface TenantBilling {
  stripeCustomerId?: string;
  subscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
}

/**
 * 2. User Context Enhancement
 */
export interface UserContext {
  id: number;
  tenantId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER';
  permissions: string[];
  tenantRole: 'OWNER' | 'ADMIN' | 'MEMBER';
}

/**
 * 3. Database Isolation Strategy
 */
export type DatabaseIsolationStrategy = 
  | 'SHARED_DATABASE' // Single DB with tenantId column
  | 'DATABASE_PER_TENANT' // Separate DB per tenant
  | 'SCHEMA_PER_TENANT'; // Separate schema per tenant

// Recommandation: SHARED_DATABASE pour commencer, migration possible plus tard