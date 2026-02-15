/**
 * Email Builder - Fluent API pour construire et envoyer des emails facilement
 *
 * Fonctionnalités :
 * - Fluent API chainable
 * - Auto-extraction des données utilisateur
 * - Variables communes auto-injectées
 * - Mode dry-run pour tests
 * - Validation avant envoi
 * - Typage fort des templates
 */

import type {
  EmailSendResult,
  TemplateName,
  TemplateVariables,
  EnrichedEmailRequest,
  DryRunResult,
  UserEmailData,
} from "@clubmanager/types";

import { templateLoader } from "./template-loader.js";
import { variablesPreparator } from "./variables-preparator.js";
import { sendGridSender } from "./sendgrid-sender.js";

export class EmailBuilder<T extends TemplateName = TemplateName> {
  private request: Partial<EnrichedEmailRequest<T>> = {};
  private isDryRun: boolean = false;
  private userData?: UserEmailData;
  private customVariables: Partial<TemplateVariables<T>> = {};

  constructor() {}

  /**
   * Définit le destinataire
   */
  to(email: string): this {
    this.request.to = email;
    return this;
  }

  /**
   * Définit le sujet (optionnel, sera extrait du template si non fourni)
   */
  subject(subject: string): this {
    this.request.subject = subject;
    return this;
  }

  /**
   * Définit le template à utiliser
   */
  template<TName extends TemplateName>(
    templateName: TName,
  ): EmailBuilder<TName> {
    this.request.templateTitle = templateName as any;
    return this as any;
  }

  /**
   * Définit les variables du template (typées selon le template)
   */
  variables(vars: Partial<TemplateVariables<T>>): this {
    this.customVariables = { ...this.customVariables, ...vars };
    return this;
  }

  /**
   * Extrait automatiquement les données d'un utilisateur
   */
  fromUser(user: any): this {
    this.userData = variablesPreparator.fromUser(user);
    this.request.to = this.userData.email;
    this.request.utilisateurId = this.userData.userId;

    // Auto-injecter les variables user dans customVariables
    this.customVariables = {
      ...this.customVariables,
      userName: this.userData.userName,
      firstName: this.userData.firstName,
      lastName: this.userData.lastName,
      email: this.userData.email,
    } as any;

    return this;
  }

  /**
   * Définit l'ID utilisateur pour la sauvegarde en base
   */
  userId(id: number): this {
    this.request.utilisateurId = id;
    return this;
  }

  /**
   * Active/désactive la sauvegarde en base de données
   */
  saveToDb(save: boolean = true): this {
    this.request.saveToDb = save;
    return this;
  }

  /**
   * Active le mode dry-run (ne pas envoyer réellement)
   */
  dryRun(enabled: boolean = true): this {
    this.isDryRun = enabled;
    return this;
  }

  /**
   * Construit et envoie l'email
   */
  async send(): Promise<EmailSendResult | DryRunResult> {
    // Validation
    this.validate();

    // Préparer les variables finales (normaliser pour éviter undefined)
    const normalizedVars = variablesPreparator.normalize(
      this.customVariables as any,
    );
    const finalVariables = variablesPreparator.prepare(normalizedVars);

    // Filtrer les valeurs undefined pour avoir un Record<string, string> strict
    const strictVariables: Record<string, string> = Object.entries(
      finalVariables,
    )
      .filter(([_, value]) => value !== undefined)
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value!;
          return acc;
        },
        {} as Record<string, string>,
      );

    // Mode dry-run : retourner un preview sans envoyer
    if (this.isDryRun) {
      return await this.executeDryRun(strictVariables);
    }

    // Envoi réel
    return await this.executeRealSend(strictVariables);
  }

  /**
   * Valide la requête avant envoi
   */
  private validate(): void {
    if (!this.request.to) {
      throw new Error(
        "Destinataire (to) requis. Utilisez .to() ou .fromUser()",
      );
    }

    if (!this.request.templateTitle && !this.request.message) {
      throw new Error(
        "Template ou message requis. Utilisez .template() ou fournissez un message",
      );
    }
  }

  /**
   * Exécute le dry-run (preview sans envoi)
   */
  private async executeDryRun(
    finalVariables: Record<string, string>,
  ): Promise<DryRunResult> {
    console.log(
      "🔍 [EmailBuilder] Mode DRY-RUN activé - Aucun email ne sera envoyé",
    );

    if (!this.request.templateTitle) {
      throw new Error("Template requis pour le dry-run");
    }

    // Charger et prévisualiser le template
    const preview = await templateLoader.previewTemplate(
      this.request.templateTitle,
      finalVariables,
    );

    return {
      success: true,
      dryRun: true,
      preview: {
        to: this.request.to!,
        subject: preview.subject,
        html: preview.html,
        variables: finalVariables,
      },
      validation: preview.validation,
    };
  }

  /**
   * Exécute l'envoi réel
   */
  private async executeRealSend(
    finalVariables: Record<string, string>,
  ): Promise<EmailSendResult> {
    console.log(`📧 [EmailBuilder] Envoi email à ${this.request.to}`);

    // Si template spécifié, charger le HTML
    let htmlContent = this.request.message || "";
    let subject = this.request.subject || "";

    if (this.request.templateTitle) {
      const { subject: templateSubject, htmlContent: templateHtml } =
        await templateLoader.loadTemplate(
          this.request.templateTitle,
          finalVariables,
          subject,
        );

      subject = subject || templateSubject;
      htmlContent = templateHtml;
    }

    // Envoi via SendGrid
    return await sendGridSender.send(
      this.request.to!,
      subject || "Message de Club Manager",
      htmlContent,
      {
        fallbackOnError: true,
        saveToDb: this.request.saveToDb ?? true,
        utilisateurId: this.request.utilisateurId,
      },
    );
  }

  /**
   * Clone le builder (utile pour réutilisation)
   */
  clone(): EmailBuilder<T> {
    const cloned = new EmailBuilder<T>();
    cloned.request = { ...this.request };
    cloned.isDryRun = this.isDryRun;
    cloned.userData = this.userData;
    cloned.customVariables = { ...this.customVariables };
    return cloned;
  }

  /**
   * Réinitialise le builder
   */
  reset(): this {
    this.request = {};
    this.isDryRun = false;
    this.userData = undefined;
    this.customVariables = {};
    return this;
  }

  /**
   * Retourne la requête construite (sans envoyer)
   */
  build(): EnrichedEmailRequest<T> {
    this.validate();
    return this.request as EnrichedEmailRequest<T>;
  }
}

/**
 * Factory pour créer un nouveau builder
 */
export function createEmailBuilder<
  T extends TemplateName = TemplateName,
>(): EmailBuilder<T> {
  return new EmailBuilder<T>();
}

// Export d'une instance réutilisable
export const emailBuilder = createEmailBuilder();
