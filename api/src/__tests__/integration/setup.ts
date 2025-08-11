import { app } from '../../app.js';
import request from 'supertest';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Export the request configured for our app
export const testRequest = request(app);

// Common test utilities
export const setupIntegrationTest = () => {
  // Setup code that runs before each test suite
  beforeAll(() => {
    // Global setup if needed
    console.log('Setting up integration test environment');
  });

  afterAll(() => {
    // Global cleanup if needed
    console.log('Tearing down integration test environment');
  });
};
