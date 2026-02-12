/**
 * Utilitaire pour charger et traiter les templates d'emails
 */

import type { EmailTemplate, EmailTemplateVariables } from '@clubmanager/types';

export class TemplateLoader {
  /**
   * Charge un template HTML depuis le dossier templates/emails
   */
  async loadTemplate(
    templateName: string,
    variables: EmailTemplateVariables,
    fallbackSubject?: string
  ): Promise<EmailTemplate> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const templatePath = this.resolveTemplatePath(__dirname, path, fs, templateName);

      console.log('📁 [TemplateLoader] Template trouvé:', templatePath);

      let templateContent = fs.readFileSync(templatePath, 'utf8');

      templateContent = this.replaceVariables(templateContent, variables);

      const subject = this.extractSubject(templateContent, variables, fallbackSubject);

      console.log('📧 [TemplateLoader] Template chargé:', {
        templateName,
        subject,
        contentLength: templateContent.length,
      });

      return { subject, htmlContent: templateContent };
    } catch (error) {
      console.error('❌ [TemplateLoader] Erreur chargement template:', error);
      throw error;
    }
  }

  /**
   * Résout le chemin du template
   */
  private resolveTemplatePath(
    dirname: string,
    path: any,
    fs: any,
    templateName: string
  ): string {
    const possiblePaths = [
      path.join(dirname, '../../templates/emails', `${templateName}.html`),
      path.join(dirname, '../../../src/templates/emails', `${templateName}.html`),
      path.join(process.cwd(), 'src/templates/emails', `${templateName}.html`),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        return templatePath;
      }
    }

    throw new Error(
      `Template ${templateName} non trouvé dans les emplacements: ${possiblePaths.join(', ')}`
    );
  }

  /**
   * Remplace les variables dans le contenu du template
   */
  private replaceVariables(content: string, variables: EmailTemplateVariables): string {
    let processedContent = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(value || ''));
    });

    return processedContent;
  }

  /**
   * Extrait le sujet du template HTML
   */
  private extractSubject(
    content: string,
    variables: EmailTemplateVariables,
    fallbackSubject?: string
  ): string {
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);

    if (!titleMatch) {
      return fallbackSubject || `Message de ${variables.clubName || 'Club Manager'}`;
    }

    let subject = titleMatch[1].trim();

    // Remplacer les variables dans le sujet
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value || ''));
    });

    return subject;
  }
}

export const templateLoader = new TemplateLoader();
