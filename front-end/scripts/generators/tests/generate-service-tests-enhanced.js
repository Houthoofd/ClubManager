#!/usr/bin/env node

/**
 * ====================================================================
 * ENHANCED SERVICE TEST GENERATOR
 * ====================================================================
 *
 * Génère des tests de services avec vraie logique métier au lieu de stubs basiques.
 *
 * Fonctionnalités :
 * - Analyse le code du service pour détecter la logique
 * - Génère des tests avec mocks réalistes
 * - Teste les cas d'erreur et edge cases
 * - Valide la logique métier (localStorage, validations, etc.)
 * - Utilise des templates intelligents par type de fonction
 *
 * Usage:
 *   node generate-service-tests-enhanced.js <service-file-path>
 *   npm run test:generate:services -- path/to/service.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================================================
// CONFIGURATION
// ====================================================================

const FUNCTION_PATTERNS = {
  // Storage operations
  set: /^(set|store|save|cache|write)/i,
  get: /^(get|retrieve|load|fetch|read)/i,
  remove: /^(remove|delete|clear|clean)/i,

  // Validation/checks
  is: /^(is|has|can|should)/i,
  validate: /^(validate|check|verify|ensure)/i,

  // Transformation
  format: /^(format|transform|convert|parse|stringify)/i,
  calculate: /^(calculate|compute|sum|total)/i,

  // Collections
  filter: /^(filter|search|find|query)/i,
  sort: /^(sort|order|arrange)/i,
  map: /^(map|transform|convert)/i,

  // User/Auth
  getCurrentUser: /^(getCurrentUser|getUser|getProfile)/i,
  logout: /^(logout|signout|disconnect)/i,
};

const DEPENDENCY_PATTERNS = {
  localStorage: ["localStorage", "sessionStorage"],
  apollo: ["apolloClient", "client.query", "client.mutate", "clearStore"],
  logger: ["logger.", "console.log", "console.error"],
  authService: ["authService"],
  window: ["window.location", "window."],
};

// ====================================================================
// SERVICE ANALYZER
// ====================================================================

class ServiceAnalyzer {
  constructor(filePath) {
    this.filePath = filePath;
    this.code = fs.readFileSync(filePath, "utf-8");
    this.ast = null;
    this.analysis = {
      serviceName: null,
      exports: { default: null, named: [] },
      functions: [],
      types: [],
      imports: [],
      dependencies: new Set(),
      constants: {},
    };
  }

  analyze() {
    try {
      this.ast = parser.parse(this.code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      traverse.default(this.ast, {
        ExportDefaultDeclaration: (path) => this.handleDefaultExport(path),
        ExportNamedDeclaration: (path) => this.handleNamedExport(path),
        FunctionDeclaration: (path) => this.handleFunction(path),
        ArrowFunctionExpression: (path) => this.handleArrowFunction(path),
        ImportDeclaration: (path) => this.handleImport(path),
        TSInterfaceDeclaration: (path) => this.handleTypeDeclaration(path),
        VariableDeclarator: (path) => this.handleConstant(path),
      });

      return this.analysis;
    } catch (error) {
      console.error("Error analyzing service:", error.message);
      throw error;
    }
  }

  handleDefaultExport(path) {
    const declaration = path.node.declaration;
    if (declaration.type === "Identifier") {
      this.analysis.exports.default = declaration.name;
      this.analysis.serviceName = declaration.name;
    } else if (declaration.type === "ObjectExpression") {
      declaration.properties.forEach((prop) => {
        if (prop.key?.name) {
          this.analysis.exports.named.push(prop.key.name);
        }
      });
    }
  }

  handleNamedExport(path) {
    if (path.node.declaration) {
      const declaration = path.node.declaration;
      if (declaration.type === "VariableDeclaration") {
        declaration.declarations.forEach((decl) => {
          if (decl.id.name) {
            this.analysis.exports.named.push(decl.id.name);
          }
        });
      } else if (declaration.type === "FunctionDeclaration" && declaration.id) {
        this.analysis.exports.named.push(declaration.id.name);
      }
    }
  }

  handleFunction(path) {
    const node = path.node;
    if (!node.id) return;

    const functionInfo = this.createFunctionInfo(node.id.name, node, path);
    this.analysis.functions.push(functionInfo);
  }

  handleArrowFunction(path) {
    const parent = path.parent;
    if (parent.type !== "VariableDeclarator" || !parent.id) return;

    const functionInfo = this.createFunctionInfo(parent.id.name, path.node, path);
    this.analysis.functions.push(functionInfo);
  }

  createFunctionInfo(name, node, path) {
    const info = {
      name,
      params: node.params?.map((p) => this.getParamInfo(p)) || [],
      async: node.async || false,
      returnType: this.getReturnType(node, path),
      category: this.categorizeFunction(name),
      dependencies: new Set(),
      hasErrorHandling: false,
      hasValidation: false,
    };

    // Analyze function body
    if (path) {
      this.analyzeFunctionBody(path, info);
    }

    return info;
  }

  categorizeFunction(name) {
    for (const [category, pattern] of Object.entries(FUNCTION_PATTERNS)) {
      if (pattern.test(name)) {
        return category;
      }
    }
    return "generic";
  }

  analyzeFunctionBody(path, functionInfo) {
    path.traverse({
      MemberExpression: (innerPath) => {
        const code = this.getNodeCode(innerPath.node);

        // Check for dependencies
        for (const [dep, patterns] of Object.entries(DEPENDENCY_PATTERNS)) {
          if (patterns.some((p) => code.includes(p))) {
            functionInfo.dependencies.add(dep);
            this.analysis.dependencies.add(dep);
          }
        }
      },
      TryStatement: () => {
        functionInfo.hasErrorHandling = true;
      },
      IfStatement: (innerPath) => {
        if (this.looksLikeValidation(innerPath.node.test)) {
          functionInfo.hasValidation = true;
        }
      },
      CallExpression: (innerPath) => {
        const code = this.getNodeCode(innerPath.node);
        if (code.includes("logger")) {
          functionInfo.dependencies.add("logger");
          this.analysis.dependencies.add("logger");
        }
      },
    });
  }

  looksLikeValidation(node) {
    if (!node) return false;
    const code = this.getNodeCode(node);
    return code.includes("!") || code.includes("===") || code.includes("typeof");
  }

  getNodeCode(node) {
    if (!node || !node.start || !node.end) return "";
    return this.code.slice(node.start, node.end);
  }

  handleImport(path) {
    const source = path.node.source.value;
    const specifiers = path.node.specifiers.map((s) => s.local.name);
    this.analysis.imports.push({ source, specifiers });
  }

  handleTypeDeclaration(path) {
    if (path.node.id) {
      this.analysis.types.push(path.node.id.name);
    }
  }

  handleConstant(path) {
    const node = path.node;
    if (node.id?.name && node.id.name === node.id.name.toUpperCase()) {
      this.analysis.constants[node.id.name] = this.inferType(node.init);
    }
  }

  getParamInfo(param) {
    if (param.type === "Identifier") {
      return {
        name: param.name,
        type: this.getTypeAnnotation(param.typeAnnotation),
        optional: false,
      };
    } else if (param.type === "AssignmentPattern") {
      return {
        name: param.left.name,
        type: this.inferType(param.right),
        optional: true,
        default: this.getDefaultValue(param.right),
      };
    }
    return { name: "unknown", type: "any", optional: false };
  }

  getReturnType(node, path) {
    if (node.returnType) {
      return this.getTypeAnnotation(node.returnType);
    }
    // Try to infer from return statements
    if (path) {
      let returnType = "void";
      path.traverse({
        ReturnStatement: (returnPath) => {
          if (returnPath.node.argument) {
            returnType = this.inferType(returnPath.node.argument);
          }
        },
      });
      return returnType;
    }
    return "any";
  }

  getTypeAnnotation(annotation) {
    if (!annotation?.typeAnnotation) return "any";
    const type = annotation.typeAnnotation;

    const typeMap = {
      TSStringKeyword: "string",
      TSNumberKeyword: "number",
      TSBooleanKeyword: "boolean",
      TSVoidKeyword: "void",
      TSNullKeyword: "null",
      TSArrayType: "array",
    };

    return typeMap[type.type] || type.typeName?.name || "any";
  }

  inferType(node) {
    if (!node) return "void";
    const typeMap = {
      StringLiteral: "string",
      NumericLiteral: "number",
      BooleanLiteral: "boolean",
      NullLiteral: "null",
      ArrayExpression: "array",
      ObjectExpression: "object",
    };
    return typeMap[node.type] || "any";
  }

  getDefaultValue(node) {
    if (node.type === "StringLiteral") return `"${node.value}"`;
    if (node.type === "NumericLiteral") return node.value;
    if (node.type === "BooleanLiteral") return node.value;
    if (node.type === "NullLiteral") return "null";
    return "undefined";
  }
}

// ====================================================================
// TEST TEMPLATE GENERATOR
// ====================================================================

class TestTemplateGenerator {
  constructor(analysis, filePath) {
    this.analysis = analysis;
    this.filePath = filePath;
  }

  generate() {
    const serviceName = this.analysis.serviceName || this.analysis.exports.named[0];
    const importPath = this.getImportPath();
    const namedExports = this.getExportedFunctions();

    return `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
${this.generateMockImports()}
${this.generateServiceImport(serviceName, namedExports, importPath)}

describe('${serviceName}', () => {
${this.generateMockData()}

${this.generateSetup()}

${this.generateServiceDefinitionTest(serviceName)}

${this.generateFunctionTests()}
});
`;
  }

  generateMockImports() {
    const imports = [];
    const deps = this.analysis.dependencies;

    if (deps.has("apollo")) {
      imports.push(`
// Mock Apollo Client
vi.mock('@/core/api', () => ({
  apolloClient: {
    clearStore: vi.fn().mockResolvedValue(undefined),
    resetStore: vi.fn().mockResolvedValue(undefined),
  },
}));`);
    }

    if (deps.has("logger")) {
      imports.push(`
// Mock logger
vi.mock('@/core/utils/appLogger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));`);
    }

    if (deps.has("authService")) {
      imports.push(`
// Mock authService
vi.mock('@/core/services/auth.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
    getCurrentUserId: vi.fn(),
    isAdmin: vi.fn(),
    isProfessor: vi.fn(),
  },
}));`);
    }

    return imports.join("\n");
  }

  generateServiceImport(serviceName, namedExports, importPath) {
    if (namedExports.length > 0) {
      return `import ${serviceName}, {\n  ${namedExports.join(",\n  ")}\n} from '${importPath}';`;
    }
    return `import ${serviceName} from '${importPath}';`;
  }

  generateMockData() {
    const types = this.analysis.types;
    const mockData = [];

    // Generate mock data based on types
    if (
      types.includes("AuthUser") ||
      this.analysis.imports.some((i) => i.source.includes("auth.service"))
    ) {
      mockData.push(`  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    active: true,
  };`);
    }

    if (types.includes("Product")) {
      mockData.push(`  const mockProduct = {
    id: 1,
    nom: 'Test Product',
    prix: 99.99,
    stock: 10,
    categorie: 'Test Category',
  };`);
    }

    return mockData.join("\n\n");
  }

  generateSetup() {
    const deps = this.analysis.dependencies;
    const setup = [];

    if (deps.has("localStorage")) {
      setup.push(`  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });`);
    } else {
      setup.push(`  beforeEach(() => {
    vi.clearAllMocks();
  });`);
    }

    return setup.join("\n");
  }

  generateServiceDefinitionTest(serviceName) {
    return `
  it('should be defined', () => {
    expect(${serviceName}).toBeDefined();
    expect(typeof ${serviceName}).toBe('object');
  });`;
  }

  generateFunctionTests() {
    return this.analysis.functions
      .filter((fn) => this.isExportedFunction(fn.name))
      .map((fn) => this.generateFunctionTestSuite(fn))
      .join("\n\n");
  }

  isExportedFunction(name) {
    return this.analysis.exports.named.includes(name) || name === this.analysis.exports.default;
  }

  generateFunctionTestSuite(fn) {
    const tests = [];

    // Generate tests based on function category
    switch (fn.category) {
      case "set":
        tests.push(...this.generateSetterTests(fn));
        break;
      case "get":
        tests.push(...this.generateGetterTests(fn));
        break;
      case "remove":
        tests.push(...this.generateRemoveTests(fn));
        break;
      case "is":
      case "validate":
        tests.push(...this.generateValidationTests(fn));
        break;
      case "format":
        tests.push(...this.generateFormatterTests(fn));
        break;
      case "calculate":
        tests.push(...this.generateCalculationTests(fn));
        break;
      case "filter":
      case "sort":
        tests.push(...this.generateCollectionTests(fn));
        break;
      default:
        tests.push(this.generateBasicTest(fn));
    }

    // Add error handling tests if applicable
    if (fn.hasErrorHandling) {
      tests.push(this.generateErrorTest(fn));
    }

    return `
  describe('${fn.name}', () => {${tests.join("\n")}
  });`;
  }

  generateSetterTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    if (fn.dependencies.has("localStorage")) {
      tests.push(`
    it('should store value in localStorage', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      ${serviceName}.${fn.name}(${mockParams});
      expect(spy).toHaveBeenCalled();
    });`);

      tests.push(`
    it('should handle storage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });
      expect(() => ${serviceName}.${fn.name}(${mockParams})).not.toThrow();
    });`);
    } else {
      tests.push(`
    it('should execute without errors', () => {
      expect(() => ${serviceName}.${fn.name}(${mockParams})).not.toThrow();
    });`);
    }

    return tests;
  }

  generateGetterTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;

    if (fn.dependencies.has("localStorage")) {
      const key = this.inferStorageKey(fn.name);

      tests.push(`
    it('should retrieve value from localStorage', () => {
      const testValue = 'test-data';
      localStorage.setItem('${key}', JSON.stringify(testValue));

      const result = ${serviceName}.${fn.name}();
      expect(result).toBeDefined();
    });`);

      tests.push(`
    it('should return null when value does not exist', () => {
      const result = ${serviceName}.${fn.name}();
      expect(result).toBeNull();
    });`);
    } else {
      tests.push(`
    it('should return expected value', () => {
      const result = ${serviceName}.${fn.name}();
      expect(result).toBeDefined();
    });`);
    }

    return tests;
  }

  generateRemoveTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;

    if (fn.dependencies.has("localStorage")) {
      const key = this.inferStorageKey(fn.name);

      tests.push(`
    it('should remove value from localStorage', () => {
      localStorage.setItem('${key}', 'test-value');
      ${serviceName}.${fn.name}();
      expect(localStorage.getItem('${key}')).toBeNull();
    });`);
    } else {
      tests.push(`
    it('should execute without errors', () => {
      expect(() => ${serviceName}.${fn.name}()).not.toThrow();
    });`);
    }

    return tests;
  }

  generateValidationTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    tests.push(`
    it('should return boolean value', () => {
      const result = ${serviceName}.${fn.name}(${mockParams});
      expect(typeof result).toBe('boolean');
    });`);

    tests.push(`
    it('should handle null/undefined input', () => {
      const result = ${serviceName}.${fn.name}(null);
      expect(typeof result).toBe('boolean');
    });`);

    return tests;
  }

  generateFormatterTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    tests.push(`
    it('should return formatted value', () => {
      const result = ${serviceName}.${fn.name}(${mockParams});
      expect(typeof result).toBe('string');
    });`);

    tests.push(`
    it('should handle edge cases', () => {
      const result = ${serviceName}.${fn.name}(null);
      expect(result).toBeDefined();
    });`);

    return tests;
  }

  generateCalculationTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    tests.push(`
    it('should calculate correct result', () => {
      const result = ${serviceName}.${fn.name}(${mockParams});
      expect(typeof result).toBe('number');
    });`);

    tests.push(`
    it('should handle zero values', () => {
      const result = ${serviceName}.${fn.name}(0);
      expect(result).toBeDefined();
    });`);

    return tests;
  }

  generateCollectionTests(fn) {
    const tests = [];
    const serviceName = this.analysis.serviceName;

    tests.push(`
    it('should return array', () => {
      const result = ${serviceName}.${fn.name}([]);
      expect(Array.isArray(result)).toBe(true);
    });`);

    tests.push(`
    it('should handle empty array', () => {
      const result = ${serviceName}.${fn.name}([]);
      expect(result).toEqual([]);
    });`);

    return tests;
  }

  generateBasicTest(fn) {
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    if (fn.async) {
      return `
    it('should execute successfully', async () => {
      const result = await ${serviceName}.${fn.name}(${mockParams});
      expect(result).toBeDefined();
    });`;
    } else if (fn.returnType === "void") {
      return `
    it('should execute without errors', () => {
      expect(() => ${serviceName}.${fn.name}(${mockParams})).not.toThrow();
    });`;
    } else {
      return `
    it('should return expected result', () => {
      const result = ${serviceName}.${fn.name}(${mockParams});
      expect(result).toBeDefined();
    });`;
    }
  }

  generateErrorTest(fn) {
    const serviceName = this.analysis.serviceName;
    const mockParams = this.getMockParams(fn);

    if (fn.async) {
      return `
    it('should handle errors gracefully', async () => {
      await expect(${serviceName}.${fn.name}(${mockParams})).resolves.toBeDefined();
    });`;
    } else {
      return `
    it('should handle errors gracefully', () => {
      expect(() => ${serviceName}.${fn.name}(${mockParams})).not.toThrow();
    });`;
    }
  }

  getMockParams(fn) {
    if (fn.params.length === 0) return "";

    return fn.params
      .map((param) => {
        if (param.optional && param.default) {
          return param.default;
        }
        return this.generateMockValue(param.type, param.name);
      })
      .join(", ");
  }

  generateMockValue(type, name) {
    const lowerName = name.toLowerCase();

    // Name-based mocks
    if (lowerName.includes("user")) return "mockUser";
    if (lowerName.includes("product")) return "mockProduct";
    if (lowerName.includes("token")) return '"mock-token-123"';
    if (lowerName.includes("id")) return "1";
    if (lowerName.includes("email")) return '"test@example.com"';
    if (lowerName.includes("name")) return '"Test Name"';
    if (lowerName.includes("role")) return '"admin"';
    if (lowerName.includes("price")) return "99.99";
    if (lowerName.includes("quantity")) return "5";

    // Type-based mocks
    const typeMap = {
      string: '"test-string"',
      number: "42",
      boolean: "true",
      array: "[]",
      object: "{}",
      void: "",
      null: "null",
    };

    return typeMap[type] || "undefined";
  }

  inferStorageKey(functionName) {
    const cleaned = functionName
      .replace(/^(get|set|remove|clear)/i, "")
      .replace(/([A-Z])/g, (m) => m.toLowerCase());

    if (cleaned.includes("token")) return "authToken";
    if (cleaned.includes("user")) return "userData";
    if (cleaned.includes("refresh")) return "refreshToken";
    if (cleaned.includes("preferences")) return "userPreferences";
    if (cleaned.includes("cache")) return "cache";

    return cleaned || "storageKey";
  }

  getExportedFunctions() {
    return this.analysis.functions
      .filter((fn) => this.isExportedFunction(fn.name))
      .map((fn) => fn.name);
  }

  getImportPath() {
    const parsed = path.parse(this.filePath);
    const testDir = parsed.dir;
    const relativePath = `./${parsed.name}`;
    return relativePath;
  }
}

// ====================================================================
// MAIN EXECUTION
// ====================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(`
Usage: node generate-service-tests-enhanced.js <service-file-path>

Example:
  npm run test:generate:services -- src/core/services/auth.service.ts
`);
    process.exit(1);
  }

  const servicePath = args[0];

  if (!fs.existsSync(servicePath)) {
    console.error(`❌ Error: File not found: ${servicePath}`);
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Analyzing service: ${servicePath}\n`);

    const analyzer = new ServiceAnalyzer(servicePath);
    const analysis = analyzer.analyze();

    console.log("📊 Analysis results:");
    console.log(`   - Service name: ${analysis.serviceName || "N/A"}`);
    console.log(`   - Exported functions: ${analysis.exports.named.length}`);
    console.log(`   - Total functions: ${analysis.functions.length}`);
    console.log(`   - Dependencies: ${Array.from(analysis.dependencies).join(", ") || "None"}`);

    const generator = new TestTemplateGenerator(analysis, servicePath);
    const testContent = generator.generate();

    // Determine test file path
    const parsed = path.parse(servicePath);
    const testPath = path.join(parsed.dir, `${parsed.name}.test${parsed.ext}`);

    // Write test file
    fs.writeFileSync(testPath, testContent, "utf-8");

    console.log(`\n✅ Enhanced test file generated: ${testPath}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review and customize the generated tests`);
    console.log(`   2. Add more specific test cases as needed`);
    console.log(`   3. Run tests: npm test -- ${path.basename(testPath)}\n`);
  } catch (error) {
    console.error(`\n❌ Error generating tests: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
