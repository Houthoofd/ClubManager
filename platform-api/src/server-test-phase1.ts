/**
 * Serveur de test minimaliste pour Phase 1
 * Teste uniquement : Health Checks, Audit Logging, Rate Limiting
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/utils/health.js';
import { tenantRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware basiques
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health checks (SANS rate limiting pour faciliter les tests)
app.use('/health', healthRouter);

// Route de test avec rate limiting
app.get('/test-rate-limit', tenantRateLimiter, (req, res) => {
  res.json({ 
    message: 'Rate limiting works!',
    timestamp: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Phase 1 Test Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthReady: '/health/ready',
      healthLive: '/health/live',
      testRateLimit: '/test-rate-limit'
    }
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Phase 1 Test Server démarré !`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponibles :`);
  console.log(`   GET /health - Health check complet`);
  console.log(`   GET /health/ready - Readiness probe`);
  console.log(`   GET /health/live - Liveness probe`);
  console.log(`   GET /test-rate-limit - Test rate limiting`);
  console.log(`\n✅ Prêt pour les tests!\n`);
});

export default app;
