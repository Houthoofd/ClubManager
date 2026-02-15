import { SpamScoreChecker } from './spam-score-checker';
import { EmailValidator } from './email-validator';
import type {
  TemplateTestConfig,
  TemplateTestReport,
  TemplateTestResult,
  TemplateRenderTest,
  TemplateValidationTest,
  TemplateAccessibilityTest,
  TemplatePerformanceTest,
  SpamScoreResult,
} from '@club-manager/types';

/**
 * Template Tester
 *
 * Tests email templates for:
 * - Rendering correctness
 * - Required variables
 * - Link validity
 * - Image optimization
 * - Spam score
 * - Accessibility
 * - Performance
 * - Responsive design
 *
 * @example
 * ```typescript
 * const tester = TemplateTester.getInstance();
 *
 * const report = await tester.testTemplate({
 *   templateId: 'welcome-email',
 *   html: '<html>...</html>',
 *   subject: 'Welcome!',
 *   variables: { name: 'John' },
 *   testRecipient: 'test@example.com'
 * });
 *
 * if (report.overallScore < 80) {
 *   console.error('Template failed quality checks:', report.issues);
 * }
 * ```
 */
export class TemplateTester {
  private static instance: TemplateTester;
  private spamChecker: SpamScoreChecker;
  private emailValidator: EmailValidator;

  private readonly LINK_TIMEOUT_MS = 5000;
  private readonly MAX_IMAGE_SIZE_KB = 200;
  private readonly MAX_HTML_SIZE_KB = 102;
  private readonly MIN_TEXT_TO_IMAGE_RATIO = 0.6;

  private constructor() {
    this.spamChecker = SpamScoreChecker.getInstance();
    this.emailValidator = EmailValidator.getInstance();
  }

  public static getInstance(): TemplateTester {
    if (!TemplateTester.instance) {
      TemplateTester.instance = new TemplateTester();
    }
    return TemplateTester.instance;
  }

  /**
   * Test a complete email template
   */
  public async testTemplate(config: TemplateTestConfig): Promise<TemplateTestReport> {
    const startTime = Date.now();
    const results: TemplateTestResult[] = [];

    try {
      // 1. Render test
      const renderTest = await this.testRendering(config);
      results.push(...renderTest.results);

      // 2. Validation test
      const validationTest = await this.testValidation(config);
      results.push(...validationTest.results);

      // 3. Spam score test
      const spamTest = await this.testSpamScore(config);
      results.push(...spamTest.results);

      // 4. Accessibility test
      const accessibilityTest = await this.testAccessibility(config);
      results.push(...accessibilityTest.results);

      // 5. Performance test
      const performanceTest = await this.testPerformance(config);
      results.push(...performanceTest.results);

      // 6. Links test
      if (config.checkLinks) {
        const linksTest = await this.testLinks(config);
        results.push(...linksTest.results);
      }

      // 7. Images test
      if (config.checkImages) {
        const imagesTest = await this.testImages(config);
        results.push(...imagesTest.results);
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(results);
      const passed = overallScore >= (config.minScore || 80);

      // Aggregate issues
      const issues = results
        .filter((r) => r.severity === 'error' || r.severity === 'warning')
        .map((r) => r.message);

      const warnings = results.filter((r) => r.severity === 'warning').length;
      const errors = results.filter((r) => r.severity === 'error').length;

      return {
        templateId: config.templateId,
        templateName: config.templateName,
        testedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        passed,
        overallScore,
        results,
        summary: {
          total: results.length,
          passed: results.filter((r) => r.passed).length,
          failed: results.filter((r) => !r.passed).length,
          warnings,
          errors,
        },
        issues,
        recommendations: this.generateRecommendations(results),
        metadata: {
          version: config.version,
          environment: config.environment || 'test',
          tester: 'TemplateTester v1.0',
        },
      };
    } catch (error) {
      return {
        templateId: config.templateId,
        templateName: config.templateName,
        testedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        passed: false,
        overallScore: 0,
        results: [
          {
            testName: 'Template Test Execution',
            category: 'execution',
            passed: false,
            score: 0,
            message: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
            severity: 'error',
            details: {},
          },
        ],
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          warnings: 0,
          errors: 1,
        },
        issues: [`Test execution failed: ${error instanceof Error ? error.message : String(error)}`],
        recommendations: ['Fix the template test execution error before proceeding.'],
        metadata: {
          version: config.version,
          environment: config.environment || 'test',
          tester: 'TemplateTester v1.0',
        },
      };
    }
  }

