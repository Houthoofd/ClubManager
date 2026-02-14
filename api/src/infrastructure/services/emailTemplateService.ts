/**
 * Email Template Service
 *
 * Service pour gérer les templates d'emails stockés en mémoire.
 * Permet de charger, traiter et gérer les templates avec variables dynamiques.
 */

export interface EmailTemplate {
  id: number;
  title: string;
  subject: string;
  content: string;
  variables?: string[];
  active: boolean;
}

export interface ProcessedTemplate {
  subject: string;
  html: string;
}

/**
 * Templates par défaut stockés en mémoire
 */
const defaultTemplates: Map<string, EmailTemplate> = new Map([
  [
    "bienvenue",
    {
      id: 1,
      title: "bienvenue",
      subject: "Bienvenue sur Club Manager",
      content: `
        <h2>👋 Bienvenue {{userName}} !</h2>
        <p>Nous sommes ravis de vous accueillir sur Club Manager.</p>
        <p>Votre compte a été créé avec succès.</p>
      `,
      variables: ["userName"],
      active: true,
    },
  ],
  [
    "confirmation_commande",
    {
      id: 2,
      title: "confirmation_commande",
      subject: "Confirmation de votre commande #{{numeroCommande}}",
      content: `
        <h2>✅ Commande confirmée</h2>
        <p>Bonjour {{userName}},</p>
        <p>Nous avons bien reçu votre commande #{{numeroCommande}}.</p>
        <p><strong>Date :</strong> {{dateCommande}}</p>
        <p><strong>Statut :</strong> {{statutCommande}}</p>
        <p><strong>Articles :</strong> {{nbArticles}}</p>
        <p><strong>Total :</strong> {{totalCommande}}</p>
      `,
      variables: [
        "userName",
        "numeroCommande",
        "dateCommande",
        "statutCommande",
        "nbArticles",
        "totalCommande",
      ],
      active: true,
    },
  ],
  [
    "rappel_paiement",
    {
      id: 3,
      title: "rappel_paiement",
      subject: "Rappel : Paiement en attente",
      content: `
        <h2>⏰ Rappel de paiement</h2>
        <p>Bonjour {{userName}},</p>
        <p>Nous vous rappelons qu'un paiement est en attente.</p>
        <p><strong>Montant :</strong> {{montant}}</p>
        <p><strong>Échéance :</strong> {{dateEcheance}}</p>
      `,
      variables: ["userName", "montant", "dateEcheance"],
      active: true,
    },
  ],
  [
    "reset_password",
    {
      id: 4,
      title: "reset_password",
      subject: "Réinitialisation de votre mot de passe",
      content: `
        <h2>🔒 Réinitialisation de mot de passe</h2>
        <p>Bonjour {{userName}},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour continuer :</p>
        <p><a href="{{resetLink}}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expire dans {{expirationTime}}.</p>
        <p><small>Si vous n'avez pas fait cette demande, ignorez cet email.</small></p>
      `,
      variables: ["userName", "resetLink", "expirationTime"],
      active: true,
    },
  ],
  [
    "verification_email",
    {
      id: 5,
      title: "verification_email",
      subject: "Vérifiez votre adresse email",
      content: `
        <h2>📧 Vérification d'email</h2>
        <p>Bonjour {{userName}},</p>
        <p>Pour finaliser votre inscription, merci de vérifier votre adresse email.</p>
        <p>Cliquez sur le lien ci-dessous :</p>
        <p><a href="{{verificationLink}}">Vérifier mon email</a></p>
        <p>Ce lien expire dans {{expirationTime}}.</p>
      `,
      variables: ["userName", "verificationLink", "expirationTime"],
      active: true,
    },
  ],
  [
    "inscription_cours",
    {
      id: 6,
      title: "inscription_cours",
      subject: "Confirmation d'inscription au cours",
      content: `
        <h2>📚 Inscription confirmée</h2>
        <p>Bonjour {{userName}},</p>
        <p>Votre inscription au cours <strong>{{coursNom}}</strong> a été confirmée.</p>
        <p><strong>Date :</strong> {{dateCours}}</p>
        <p><strong>Horaire :</strong> {{horaire}}</p>
        <p><strong>Professeur :</strong> {{professeur}}</p>
      `,
      variables: ["userName", "coursNom", "dateCours", "horaire", "professeur"],
      active: true,
    },
  ],
]);

