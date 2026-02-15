/**
 * Script d'initialisation des templates d'emails
 *
 * Nouveau système unifié :
 * - Les templates sont maintenant des fichiers HTML dans resources/templates/emails/
 * - Plus de stockage en mémoire ou en base de données
 * - Ce script vérifie que les templates existent et sont valides
 */

import { emailClient } from "../../src/infrastructure/external-services/email/email-client.js";
import { templateLoader } from "../../src/infrastructure/external-services/email/template-loader.js";

async function initializeEmailTemplates() {
  try {
    console.log("🚀 Vérification des templates d'emails...\n");

    // Liste tous les templates disponibles
    const templates = await emailClient.listTemplates();

    if (templates.length === 0) {
      console.error(
        "❌ Aucun template trouvé dans resources/templates/emails/",
      );
      console.log(
        "\n💡 Assurez-vous que les fichiers .html existent dans ce dossier.",
      );
      process.exit(1);
    }

    console.log(`✅ ${templates.length} template(s) trouvé(s) :\n`);

    // Afficher la liste des templates
    templates.forEach((template, index) => {
      console.log(`  ${index + 1}. ${template}.html`);
    });

    console.log("\n🔍 Validation des templates critiques...\n");

    // Templates critiques à valider
    const criticalTemplates = [
      "bienvenue",
      "reset-password",
      "confirmation-commande",
      "bienvenue-abonnement",
      "annulation-abonnement",
    ];

    let allValid = true;

    for (const templateName of criticalTemplates) {
      const exists = await emailClient.templateExists(templateName);

      if (exists) {
        console.log(`  ✅ ${templateName}.html - OK`);

        // Tester le chargement avec des variables de test
        try {
          await templateLoader.previewTemplate(templateName, {
            userName: "Test User",
            clubName: "Club Manager",
            currentYear: new Date().getFullYear().toString(),
            supportEmail: "support@clubmanager.com",
            clubWebsite: "https://clubmanager.com",
          });
        } catch (error: any) {
          console.warn(
            `  ⚠️  ${templateName}.html - Avertissement: ${error.message}`,
          );
        }
      } else {
        console.error(`  ❌ ${templateName}.html - MANQUANT`);
        allValid = false;
      }
    }

    console.log("\n📊 Résumé :");
    console.log(`  - Total: ${templates.length} templates`);
    console.log(
      `  - Critiques: ${criticalTemplates.filter((t) => templates.includes(t)).length}/${criticalTemplates.length}`,
    );

    if (!allValid) {
      console.error("\n❌ Certains templates critiques sont manquants !");
      process.exit(1);
    }

    console.log("\n✅ Tous les templates critiques sont présents et valides !");
    console.log("\n💡 Pour ajouter un nouveau template :");
    console.log(
      "   1. Créez un fichier .html dans resources/templates/emails/",
    );
    console.log("   2. Utilisez {{variable}} pour les variables dynamiques");
    console.log("   3. Testez avec emailClient.previewTemplate()");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Erreur lors de la vérification:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeEmailTemplates();
}

export { initializeEmailTemplates };