  /**
   * Test template rendering
   */
  private async testRendering(config: TemplateTestConfig): Promise<TemplateRenderTest> {
    const results: TemplateTestResult[] = [];

    // Test 1: HTML structure
    const hasHtml = /<html[^>]*>/i.test(config.html);
    const hasBody = /<body[^>]*>/i.test(config.html);
    const hasHead = /<head[^>]*>/i.test(config.html);

    results.push({
      testName: 'HTML Structure',
      category: 'rendering',
      passed: hasHtml && hasBody && hasHead,
      score: hasHtml && hasBody && hasHead ? 100 : 50,
      message: hasHtml && hasBody && hasHead
        ? 'Valid HTML structure'
        : 'Missing HTML, HEAD, or BODY tags',
      severity: hasHtml && hasBody && hasHead ? 'info' : 'warning',
      details: { hasHtml, hasBody, hasHead },
    });

    // Test 2: Required variables
    const missingVars = this.findMissingVariables(config.html, config.variables || {});
    results.push({
      testName: 'Required Variables',
      category: 'rendering',
      passed: missingVars.length === 0,
      score: missingVars.length === 0 ? 100 : Math.max(0, 100 - missingVars.length * 20),
      message:
        missingVars.length === 0
          ? 'All variables provided'
          : `Missing variables: ${missingVars.join(', ')}`,
      severity: missingVars.length === 0 ? 'info' : 'error',
      details: { missing: missingVars },
    });

    // Test 3: Subject line rendering
    const subjectVars = this.findMissingVariables(config.subject, config.variables || {});
    results.push({
      testName: 'Subject Line',
      category: 'rendering',
      passed: subjectVars.length === 0 && config.subject.length > 0,
      score: subjectVars.length === 0 && config.subject.length > 0 ? 100 : 50,
      message:
        subjectVars.length === 0
          ? 'Subject line valid'
          : `Subject missing variables: ${subjectVars.join(', ')}`,
      severity: subjectVars.length === 0 ? 'info' : 'error',
      details: { subject: config.subject, missing: subjectVars },
    });

    // Test 4: Plain text fallback
    const hasPlainText = config.text && config.text.length > 0;
    results.push({
      testName: 'Plain Text Fallback',
      category: 'rendering',
      passed: hasPlainText,
      score: hasPlainText ? 100 : 70,
      message: hasPlainText ? 'Plain text version provided' : 'No plain text fallback',
      severity: hasPlainText ? 'info' : 'warning',
      details: { hasPlainText },
    });

    return {
      results,
      renderedHtml: this.renderTemplate(config.html, config.variables || {}),
      renderedSubject: this.renderTemplate(config.subject, config.variables || {}),
      renderedText: config.text ? this.renderTemplate(config.text, config.variables || {}) : undefined,
    };
  }

