// jest.setup.cjs
// Load environment variables for test environment
const dotenv = require('dotenv');
const path = require('path');

// Load .env.test file if it exists
const envTestPath = path.resolve(__dirname, '../.env.test');
dotenv.config({ path: envTestPath });

// Fallback to .env if .env.test doesn't exist
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  dotenv.config({ path: envPath });
}

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Set default test database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://root:password@localhost:3306/clubmanager_test';
}

// Mock console methods to reduce noise in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

console.log('Jest setup completed - Test environment configured');
