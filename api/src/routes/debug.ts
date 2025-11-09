import { Router } from 'express';

const router = Router();

// Route de debug pour lister toutes les routes montées
router.get('/routes', (req, res) => {
  const routes: any[] = [];
  
  function extractRoutes(stack: any[], prefix = '') {
    stack.forEach((layer: any) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        routes.push({
          path: prefix + layer.route.path,
          methods: methods,
          name: layer.route.stack[0]?.name || 'anonymous'
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const path = layer.regexp.source
          .replace('\\', '')
          .replace(/\$.*/, '')
          .replace(/\?\?\?\?\$/, '')
          .replace(/^\^/, '');
        extractRoutes(layer.handle.stack, prefix + '/' + path);
      }
    });
  }
  
  extractRoutes((req as any).app._router.stack);
  
  res.json({
    total: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    stripe_routes: routes.filter(r => r.path.includes('stripe')),
    paiements_routes: routes.filter(r => r.path.includes('paiement'))
  });
});

export default router;