  /**
   * Test template validation
   */
  private async testValidation(config: TemplateTestConfig): Promise<TemplateValidationTest> {
    const results: TemplateTestResult[] = [];

    // Test 1: Unsubscribe link
    const hasUnsubscribe =
      /unsubscribe|opt-out|manage preferences/i.test(config.html) &&
      /<a[^>]*href=["'][^"']*unsubscribe[^"']*["']/i.test(config.html);

    results.push({
      testName: 'Unsubscribe Link',
      category: 'validation',
      passed: hasUnsubscribe,
      score: hasUnsubscribe ? 100 : 0,
      message: hasUnsubscribe ? 'Unsubscribe link present' : 'Missing unsubscribe link (REQUIRED)',
      severity: hasUnsubscribe ? 'info' : 'error',
      details: { hasUnsubscribe },
    });

    // Test 2: Valid recipient
    if (config.testRecipient) {
      const recipientValidation = await this.emailValidator.validateEmail(config.testRecipient);
      results.push({
        testName: 'Test Recipient Email',
        category: 'validation',
        passed: recipientValidation.isValid,
        score: recipientValidation.isValid ? 100 : 0,
        message: recipientValidation.isValid
          ? 'Test recipient email is valid'
          : `Invalid test recipient: ${recipientValidation.errors.join(', ')}`,
        severity: recipientValidation.isValid ? 'info' : 'error',
        details: recipientValidation,
      });
    }

    // Test 3: Broken HTML tags
    const brokenTags = this.findBrokenTags(config.html);
    results.push({
      testName: 'HTML Tag Integrity',
      category: 'validation',
      passed: brokenTags.length === 0,
      score: brokenTags.length === 0 ? 100 : Math.max(0, 100 - brokenTags.length * 10),
      message:
        brokenTags.length === 0 ? 'All HTML tags properly closed' : `${brokenTags.length} broken tags`,
      severity: brokenTags.length === 0 ? 'info' : 'warning',
      details: { brokenTags },
    });

    // Test 4: Email size
    const htmlSizeKB = Buffer.byteLength(config.html, 'utf8') / 1024;
    results.push({
      testName: 'Email Size',
      category: 'validation',
      passed: htmlSizeKB <= this.MAX_HTML_SIZE_KB,
      score: htmlSizeKB <= this.MAX_HTML_SIZE_KB ? 100 : Math.max(0, 100 - (htmlSizeKB - this.MAX_HTML_SIZE_KB) * 2),
      message:
        htmlSizeKB <= this.MAX_HTML_SIZE_KB
          ? `Email size OK (${htmlSizeKB.toFixed(1)} KB)`
          : `Email too large (${htmlSizeKB.toFixed(1)} KB > ${this.MAX_HTML_SIZE_KB} KB)`,
      severity: htmlSizeKB <= this.MAX_HTML_SIZE_KB ? 'info' : 'warning',
      details: { sizeKB: htmlSizeKB, maxKB: this.MAX_HTML_SIZE_KB },
    });

    return { results };
  }

  /**
   * Test spam score
   */
  private async testSpamScore(config: TemplateTestConfig): Promise<{ results: TemplateTestResult[] }> {
    const spamResult = await this.spamChecker.checkSpamScore({
      subject: config.subject,
      html: config.html,
      text: config.text,
      from: config.from || 'test@example.com',
    });

    const passed = spamResult.score <= 3;
    const score = Math.max(0, 100 - spamResult.score * 10);

    return {
      results: [
        {
          testName: 'Spam Score',
          category: 'spam',
          passed,
          score,
          message: `Spam score: ${spamResult.score}/10 (${spamResult.risk})`,
          severity: spamResult.score <= 3 ? 'info' : spamResult.score <= 6 ? 'warning' : 'error',
          details: spamResult,
        },
      ],
    };
  }

  /**
   * Test accessibility
   */
  private async testAccessibility(config: TemplateTestConfig): Promise<TemplateAccessibilityTest> {
    const results: TemplateTestResult[] = [];

    // Test 1: Alt text for images
    const images = config.html.match(/<img[^>]*>/gi) || [];
    const imagesWithoutAlt = images.filter((img) => !/alt=["'][^"']+["']/i.test(img));

    results.push({
      testName: 'Image Alt Text',
      category: 'accessibility',
      passed: imagesWithoutAlt.length === 0,
      score: images.length === 0 ? 100 : Math.max(0, 100 - (imagesWithoutAlt.length / images.length) * 100),
      message:
        imagesWithoutAlt.length === 0
          ? 'All images have alt text'
          : `${imagesWithoutAlt.length}/${images.length} images missing alt text`,
      severity: imagesWithoutAlt.length === 0 ? 'info' : 'warning',
      details: { total: images.length, missing: imagesWithoutAlt.length },
    });

    // Test 2: Semantic HTML
    const hasSemanticTags = /<(header|main|footer|nav|article|section)[^>]*>/i.test(config.html);
    results.push({
      testName: 'Semantic HTML',
      category: 'accessibility',
      passed: hasSemanticTags,
      score: hasSemanticTags ? 100 : 80,
      message: hasSemanticTags ? 'Uses semantic HTML tags' : 'Consider using semantic HTML',
      severity: 'info',
      details: { hasSemanticTags },
    });

    // Test 3: Color contrast (basic check for inline styles)
    const hasColorContrast = this.checkColorContrast(config.html);
    results.push({
      testName: 'Color Contrast',
      category: 'accessibility',
      passed: hasColorContrast.passed,
      score: hasColorContrast.score,
      message: hasColorContrast.message,
      severity: hasColorContrast.passed ? 'info' : 'warning',
      details: hasColorContrast.details,
    });

    return { results };
  }

  /**
   * Test performance
   */
  private async testPerformance(config: TemplateTestConfig): Promise<TemplatePerformanceTest> {
    const results: TemplateTestResult[] = [];

    // Test 1: Inline CSS vs external
    const inlineStyles = (config.html.match(/style=/gi) || []).length;
    const styleBlocks = (config.html.match(/<style[^>]*>/gi) || []).length;

    results.push({
      testName: 'CSS Optimization',
      category: 'performance',
      passed: styleBlocks > 0 || inlineStyles < 50,
      score: styleBlocks > 0 ? 100 : Math.max(0, 100 - inlineStyles),
      message:
        styleBlocks > 0
          ? 'Uses <style> blocks (good)'
          : inlineStyles < 50
          ? 'Moderate inline styles'
          : 'Too many inline styles',
      severity: 'info',
      details: { inlineStyles, styleBlocks },
    });

    // Test 2: Image count
    const imageCount = (config.html.match(/<img[^>]*>/gi) || []).length;
    results.push({
      testName: 'Image Count',
      category: 'performance',
      passed: imageCount <= 10,
      score: imageCount <= 10 ? 100 : Math.max(0, 100 - (imageCount - 10) * 5),
      message:
        imageCount <= 10 ? `${imageCount} images (optimal)` : `${imageCount} images (consider reducing)`,
      severity: imageCount <= 10 ? 'info' : 'warning',
      details: { imageCount },
    });

    // Test 3: Text to image ratio
    const textLength = config.html.replace(/<[^>]*>/g, '').length;
    const ratio = imageCount > 0 ? textLength / imageCount : 1;
    const goodRatio = ratio >= 500; // At least 500 chars per image

    results.push({
      testName: 'Text to Image Ratio',
      category: 'performance',
      passed: goodRatio,
      score: goodRatio ? 100 : Math.min(100, (ratio / 500) * 100),
      message: goodRatio ? 'Good text/image balance' : 'Too many images relative to text',
      severity: goodRatio ? 'info' : 'warning',
      details: { textLength, imageCount, ratio: ratio.toFixed(0) },
    });

    return { results };
  }

  /**
   * Test links
   */
  private async testLinks(config: TemplateTestConfig): Promise<{ results: TemplateTestResult[] }> {
    const results: TemplateTestResult[] = [];
    const links = this.extractLinks(config.html);

    // Check for broken/invalid links
    const invalidLinks = links.filter((link) => !this.isValidUrl(link));

    results.push({
      testName: 'Link Validity',
      category: 'links',
      passed: invalidLinks.length === 0,
      score: links.length === 0 ? 100 : Math.max(0, 100 - (invalidLinks.length / links.length) * 100),
      message:
        invalidLinks.length === 0
          ? `All ${links.length} links are valid`
          : `${invalidLinks.length}/${links.length} invalid links`,
      severity: invalidLinks.length === 0 ? 'info' : 'error',
      details: { total: links.length, invalid: invalidLinks },
    });

    return { results };
  }

  /**
   * Test images
   */
  private async testImages(config: TemplateTestConfig): Promise<{ results: TemplateTestResult[] }> {
    const results: TemplateTestResult[] = [];
    const images = this.extractImages(config.html);

    // Check for valid image URLs
    const invalidImages = images.filter((img) => !this.isValidUrl(img));

    results.push({
      testName: 'Image URLs',
      category: 'images',
      passed: invalidImages.length === 0,
      score: images.length === 0 ? 100 : Math.max(0, 100 - (invalidImages.length / images.length) * 100),
      message:
        invalidImages.length === 0
          ? `All ${images.length} image URLs valid`
          : `${invalidImages.length}/${images.length} invalid image URLs`,
      severity: invalidImages.length === 0 ? 'info' : 'warning',
      details: { total: images.length, invalid: invalidImages },
    });

    return { results };
  }

  // === Helper Methods ===

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    return rendered;
  }

