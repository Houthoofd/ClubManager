/**
 * Tests pour TemplateLoader
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TemplateLoader } from '../template-loader';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;

  beforeEach(() => {
    loader = new TemplateLoader();
  });

  describe('replaceVariables', () => {
    it('should replace variables in content', () => {
      const content = 'Hello {{name}}, welcome to {{club}}!';
      const variables = { name: 'John', club: 'Club Manager' };

      // Utiliser la méthode privée via réflexion TypeScript
      const result = (loader as any).replaceVariables(content, variables);

      expect(result).toBe('Hello John, welcome to Club Manager!');
    });

    it('should handle missing variables gracefully', () => {
      const content = 'Hello {{name}}!';
      const variables = { club: 'Club Manager' };

      const result = (loader as any).replaceVariables(content, variables);

      expect(result).toBe('Hello !');
    });

    it('should replace multiple occurrences', () => {
      const content = '{{name}} {{name}} {{name}}';
      const variables = { name: 'Test' };

      const result = (loader as any).replaceVariables(content, variables);

      expect(result).toBe('Test Test Test');
    });
  });

  describe('extractSubject', () => {
    it('should extract subject from title tag', () => {
      const content = '<title>Welcome Email</title><body>Content</body>';
      const variables = {};

      const result = (loader as any).extractSubject(content, variables);

      expect(result).toBe('Welcome Email');
    });

    it('should use fallback when no title', () => {
      const content = '<body>Content</body>';
      const variables = { clubName: 'My Club' };
      const fallback = 'Default Subject';

      const result = (loader as any).extractSubject(content, variables, fallback);

      expect(result).toBe('Default Subject');
    });

    it('should replace variables in extracted subject', () => {
      const content = '<title>Welcome {{name}}</title>';
      const variables = { name: 'John' };

      const result = (loader as any).extractSubject(content, variables);

      expect(result).toBe('Welcome John');
    });

    it('should use club name in default subject', () => {
      const content = '<body>No title</body>';
      const variables = { clubName: 'Test Club' };

      const result = (loader as any).extractSubject(content, variables);

      expect(result).toBe('Message de Test Club');
    });
  });

  describe('resolveTemplatePath', () => {
    it('should throw error when template not found', () => {
      const mockPath = {
        join: (...args: string[]) => args.join('/'),
      };
      const mockFs = {
        existsSync: () => false,
      };

      expect(() => {
        (loader as any).resolveTemplatePath(
          '/test/dir',
          mockPath,
          mockFs,
          'non-existent-template'
        );
      }).toThrow('Template non-existent-template non trouvé');
    });
  });
});