export class EmailTemplateService {
  private templates: Map<string, EmailTemplate>;

  constructor() {
    this.templates = new Map(defaultTemplates);
  }

  /**
   * Récupère un template par son ID
   */
  async getTemplateById(id: number): Promise<EmailTemplate | null> {
    try {
      for (const template of this.templates.values()) {
        if (template.id === id) {
          return template;
        }
      }

      console.warn(`⚠️ [EmailTemplateService] Template ${id} non trouvé`);
      return null;
    } catch (error: any) {
      console.error("❌ [EmailTemplateService] Erreur getTemplateById:", error);
      return null;
    }
  }

  /**
   * Récupère un template par son titre
   */
  async getTemplateByTitle(title: string): Promise<EmailTemplate | null> {
    try {
      const template = this.templates.get(title);

      if (!template || !template.active) {
        console.warn(
          `⚠️ [EmailTemplateService] Template "${title}" non trouvé ou inactif`,
        );
        return null;
      }

      return template;
    } catch (error: any) {
      console.error(
        "❌ [EmailTemplateService] Erreur getTemplateByTitle:",
        error,
      );
      return null;
    }
  }

  /**
   * Récupère tous les templates actifs
   */
  async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      return Array.from(this.templates.values())
        .filter((t) => t.active)
        .sort((a, b) => a.title.localeCompare(b.title));
    } catch (error: any) {
      console.error("❌ [EmailTemplateService] Erreur getAllTemplates:", error);
      return [];
    }
  }

  /**
   * Traite un template avec les variables fournies
   */
  processTemplate(
    templateContent: string,
    variables: Record<string, string | number>,
  ): ProcessedTemplate {
    let processedHtml = templateContent;
    let processedSubject = "";

    // Extraction du subject si présent dans le contenu
    const subjectMatch = templateContent.match(/<subject>(.*?)<\/subject>/s);
    if (subjectMatch) {
      processedSubject = subjectMatch[1].trim();
      processedHtml = templateContent.replace(/<subject>.*?<\/subject>/s, "");
    }

    // Remplacement des variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      processedHtml = processedHtml.replace(regex, String(value));
      processedSubject = processedSubject.replace(regex, String(value));
    });

    return {
      subject: processedSubject,
      html: processedHtml,
    };
  }

  /**
   * Ajoute ou met à jour un template
   */
  async upsertTemplate(
    title: string,
    subject: string,
    content: string,
    variables?: string[],
  ): Promise<EmailTemplate> {
    try {
      const existing = this.templates.get(title);
      const id = existing?.id ?? this.templates.size + 1;

      const template: EmailTemplate = {
        id,
        title,
        subject,
        content,
        variables,
        active: true,
      };

      this.templates.set(title, template);

      console.log(
        `✅ [EmailTemplateService] Template "${title}" upsert en mémoire`,
      );

      return template;
    } catch (error: any) {
      console.error("❌ [EmailTemplateService] Erreur upsertTemplate:", error);
      throw error;
    }
  }

  /**
   * Synchronise les templates par défaut (no-op pour store mémoire)
   */
  async syncDefaultTemplates(): Promise<void> {
    console.log(
      "✅ [EmailTemplateService] Templates par défaut déjà chargés en mémoire",
    );
  }

  /**
   * Liste tous les templates (actifs et inactifs)
   */
  async listAllTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Désactive un template
   */
  async deactivateTemplate(title: string): Promise<boolean> {
    const template = this.templates.get(title);
    if (!template) {
      return false;
    }

    template.active = false;
    this.templates.set(title, template);
    return true;
  }

  /**
   * Active un template
   */
  async activateTemplate(title: string): Promise<boolean> {
    const template = this.templates.get(title);
    if (!template) {
      return false;
    }

    template.active = true;
    this.templates.set(title, template);
    return true;
  }
}

// Instance singleton
export const emailTemplateService = new EmailTemplateService();