  private findMissingVariables(template: string, variables: Record<string, any>): string[] {
    const variablePattern = /\{\{\s*(\w+)\s*\}\}/g;
    const matches = template.matchAll(variablePattern);
    const missing = new Set<string>();

    for (const match of matches) {
      const varName = match[1];
      if (!(varName in variables)) {
        missing.add(varName);
      }
    }

    return Array.from(missing);
  }

  private findBrokenTags(html: string): string[] {
    const openingTags = html.match(/<(\w+)[^>]*>/g) || [];
    const closingTags = html.match(/<\/(\w+)>/g) || [];

    const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    const broken: string[] = [];

    const tagCounts: Record<string, number> = {};

    for (const tag of openingTags) {
      const tagName = tag.match(/<(\w+)/)?.[1].toLowerCase();
      if (tagName && !selfClosing.includes(tagName) && !tag.endsWith('/>')) {
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      }
    }

    for (const tag of closingTags) {
      const tagName = tag.match(/<\/(\w+)>/)?.[1].toLowerCase();
      if (tagName) {
        tagCounts[tagName] = (tagCounts[tagName] || 0) - 1;
      }
    }

    for (const [tag, count] of Object.entries(tagCounts)) {
      if (count !== 0) {
        broken.push(`<${tag}> (mismatch: ${count})`);
      }
    }

    return broken;
  }

