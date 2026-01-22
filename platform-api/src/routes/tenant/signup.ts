import express, { Request, Response } from 'express';
import { multiTenantService } from '../../services/infrastructure/tenant/multi-tenant.service.js';
import { userManagerService as userService } from '../../services/members/users/user-manager.service.js';
import { z } from 'zod';

const router = express.Router();

// Validation schema for tenant signup
const TenantSignupSchema = z.object({
  // Tenant information
  tenantName: z.string().min(2, 'Tenant name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be at most 20 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  
  // Admin user information
  adminEmail: z.string().email('Valid email is required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  
  // Plan selection
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).default('FREE'),
  
  // Legal compliance
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to privacy policy'),
});

/**
 * POST /api/tenant/signup
 * Create a new tenant with admin user (public endpoint)
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = TenantSignupSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    const data = validationResult.data;

    // Check if subdomain is available
    const existingTenant = await multiTenantService.getTenantBySubdomain(data.subdomain);
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Subdomain is already taken',
        field: 'subdomain',
      });
    }

    // Check if admin email is already used
    const existingUser = await userService.getUserByEmail(data.adminEmail, 'system');
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
        field: 'adminEmail',
      });
    }

    // Create tenant
    const tenant = await multiTenantService.createTenant({
      name: data.tenantName,
      subdomain: data.subdomain,
      adminEmail: data.adminEmail,
      plan: data.plan,
    });

    // Create admin user
    const adminUser = await userService.register({
      tenantId: tenant.id,
      email: data.adminEmail,
      password: data.adminPassword,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      dateOfBirth: new Date('1990-01-01'), // Default date
    });

    // Generate access token for immediate login
    const loginResult = await userService.login({
      email: data.adminEmail,
      password: data.adminPassword,
      tenantId: tenant.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
          status: tenant.status,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
        user: adminUser.user,
        token: loginResult.token,
        setupUrl: `https://${data.subdomain}.clubmanager.app/setup`,
      },
    });

  } catch (error: any) {
    console.error('Tenant signup error:', error);

    // Handle specific errors
    if (error.message.includes('subdomain')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        field: 'subdomain',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create tenant. Please try again.',
    });
  }
});

/**
 * POST /api/tenant/check-subdomain
 * Check subdomain availability (public endpoint)
 */
router.post('/check-subdomain', async (req: Request, res: Response) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain || typeof subdomain !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is required',
      });
    }

    // Validate format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 20) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Invalid subdomain format',
      });
    }

    // Check reserved names
    const reserved = ['api', 'www', 'admin', 'app', 'mail', 'ftp', 'blog', 'help', 'support'];
    if (reserved.includes(subdomain)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'This subdomain is reserved',
      });
    }

    // Check availability
    const existingTenant = await multiTenantService.getTenantBySubdomain(subdomain);
    
    return res.json({
      success: true,
      available: !existingTenant,
      subdomain,
      url: existingTenant ? null : `https://${subdomain}.clubmanager.app`,
    });

  } catch (error) {
    console.error('Check subdomain error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check subdomain availability',
    });
  }
});

/**
 * GET /api/tenant/plans
 * Get available subscription plans (public endpoint)
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'FREE',
        name: 'Free Trial',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        trialDays: 14,
        features: [
          'Up to 10 users',
          'Up to 5 courses',
          'Basic messaging',
          '100MB storage',
        ],
        limits: {
          users: 10,
          courses: 5,
          storage: 100,
        },
      },
      {
        id: 'STARTER',
        name: 'Starter',
        price: 29,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Up to 50 users',
          'Up to 25 courses',
          'Advanced messaging',
          'Analytics dashboard',
          'API access',
          '1GB storage',
        ],
        limits: {
          users: 50,
          courses: 25,
          storage: 1000,
        },
      },
      {
        id: 'PRO',
        name: 'Professional',
        price: 79,
        currency: 'EUR',
        interval: 'month',
        popular: true,
        features: [
          'Up to 200 users',
          'Up to 100 courses',
          'Custom branding',
          'Advanced analytics',
          'Priority support',
          'API access',
          '5GB storage',
        ],
        limits: {
          users: 200,
          courses: 100,
          storage: 5000,
        },
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        price: 199,
        currency: 'EUR',
        interval: 'month',
        features: [
          'Unlimited users',
          'Unlimited courses',
          'White-label solution',
          'Custom integrations',
          'Dedicated support',
          'SLA guarantee',
          'Unlimited storage',
        ],
        limits: {
          users: -1,
          courses: -1,
          storage: -1,
        },
      },
    ];

    return res.json({
      success: true,
      data: plans,
    });

  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load plans',
    });
  }
});

export default router;