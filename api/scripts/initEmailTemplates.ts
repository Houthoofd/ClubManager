import { emailTemplateService } from '../services/emailTemplateService.js';

async function initializeEmailTemplates() {
  try {
    console.log('🚀 Initialisation des templates d\'emails...');
    
    await emailTemplateService.syncDefaultTemplates();
    
    console.log('✅ Initialisation terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeEmailTemplates();
}

export { initializeEmailTemplates };
