/**
 * Template Loader - Charge et valide les templates d'emails HTML
 *
 * Améliorations v2.1 :
 * - Validation des variables manquantes
 * - Preview mode (sans envoi)
 * - Meilleure gestion d'erreurs
 * - Cache des templates pour performance
 * - Support des templates partiels/composants ({{> partial}})
 */

import type { EmailTemplate, EmailTemplateVariables } from "@clubmanager/types";

export interface TemplateValidationResult {
  isValid: boolean;
  missingVariables: string[];
  unusedVariables: string[];
}

export class TemplateLoader {
  private templateCache: Map<string, string> = new Map();
  private partialsCache: Map<string, string> = new Map();
  private cacheEnabled: boolean = process.env.NODE_ENV === "production";

  /**
   * Charge un template HTML depuis le dossier templates/emails
   */
  async loadTemplate(
    templateName: string,
    variables: EmailTemplateVariables,
    fallbackSubject?: string,
  ): Promise<EmailTemplate> {
    try {
      console.log(`📁 [TemplateLoader] Chargement template: ${templateName}`);

      let templateContent = await this.readTemplateFile(templateName);

      // Charger et injecter les partiels ({{> partialName}})
      templateContent = await this.injectPartials(templateContent);

      // Validation des variables avant remplacement
      const validation = this.validateVariables(templateContent, variables);
      if (validation.missingVariables.length > 0) {
        console.warn(
          `⚠️ [TemplateLoader] Variables manquantes dans ${templateName}:`,
          validation.missingVariables,
        );
      }

      if (validation.unusedVariables.length > 0) {
        console.warn(
          `⚠️ [TemplateLoader] Variables inutilisées dans ${templateName}:`,
          validation.unusedVariables,
        );
      }

      // Remplacement des variables
      templateContent = this.replaceVariables(templateContent, variables);

      // Vérification finale : il ne doit plus rester de {{variables}}
      const remainingVars = this.findUnreplacedVariables(templateContent);
      if (remainingVars.length > 0) {
        console.error(
          `❌ [TemplateLoader] Variables non remplacées dans ${templateName}:`,
          remainingVars,
        );
      }

      const subject = this.extractSubject(
        templateContent,
        variables,
        fallbackSubject,
      );

      console.log("✅ [TemplateLoader] Template chargé:", {
        templateName,
        subject,
        contentLength: templateContent.length,
        missingVars: validation.missingVariables.length,
        unreplacedVars: remainingVars.length,
      });

      return { subject, htmlContent: templateContent };
    } catch (error: any) {
      console.error(
        `❌ [TemplateLoader] Erreur chargement template ${templateName}:`,
        error,
      );
      throw new Error(
        `Template "${templateName}" non trouvé ou invalide: ${error.message}`,
      );
    }
  }

  /**
   * Preview d'un template sans l'envoyer (utile pour tests/debug)
   */
  async previewTemplate(
    templateName: string,
    variables: EmailTemplateVariables,
  ): Promise<{
    subject: string;
    html: string;
    validation: TemplateValidationResult;
  }> {
    const template = await this.loadTemplate(templateName, variables);
    const templateContent = await this.readTemplateFile(templateName);
    const validation = this.validateVariables(templateContent, variables);

    return {
      subject: template.subject,
      html: template.htmlContent,
      validation,
    };
  }

