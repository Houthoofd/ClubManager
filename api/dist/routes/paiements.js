import express from 'express';
const router = express.Router();
console.log('🔧 [Paiements] Initialisation du module principal de paiements');
// SOLUTION : Import conditionnel du module modulaire
let moduleIndex = null;
async function loadModuleIndex() {
    if (moduleIndex !== null)
        return moduleIndex;
    try {
        console.log('📦 [Paiements] Tentative de chargement du module modulaire...');
        const indexModule = await import('./paiements/index.js');
        moduleIndex = indexModule.default;
        console.log('✅ [Paiements] Module modulaire chargé avec succès');
        return moduleIndex;
    }
    catch (error) {
        console.warn('⚠️ [Paiements] Module modulaire non disponible, utilisation du mode compatibilité:', error);
        moduleIndex = false; // Marquer comme échoué
        return false;
    }
}
// Route de fallback pour toutes les requêtes
router.use(async (req, res, next) => {
    try {
        const indexRouter = await loadModuleIndex();
        if (indexRouter) {
            // Si le module modulaire est disponible, l'utiliser
            console.log(`🔄 [Paiements] Redirection vers module modulaire: ${req.method} ${req.path}`);
            indexRouter(req, res, next);
        }
        else {
            // Mode compatibilité - routes de base
            if (req.path === '/health') {
                return res.json({
                    status: 'Module paiements en mode compatibilité',
                    timestamp: new Date().toISOString(),
                    mode: 'fallback',
                    error: 'Module modulaire non disponible'
                });
            }
            // Routes de base minimales
            if (req.method === 'GET' && req.path === '/') {
                return res.json({
                    message: 'Service paiements actif (mode compatibilité)',
                    status: 'ok',
                    endpoints: [
                        'GET /paiements/health - Status du service'
                    ]
                });
            }
            // Pour les autres routes, retourner une erreur informative
            res.status(503).json({
                error: 'Service de paiements temporairement indisponible',
                message: 'Le module de paiements modulaire n\'est pas disponible',
                mode: 'fallback',
                suggestion: 'Vérifiez que tous les modules de paiements sont correctement déployés'
            });
        }
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur dans le router principal:', error);
        res.status(500).json({
            error: 'Erreur interne du service de paiements',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});
export default router;
