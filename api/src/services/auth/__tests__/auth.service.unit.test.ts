/**
 * Tests unitaires du service Auth
 * Vérifie la structure, les exports et l'isolation des modules
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AuthService - Tests Unitaires', () => {
  let authService: any;
  let AuthService: any;

  beforeEach(async () => {
    const module = await import('../auth.service.js');
    AuthService = module.AuthService;
    authService = module.authService;
  });

  describe('Structure du module principal', () => {
    it('devrait exporter la classe AuthService et une instance', () => {
      expect(AuthService).toBeDefined();
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('devrait avoir toutes les méthodes requises', () => {
      // Authentification
      expect(typeof authService.authentifier).toBe('function');
      expect(typeof authService.creerCompte).toBe('function');
      expect(typeof authService.verifierEmail).toBe('function');
      
      // Mots de passe
      expect(typeof authService.changerMotDePasse).toBe('function');
      expect(typeof authService.validerMotDePasse).toBe('function');
      
      // Récupération
      expect(typeof authService.demanderRecuperationMotDePasse).toBe('function');
      expect(typeof authService.verifierTokenRecuperation).toBe('function');
      expect(typeof authService.reinitialiserMotDePasse).toBe('function');
      
      // Sécurité
      expect(typeof authService.obtenirInformationsSecurite).toBe('function');
      expect(typeof authService.obtenirStatistiques).toBe('function');
      
      // Maintenance
      expect(typeof authService.nettoyerTokensExpires).toBe('function');
    });

    it('devrait avoir les méthodes statiques', () => {
      expect(typeof AuthService.genererToken).toBe('function');
      expect(typeof AuthService.hasherMotDePasse).toBe('function');
      expect(typeof AuthService.verifierMotDePasse).toBe('function');
      expect(typeof AuthService.validerEmail).toBe('function');
      expect(typeof AuthService.validerMotDePasse).toBe('function');
    });
  });

  describe('Core modules - Exports individuels', () => {
    it('devrait exporter les fonctions du module authentication', async () => {
      const auth = await import('../core/authentication.js');
      expect(typeof auth.authentifierUtilisateur).toBe('function');
      expect(typeof auth.creerCompteUtilisateur).toBe('function');
      expect(typeof auth.emailExiste).toBe('function');
    });

    it('devrait exporter les fonctions du module password', async () => {
      const password = await import('../core/password.js');
      expect(typeof password.modifierMotDePasse).toBe('function');
      expect(typeof password.validerMotDePasse).toBe('function');
      expect(typeof password.hasherMotDePasse).toBe('function');
      expect(typeof password.verifierMotDePasse).toBe('function');
      expect(typeof password.validerEmail).toBe('function');
    });

    it('devrait exporter les fonctions du module tokens', async () => {
      const tokens = await import('../core/tokens.js');
      expect(typeof tokens.creerTokenRecuperation).toBe('function');
      expect(typeof tokens.verifierTokenRecuperation).toBe('function');
      expect(typeof tokens.reinitialiserMotDePasseAvecToken).toBe('function');
      expect(typeof tokens.nettoyerTokensExpires).toBe('function');
      expect(typeof tokens.genererTokenSecurise).toBe('function');
    });

    it('devrait exporter les fonctions du module security', async () => {
      const security = await import('../core/security.js');
      expect(typeof security.rechercherUtilisateurParEmail).toBe('function');
      expect(typeof security.obtenirInformationsSecurite).toBe('function');
      expect(typeof security.obtenirStatistiquesAuth).toBe('function');
    });
  });

  describe('GraphQL Resolvers - Structure', () => {
    it('devrait avoir la structure correcte des resolvers', async () => {
      const { authResolvers } = await import('../auth.resolvers.js');
      
      expect(authResolvers).toBeDefined();
      expect(authResolvers.Query).toBeDefined();
      expect(authResolvers.Mutation).toBeDefined();
      
      // Queries
      expect(typeof authResolvers.Query.checkEmail).toBe('function');
      expect(typeof authResolvers.Query.securityInfo).toBe('function');
      expect(typeof authResolvers.Query.authStats).toBe('function');
      expect(typeof authResolvers.Query.verifyResetToken).toBe('function');
      
      // Mutations
      expect(typeof authResolvers.Mutation.login).toBe('function');
      expect(typeof authResolvers.Mutation.register).toBe('function');
      expect(typeof authResolvers.Mutation.changePassword).toBe('function');
      expect(typeof authResolvers.Mutation.requestPasswordReset).toBe('function');
      expect(typeof authResolvers.Mutation.resetPassword).toBe('function');
    });

    it('devrait appeler les méthodes du service depuis les resolvers', async () => {
      const { authResolvers } = await import('../auth.resolvers.js');
      
      // Tester un resolver Query
      const emailCheck = await authResolvers.Query.checkEmail(null, { email: 'jean@test.com' });
      expect(emailCheck).toBeDefined();
      expect(emailCheck.email).toBe('jean@test.com');
      
      // Tester un resolver Mutation - stats
      const stats = await authResolvers.Query.authStats();
      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeDefined();
    });
  });

  describe('Isolation et indépendance', () => {
    it('devrait pouvoir importer chaque module core indépendamment', async () => {
      const [auth, password, tokens, security] = await Promise.all([
        import('../core/authentication.js'),
        import('../core/password.js'),
        import('../core/tokens.js'),
        import('../core/security.js'),
      ]);
      
      expect(auth).toBeDefined();
      expect(password).toBeDefined();
      expect(tokens).toBeDefined();
      expect(security).toBeDefined();
    });

    it('devrait maintenir une instance singleton du service', async () => {
      const module1 = await import('../auth.service.js');
      const module2 = await import('../auth.service.js');
      
      expect(module1.authService).toBe(module2.authService);
    });
  });

  describe('Validation des helpers', () => {
    it('devrait valider les emails correctement', async () => {
      const { validerEmail } = await import('../core/password.js');
      
      expect(validerEmail('test@example.com')).toBe(true);
      expect(validerEmail('invalid-email')).toBe(false);
      expect(validerEmail('test@')).toBe(false);
      expect(validerEmail('@example.com')).toBe(false);
    });

    it('devrait valider les mots de passe selon les règles', async () => {
      const { validerMotDePasse } = await import('../core/password.js');
      
      const weak = validerMotDePasse('weak');
      expect(weak.valid).toBe(false);
      expect(weak.errors.length).toBeGreaterThan(0);
      
      const strong = validerMotDePasse('Strong123');
      expect(strong.valid).toBe(true);
      expect(strong.errors.length).toBe(0);
    });

    it('devrait générer des tokens sécurisés', async () => {
      const { genererTokenSecurise } = await import('../core/tokens.js');
      
      const token1 = genererTokenSecurise();
      const token2 = genererTokenSecurise();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2); // Tokens uniques
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });
});
