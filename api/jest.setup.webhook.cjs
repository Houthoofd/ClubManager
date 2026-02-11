/**
 * Setup Jest pour les tests Webhooks Stripe
 * Configure l'environnement de test et les mocks globaux
 */

// Configuration des timeouts
jest.setTimeout(10000);

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.SENTRY_DSN = 'https://mock@sentry.io/123456';
process.env.SENTRY_ENVIRONMENT = 'test';
process.env.SENTRY_TRACES_SAMPLE_RATE = '0.1';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.SUPPORT_EMAIL = 'support@test.com';

// Mock console pour réduire le bruit dans les tests
global.console = {
  ...console,
  // Garder log et info pour le debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Masquer warn et error sauf si nécessaire
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global pour Prisma
global.mockPrisma = {
  paiements: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  utilisateurs: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  echeances_paiement: {
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  webhook_logs: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(global.mockPrisma)),
};

// Mock global pour le client de messages
global.mockMessageClient = {
  sendTemplate: jest.fn().mockResolvedValue({ success: true }),
  send: jest.fn().mockResolvedValue({ success: true }),
};

// Mock global pour Sentry
global.mockSentry = {
  startTransaction: jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setData: jest.fn(),
    setContext: jest.fn(),
    finish: jest.fn(),
  }),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  configureScope: jest.fn(),
};

// Mock global pour Stripe webhooks
global.mockStripeWebhooks = {
  constructEvent: jest.fn(),
};

// Mock global pour PubSub (GraphQL subscriptions)
global.mockPubSub = {
  publish: jest.fn(),
  asyncIterator: jest.fn(),
  subscribe: jest.fn(),
};

// Helpers de test globaux
global.testHelpers = {
  // Créer un événement Stripe mock
  createStripeEvent: (type, data = {}) => ({
    id: `evt_test_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
    data: {
      object: data,
    },
  }),

  // Créer un PaymentIntent mock
  createPaymentIntent: (overrides = {}) => ({
    id: 'pi_test_123',
    object: 'payment_intent',
    amount: 5000,
    currency: 'eur',
    status: 'succeeded',
    metadata: {
      user_id: '1',
      echeance_id: '1',
    },
    ...overrides,
  }),

  // Créer une Invoice mock
  createInvoice: (overrides = {}) => ({
    id: 'in_test_123',
    object: 'invoice',
    amount_due: 5000,
    amount_paid: 5000,
    currency: 'eur',
    status: 'paid',
    subscription: 'sub_test_123',
    customer: 'cus_test_123',
    number: 'INV-001',
    hosted_invoice_url: 'https://stripe.com/invoice',
    invoice_pdf: 'https://stripe.com/invoice.pdf',
    payment_intent: 'pi_test_123',
    lines: {
      data: [
        {
          period: {
            start: Math.floor(Date.now() / 1000),
            end: Math.floor(Date.now() / 1000) + 2592000,
          },
        },
      ],
    },
    ...overrides,
  }),

  // Créer un Subscription mock
  createSubscription: (overrides = {}) => ({
    id: 'sub_test_123',
    object: 'subscription',
    customer: 'cus_test_123',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 2592000,
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: {
            nickname: 'Premium Plan',
          },
        },
      ],
    },
    ...overrides,
  }),

  // Créer un utilisateur mock
  createUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    nom: 'Test',
    prenom: 'User',
    stripe_customer_id: 'cus_test_123',
    stripe_subscription_id: null,
    active: true,
    ...overrides,
  }),

  // Créer un log webhook mock
  createWebhookLog: (overrides = {}) => ({
    id: 1,
    eventId: 'evt_test_123',
    eventType: 'payment_intent.succeeded',
    status: 'SUCCESS',
    payload: {},
    error: null,
    retryCount: 0,
    nextRetryAt: null,
    processedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Attendre un certain temps
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Réinitialiser tous les mocks
  resetAllMocks: () => {
    Object.values(global.mockPrisma).forEach((mock) => {
      if (typeof mock === 'object') {
        Object.values(mock).forEach((fn) => {
          if (typeof fn.mockReset === 'function') {
            fn.mockReset();
          }
        });
      }
    });
    global.mockMessageClient.sendTemplate.mockReset();
    global.mockMessageClient.send.mockReset();
    global.mockSentry.startTransaction.mockReset();
    global.mockSentry.captureException.mockReset();
    global.mockSentry.captureMessage.mockReset();
    global.mockStripeWebhooks.constructEvent.mockReset();
    global.mockPubSub.publish.mockReset();
  },
};

// Hook avant chaque test
beforeEach(() => {
  // Clear tous les mocks
  jest.clearAllMocks();
});

// Hook après chaque test
afterEach(() => {
  // Restore tous les mocks
  jest.restoreAllMocks();
});

// Hook après tous les tests
afterAll(() => {
  // Cleanup
  jest.clearAllTimers();
});

// Ajouter des matchers personnalisés
expect.extend({
  // Vérifier qu'un objet contient certaines propriétés
  toContainProperties(received, expected) {
    const pass = expected.every((prop) => prop in received);
    if (pass) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to contain properties ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to contain properties ${expected.join(', ')}`,
        pass: false,
      };
    }
  },

  // Vérifier qu'une date est récente (dans les dernières X secondes)
  toBeRecentDate(received, seconds = 5) {
    const now = Date.now();
    const receivedTime = received instanceof Date ? received.getTime() : received;
    const diff = Math.abs(now - receivedTime);
    const pass = diff < seconds * 1000;

    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${seconds} seconds of now`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${seconds} seconds of now`,
        pass: false,
      };
    }
  },

  // Vérifier qu'une fonction a été appelée avec un objet contenant certaines propriétés
  toHaveBeenCalledWithObjectContaining(received, expected) {
    const calls = received.mock.calls;
    const pass = calls.some((call) =>
      call.some((arg) => {
        if (typeof arg !== 'object' || arg === null) return false;
        return Object.keys(expected).every(
          (key) => key in arg && arg[key] === expected[key]
        );
      })
    );

    if (pass) {
      return {
        message: () =>
          `expected function not to have been called with object containing ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected function to have been called with object containing ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  },
});

// Configuration supplémentaire pour les tests asynchrones
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log de démarrage
console.log('✓ Jest setup for Webhook tests loaded');
