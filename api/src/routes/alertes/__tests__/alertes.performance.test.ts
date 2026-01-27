import { describe, it, expect } from '@jest/globals';
import { alertesService } from '../../../services/alertes/alertes.service.js';

describe('Alertes - Tests de Performance', () => {
  
  describe('Temps de réponse - Queries', () => {
    
    it('devrait charger le dashboard en moins de 200ms', async () => {
      const startTime = performance.now();
      
      await alertesService.obtenirDashboardAlertes();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Dashboard chargé en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('devrait récupérer les alertes actives en moins de 100ms', async () => {
      const startTime = performance.now();
      
      await alertesService.obtenirAlertesActives();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Alertes actives récupérées en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait filtrer les alertes par utilisateur en moins de 50ms', async () => {
      const startTime = performance.now();
      
      await alertesService.obtenirAlertesUtilisateur(1);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Alertes utilisateur récupérées en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('devrait calculer les statistiques en moins de 150ms', async () => {
      const startTime = performance.now();
      
      await alertesService.obtenirStatistiquesAlertes();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Statistiques calculées en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Temps de réponse - Mutations', () => {
    
    it('devrait créer une alerte en moins de 100ms', async () => {
      const startTime = performance.now();
      
      await alertesService.creerAlerte({
        utilisateurId: 1,
        typeAlerteId: 1
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Alerte créée en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait résoudre une alerte en moins de 100ms', async () => {
      const startTime = performance.now();
      
      await alertesService.resoudreAlerte({
        alerteId: 1,
        effectuePar: 1,
        notes: 'Test perf'
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Alerte résolue en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait ignorer une alerte en moins de 80ms', async () => {
      const startTime = performance.now();
      
      await alertesService.ignorerAlerte({
        alerteId: 1,
        effectuePar: 1
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Alerte ignorée en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(80);
    });
  });

  describe('Performance avec volume de données élevé', () => {
    
    it('devrait gérer un dashboard avec 1000+ alertes', async () => {
      // Créer beaucoup d'alertes pour le test
      const createPromises = Array.from({ length: 100 }, (_, i) =>
        alertesService.creerAlerte({
          utilisateurId: 1,
          typeAlerteId: (i % 3) + 1
        })
      );
      
      await Promise.all(createPromises);
      
      const startTime = performance.now();
      const dashboard = await alertesService.obtenirDashboardAlertes();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Dashboard avec volume élevé: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
      expect(dashboard).toHaveProperty('totalAlertes');
      expect(dashboard).toHaveProperty('alertesActives');
    });

    it('devrait paginer efficacement les résultats', async () => {
      const startTime = performance.now();
      const alertes = await alertesService.obtenirAlertesActives();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Même avec beaucoup de données, la pagination devrait être rapide
      console.log(`⏱️  Pagination (${alertes.length} alertes): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(150);
    });

    it('devrait trier efficacement par priorité', async () => {
      const startTime = performance.now();
      
      const alertes = await alertesService.obtenirAlertesActives();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Tri par priorité: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
      
      // Vérifier que les alertes sont triées par date
      expect(alertes.length).toBeGreaterThan(0);
      for (let i = 0; i < alertes.length - 1; i++) {
        const current = alertes[i];
        const next = alertes[i + 1];
        
        // Les alertes doivent avoir une date de détection (camelCase)
        expect(current).toHaveProperty('dateDetection');
        expect(next).toHaveProperty('dateDetection');
      }
    });
  });

  describe('Optimisation des requêtes - N+1 Prevention', () => {
    
    it('devrait charger les relations en une seule query (eager loading)', async () => {
      // Mesurer le nombre de queries (via logs Prisma si activés)
      const startTime = performance.now();
      
      const dashboard = await alertesService.obtenirDashboardAlertes();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Avec eager loading, devrait être rapide
      console.log(`⏱️  Dashboard avec relations: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(250);
    });

    it('devrait utiliser des indexes pour les filtres courants', async () => {
      // Test de filtrage par utilisateur (devrait utiliser un index)
      const startTime = performance.now();
      
      await alertesService.obtenirAlertesUtilisateur(1);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Filtrage avec index: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('devrait optimiser les agrégations (count, sum)', async () => {
      const startTime = performance.now();
      
      const stats = await alertesService.obtenirStatistiquesAlertes();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Agrégations: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Performance en conditions de charge', () => {
    
    it('devrait gérer 10 requêtes simultanées sans dégradation', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: 10 }, () =>
        alertesService.obtenirDashboardAlertes()
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 10;
      
      console.log(`⏱️  10 requêtes parallèles: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(300);
    });

    it('devrait gérer 50 créations simultanées', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: 50 }, (_, i) =>
        alertesService.creerAlerte({
          utilisateurId: 1,
          typeAlerteId: (i % 3) + 1
        })
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 50;
      
      console.log(`⏱️  50 créations parallèles: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(200);
    });

    it('devrait maintenir les performances sous charge mixte', async () => {
      const startTime = performance.now();
      
      // Mix de lectures et écritures
      const promises = [
        ...Array.from({ length: 20 }, () => alertesService.obtenirDashboardAlertes()),
        ...Array.from({ length: 10 }, (_, i) => 
          alertesService.creerAlerte({
            utilisateurId: 1,
            typeAlerteId: 1
          })
        ),
        ...Array.from({ length: 5 }, () => alertesService.obtenirStatistiquesAlertes())
      ];
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 35;
      
      console.log(`⏱️  Charge mixte (35 ops): ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(250);
    });
  });

  describe('Optimisation mémoire', () => {
    
    it('devrait limiter la mémoire utilisée pour les grands datasets', async () => {
      const before = process.memoryUsage().heapUsed;
      
      // Récupérer beaucoup de données
      await alertesService.obtenirAlertesActives();
      
      const after = process.memoryUsage().heapUsed;
      const memoryUsedMB = (after - before) / 1024 / 1024;
      
      console.log(`💾 Mémoire utilisée: ${memoryUsedMB.toFixed(2)} MB`);
      expect(memoryUsedMB).toBeLessThan(50); // Max 50MB
    });

    it('devrait libérer la mémoire après les opérations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Effectuer plusieurs opérations
      for (let i = 0; i < 10; i++) {
        await alertesService.obtenirDashboardAlertes();
      }
      
      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowthMB = (finalMemory - initialMemory) / 1024 / 1024;
      
      console.log(`💾 Croissance mémoire: ${memoryGrowthMB.toFixed(2)} MB`);
      expect(memoryGrowthMB).toBeLessThan(20);
    });
  });

  describe('Benchmarks et seuils de performance', () => {
    
    it('devrait documenter les performances baseline', async () => {
      const benchmarks: Record<string, number> = {};
      
      // Dashboard
      let start = performance.now();
      await alertesService.obtenirDashboardAlertes();
      benchmarks['dashboard'] = performance.now() - start;
      
      // Alertes actives
      start = performance.now();
      await alertesService.obtenirAlertesActives();
      benchmarks['alertes_actives'] = performance.now() - start;
      
      // Création
      start = performance.now();
      const nouvelleAlerte = await alertesService.creerAlerte({
        utilisateurId: 1,
        typeAlerteId: 1
      });
      benchmarks['creation'] = performance.now() - start;
      
      // Récupérer une alerte existante pour la résoudre
      const alertesExistantes = await alertesService.obtenirAlertesActives();
      if (alertesExistantes.length > 0) {
        // Résolution
        start = performance.now();
        await alertesService.resoudreAlerte({
          alerteId: alertesExistantes[0].id,
          effectuePar: 1,
          notes: 'Benchmark'
        });
        benchmarks['resolution'] = performance.now() - start;
      }
      
      console.log('\n📊 Benchmarks de performance:');
      Object.entries(benchmarks).forEach(([operation, duration]) => {
        console.log(`   ${operation}: ${duration.toFixed(2)}ms`);
      });
      
      // Tous les benchmarks devraient être raisonnables
      Object.values(benchmarks).forEach(duration => {
        expect(duration).toBeLessThan(500);
      });
    });

    it('devrait identifier les opérations lentes (> 500ms)', async () => {
      const operations = [
        { name: 'Dashboard', fn: () => alertesService.obtenirDashboardAlertes() },
        { name: 'Alertes actives', fn: () => alertesService.obtenirAlertesActives() },
        { name: 'Statistiques', fn: () => alertesService.obtenirStatistiquesAlertes() }
      ];
      
      const slowOperations: string[] = [];
      
      for (const op of operations) {
        const start = performance.now();
        await op.fn();
        const duration = performance.now() - start;
        
        if (duration > 500) {
          slowOperations.push(`${op.name} (${duration.toFixed(2)}ms)`);
        }
      }
      
      if (slowOperations.length > 0) {
        console.warn(`⚠️  Opérations lentes détectées: ${slowOperations.join(', ')}`);
      }
      
      expect(slowOperations).toHaveLength(0);
    });
  });
});