  /**
   * Liste tous les templates disponibles
   */
  async listAvailableTemplates(): Promise<string[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const templatesDir = this.resolveTemplatesDirectory(__dirname, path, fs);
      const files = fs.readdirSync(templatesDir);

      return files
        .filter((f) => f.endsWith(".html"))
        .map((f) => f.replace(".html", ""))
        .sort();
    } catch (error) {
      console.error("❌ [TemplateLoader] Erreur listage templates:", error);
      return [];
    }
  }

  /**
   * Valide qu'un template existe
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      await this.readTemplateFile(templateName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Charge un partial depuis le dossier _partials
   */
  async loadPartial(partialName: string): Promise<string> {
    // Vérifier le cache
    if (this.cacheEnabled && this.partialsCache.has(partialName)) {
      return this.partialsCache.get(partialName)!;
    }

    try {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const partialPath = this.resolvePartialPath(
        __dirname,
        path,
        fs,
        partialName,
      );

      const content = fs.readFileSync(partialPath, "utf8");

      // Mettre en cache
      if (this.cacheEnabled) {
        this.partialsCache.set(partialName, content);
      }

      return content;
    } catch (error: any) {
      console.warn(
        `⚠️ [TemplateLoader] Partial "${partialName}" non trouvé, ignoré`,
      );
      return `<!-- Partial ${partialName} non trouvé -->`;
    }
  }

  /**
   * Injecte les partiels dans le template
   */
  private async injectPartials(content: string): Promise<string> {
    // Regex pour détecter {{> partialName}}
    const partialRegex = /\{\{>\s*(\w+)\s*\}\}/g;
    const matches = [...content.matchAll(partialRegex)];

    if (matches.length === 0) {
      return content;
    }

    let processedContent = content;

    // Charger et remplacer chaque partial
    for (const match of matches) {
      const partialName = match[1];
      const partialContent = await this.loadPartial(partialName);
      const regex = new RegExp(`\\{\\{>\\s*${partialName}\\s*\\}\\}`, "g");
      processedContent = processedContent.replace(regex, partialContent);
    }

    return processedContent;
  }

  /**
   * Résout le chemin d'un partial
   */
  private resolvePartialPath(
    dirname: string,
    path: any,
    fs: any,
    partialName: string,
  ): string {
    const possiblePaths = [
      path.join(
        dirname,
        "../../../resources/templates/emails/_partials",
        `${partialName}.html`,
      ),
      path.join(
        process.cwd(),
        "resources/templates/emails/_partials",
        `${partialName}.html`,
      ),
      path.join(
        process.cwd(),
        "api/resources/templates/emails/_partials",
        `${partialName}.html`,
      ),
    ];

    for (const partialPath of possiblePaths) {
      if (fs.existsSync(partialPath)) {
        return partialPath;
      }
    }

    throw new Error(`Partial "${partialName}.html" non trouvé dans _partials/`);
  }

  /**
   * Lit le fichier template (avec cache)
   */
  private async readTemplateFile(templateName: string): Promise<string> {
    // Vérifier le cache
    if (this.cacheEnabled && this.templateCache.has(templateName)) {
      console.log(
        `📦 [TemplateLoader] Template ${templateName} chargé depuis le cache`,
      );
      return this.templateCache.get(templateName)!;
    }

    const fs = await import("fs");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templatePath = this.resolveTemplatePath(
      __dirname,
      path,
      fs,
      templateName,
    );
    const content = fs.readFileSync(templatePath, "utf8");

    // Mettre en cache
    if (this.cacheEnabled) {
      this.templateCache.set(templateName, content);
    }

    return content;
  }

  /**
   * Résout le répertoire des templates
   */
  private resolveTemplatesDirectory(
    dirname: string,
    path: any,
    fs: any,
  ): string {
    const possibleDirs = [
      path.join(dirname, "../../../resources/templates/emails"),
      path.join(process.cwd(), "resources/templates/emails"),
      path.join(process.cwd(), "api/resources/templates/emails"),
    ];

    for (const dir of possibleDirs) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }

    throw new Error(
      `Répertoire templates non trouvé. Chemins testés: ${possibleDirs.join(", ")}`,
    );
  }

  /**
   * Résout le chemin complet d'un template
   */
  private resolveTemplatePath(
    dirname: string,
    path: any,
    fs: any,
    templateName: string,
  ): string {
    const possiblePaths = [
      path.join(
        dirname,
        "../../../resources/templates/emails",
        `${templateName}.html`,
      ),
      path.join(
        process.cwd(),
        "resources/templates/emails",
        `${templateName}.html`,
      ),
      path.join(
        process.cwd(),
        "api/resources/templates/emails",
        `${templateName}.html`,
      ),
    ];

    for (const templatePath of possiblePaths) {
      if (fs.existsSync(templatePath)) {
        return templatePath;
      }
    }

    throw new Error(
      `Template "${templateName}.html" non trouvé. Chemins testés: ${possiblePaths.join(", ")}`,
    );
  }

  /**
   * Valide les variables (détecte les manquantes et inutilisées)
   */
  private validateVariables(
    templateContent: string,
    variables: EmailTemplateVariables,
  ): TemplateValidationResult {
    // Variables requises dans le template
    const requiredVars = this.extractRequiredVariables(templateContent);

    // Variables fournies
    const providedVars = Object.keys(variables);

    // Variables manquantes
    const missingVariables = requiredVars.filter(
      (v) => !providedVars.includes(v),
    );

    // Variables inutilisées (fournies mais pas dans le template)
    const unusedVariables = providedVars.filter(
      (v) => !requiredVars.includes(v),
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      unusedVariables,
    };
  }

  /**
   * Extrait toutes les variables requises depuis le template
   */
  private extractRequiredVariables(content: string): string[] {
    const regex = /{{(\w+)}}/g;
    const matches = [...content.matchAll(regex)];
    const variables = matches.map((m) => m[1]);

    // Dédupliquer
    return [...new Set(variables)];
  }

  /**
   * Trouve les variables non remplacées après processing
   */
  private findUnreplacedVariables(content: string): string[] {
    return this.extractRequiredVariables(content);
  }

  /**
   * Remplace les variables dans le contenu du template
   */
  private replaceVariables(
    content: string,
    variables: EmailTemplateVariables,
  ): string {
    let processedContent = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      const replacement =
        value !== undefined && value !== null ? String(value) : "";
      processedContent = processedContent.replace(regex, replacement);
    });

    return processedContent;
  }

  /**
   * Extrait le sujet du template HTML
   */
  private extractSubject(
    content: string,
    variables: EmailTemplateVariables,
    fallbackSubject?: string,
  ): string {
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);

    if (!titleMatch) {
      return (
        fallbackSubject || `Message de ${variables.clubName || "Club Manager"}`
      );
    }

    let subject = titleMatch[1].trim();

    // Remplacer les variables dans le sujet
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      const replacement =
        value !== undefined && value !== null ? String(value) : "";
      subject = subject.replace(regex, replacement);
    });

    return subject;
  }

  /**
   * Vide le cache des templates (utile en dev)
   */
  clearCache(): void {
    this.templateCache.clear();
    this.partialsCache.clear();
    console.log("🗑️ [TemplateLoader] Cache vidé (templates + partiels)");
  }

  /**
   * Active/désactive le cache
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }
}

export const templateLoader = new TemplateLoader();