  private extractLinks(html: string): string[] {
    const linkPattern = /<a[^>]+href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  private extractImages(html: string): string[] {
    const imgPattern = /<img[^>]+src=["']([^"']+)["']/gi;
    const images: string[] = [];
    let match;

    while ((match = imgPattern.exec(html)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Check for relative URLs or template variables
      return url.startsWith('/') || url.startsWith('#') || /\{\{.*\}\}/.test(url);
    }
  }

  private checkColorContrast(html: string): {
    passed: boolean;
    score: number;
    message: string;
    details: any;
  } {
    // Basic check: look for light text on light backgrounds or dark on dark
    const lightBg = /background(-color)?:\s*(#?fff|white|#?f{3,6})/i.test(html);
    const lightText = /color:\s*(#?fff|white|#?f{3,6})/i.test(html);
    const darkBg = /background(-color)?:\s*(#?000|black|#?0{3,6})/i.test(html);
    const darkText = /color:\s*(#?000|black|#?0{3,6})/i.test(html);

    const poorContrast = (lightBg && lightText) || (darkBg && darkText);

    return {
      passed: !poorContrast,
      score: poorContrast ? 60 : 100,
      message: poorContrast
        ? 'Potential color contrast issues detected'
        : 'Color contrast appears adequate',
      details: { lightBg, lightText, darkBg, darkText },
    };
  }

  private calculateOverallScore(results: TemplateTestResult[]): number {
    if (results.length === 0) return 0;

    // Weight categories differently
    const weights: Record<string, number> = {
      rendering: 1.5,
      validation: 2.0,
      spam: 2.5,
      accessibility: 1.0,
      performance: 0.8,
      links: 1.2,
      images: 1.0,
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const result of results) {
      const weight = weights[result.category] || 1.0;
      totalWeightedScore += result.score * weight;
      totalWeight += weight;
    }

    return Math.round(totalWeightedScore / totalWeight);
  }

  private generateRecommendations(results: TemplateTestResult[]): string[] {
    const recommendations: string[] = [];
    const failedTests = results.filter((r) => !r.passed);

    // Priority recommendations based on failed tests
    for (const test of failedTests) {
      switch (test.category) {
        case 'spam':
          recommendations.push(
            '🔴 CRITICAL: Reduce spam score by following email best practices',
            '   - Remove excessive capitalization and exclamation marks',
            '   - Reduce promotional language',
            '   - Ensure proper text/image ratio'
          );
          break;
        case 'validation':
          if (test.testName === 'Unsubscribe Link') {
            recommendations.push('🔴 CRITICAL: Add an unsubscribe link (legally required)');
          }
          break;
        case 'rendering':
          recommendations.push('⚠️ Fix template rendering issues to ensure proper display');
          break;
        case 'accessibility':
          recommendations.push('💡 Improve accessibility for better user experience');
          break;
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ Template meets all quality standards!');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Batch test multiple templates
   */
  public async testTemplates(configs: TemplateTestConfig[]): Promise<TemplateTestReport[]> {
    const reports: TemplateTestReport[] = [];

    for (const config of configs) {
      const report = await this.testTemplate(config);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Get statistics from multiple test reports
   */
  public getTestStatistics(reports: TemplateTestReport[]): {
    totalTests: number;
    passed: number;
    failed: number;
    averageScore: number;
    criticalIssues: number;
    commonIssues: string[];
  } {
    const totalTests = reports.length;
    const passed = reports.filter((r) => r.passed).length;
    const failed = totalTests - passed;
    const averageScore = reports.reduce((sum, r) => sum + r.overallScore, 0) / totalTests;
    const criticalIssues = reports.reduce((sum, r) => sum + r.summary.errors, 0);

    // Find common issues
    const issueMap = new Map<string, number>();
    for (const report of reports) {
      for (const issue of report.issues) {
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      }
    }

    const commonIssues = Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      totalTests,
      passed,
      failed,
      averageScore: Math.round(averageScore),
      criticalIssues,
      commonIssues,
    };
  }
}
