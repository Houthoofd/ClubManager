/**
 * File analyzer - Detects file types and extracts metadata
 */

import path from "path";
import config from "./config.js";
import { readFile, getFileNameWithoutExt } from "./utils.js";

/**
 * Analyze a source file and determine its type and characteristics
 */
export function analyzeFile(filePath) {
  const fileName = path.basename(filePath);
  const fileContent = readFile(filePath);

  const analysis = {
    filePath,
    fileName,
    name: getFileNameWithoutExt(filePath),
    extension: path.extname(filePath),
    type: null,
    isGraphQL: false,
    hasTimers: false,
    isZustand: false,
    reactHooks: [],
    exports: extractExports(fileContent),
    imports: extractImports(fileContent),
    functions: extractFunctions(fileContent),
    functionParams: extractFunctionParams(fileContent),
    props: extractProps(fileContent),
    propsDetails: extractPropsDetails(fileContent),
    hasI18n: detectI18n(fileContent),
    hasRouting: detectRouting(fileContent),
    hasFormHandling: detectFormHandling(fileContent),
    returnTypes: extractReturnTypes(fileContent),
  };

  // Determine file type
  analysis.type = detectFileType(fileName, fileContent);

  // Check for GraphQL usage
  analysis.isGraphQL = detectGraphQL(fileContent);

  // Check for timer usage (debounce, throttle, setTimeout, etc.)
  analysis.hasTimers = detectTimers(fileContent);

  // Check if it's a Zustand store
  analysis.isZustand = detectZustand(fileContent);

  // Detect React hooks used
  analysis.reactHooks = detectReactHooks(fileContent);

  return analysis;
}

/**
 * Detect the type of file (hook, component, util, store, page, service)
 */
function detectFileType(fileName, content) {
  // Check for service (must be before util check)
  if (config.patterns.service.test(fileName)) {
    return "service";
  }

  // Check for store
  if (config.patterns.store.test(fileName)) {
    return "store";
  }

  // Check for page
  if (config.patterns.page.test(fileName)) {
    return "page";
  }

  // Check for hook
  if (config.patterns.hook.test(fileName)) {
    // If hook uses GraphQL, mark as hookGraphQL
    if (detectGraphQL(content)) {
      return "hookGraphQL";
    }
    return "hook";
  }

  // Check for util/helper/formatter
  if (config.patterns.util.test(fileName)) {
    return "util";
  }

  // Check for component (must be .tsx and start with capital letter)
  if (config.patterns.component.test(fileName)) {
    // Verify it's actually a component (has JSX/TSX)
    if (hasJSX(content)) {
      return "component";
    }
  }

  return "unknown";
}

/**
 * Detect if file uses GraphQL (Apollo Client)
 */
function detectGraphQL(content) {
  return Object.values(config.graphqlPatterns).some((pattern) => pattern.test(content));
}

/**
 * Detect if file uses timers or debounce/throttle
 */
function detectTimers(content) {
  return Object.values(config.timerPatterns).some((pattern) => pattern.test(content));
}

/**
 * Detect if file is a Zustand store
 */
function detectZustand(content) {
  return Object.values(config.zustandPatterns).some((pattern) => pattern.test(content));
}

/**
 * Detect React hooks used in the file
 */
function detectReactHooks(content) {
  const hooks = [];
  Object.entries(config.reactPatterns).forEach(([hookName, pattern]) => {
    if (pattern.test(content)) {
      hooks.push(hookName);
    }
  });
  return hooks;
}

/**
 * Check if file contains JSX/TSX syntax
 */
function hasJSX(content) {
  // Look for JSX patterns
  const jsxPatterns = [
    /<[A-Z]\w+/, // <Component
    /<\w+\s+[^>]*>/, // <div ...>
    /return\s*\(/, // return (
    /jsx/i, // jsx in content
  ];

  return jsxPatterns.some((pattern) => pattern.test(content));
}

/**
 * Extract exports from file content
 */
function extractExports(content) {
  const exports = {
    default: null,
    named: [],
    all: [],
  };

  // Extract default export
  const defaultExportPatterns = [
    /export\s+default\s+(?:function\s+)?(\w+)/,
    /export\s+default\s+(\w+)/,
  ];

  for (const pattern of defaultExportPatterns) {
    const match = content.match(pattern);
    if (match && !exports.default) {
      exports.default = match[1];
      exports.all.push(match[1]);
      break;
    }
  }

  // Extract named exports
  const namedExportMatches = content.matchAll(
    /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g,
  );
  for (const match of namedExportMatches) {
    const name = match[1];
    if (!exports.named.includes(name)) {
      exports.named.push(name);
      exports.all.push(name);
    }
  }

  // Extract from export { ... }
  const exportBlockMatches = content.matchAll(/export\s+\{([^}]+)\}/g);
  for (const match of exportBlockMatches) {
    const names = match[1].split(",").map((name) => {
      const trimmed = name.trim();
      // Handle "name as alias" syntax
      const parts = trimmed.split(/\s+as\s+/);
      return parts[0].trim();
    });
    names.forEach((name) => {
      if (name && !exports.named.includes(name)) {
        exports.named.push(name);
        exports.all.push(name);
      }
    });
  }

  return exports;
}

/**
 * Extract imports from file content
 */
function extractImports(content) {
  const imports = {
    libraries: [],
    local: [],
    apollo: false,
    react: false,
    zustand: false,
  };

  // Extract import statements
  const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    const source = match[1];

    if (source.startsWith(".")) {
      imports.local.push(source);
    } else {
      imports.libraries.push(source);

      // Check for specific libraries
      if (source.includes("@apollo/client")) {
        imports.apollo = true;
      }
      if (source === "react" || source.startsWith("react/")) {
        imports.react = true;
      }
      if (source === "zustand") {
        imports.zustand = true;
      }
    }
  }

  return imports;
}

/**
 * Extract function definitions from file content
 */
function extractFunctions(content) {
  const functions = [];

  // Extract function declarations
  const functionPatterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
    /(?:export\s+)?const\s+(\w+)\s*:\s*.*?=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
  ];

  functionPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const name = match[1];
      if (name && !functions.includes(name)) {
        functions.push(name);
      }
    }
  });

  return functions;
}

/**
 * Extract component props/interface definitions
 */
function extractProps(content) {
  const props = [];

  // Look for Props interfaces or types
  const propsPatterns = [
    /(?:interface|type)\s+(\w+Props)\s*[={]/g,
    /(?:interface|type)\s+(\w+Properties)\s*[={]/g,
  ];

  propsPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const name = match[1];
      if (name && !props.includes(name)) {
        props.push(name);
      }
    }
  });

  return props;
}

/**
 * Extract detailed props information (types, optional, default values)
 */
function extractPropsDetails(content) {
  const propsDetails = [];

  // Match interface/type definitions
  const interfacePattern = /(?:interface|type)\s+(\w+Props)\s*\{([^}]+)\}/gs;
  const matches = content.matchAll(interfacePattern);

  for (const match of matches) {
    const interfaceName = match[1];
    const body = match[2];

    // Extract individual prop definitions
    const propLines = body
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("//"));

    propLines.forEach((line) => {
      const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
      if (propMatch) {
        propsDetails.push({
          interface: interfaceName,
          name: propMatch[1],
          optional: !!propMatch[2],
          type: propMatch[3].trim(),
        });
      }
    });
  }

  return propsDetails;
}

/**
 * Extract function parameters with their types
 */
function extractFunctionParams(content) {
  const paramsMap = {};

  // Match function declarations with parameters
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g,
  ];

  patterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const fnName = match[1];
      const paramsStr = match[2];

      if (paramsStr.trim()) {
        const params = paramsStr
          .split(",")
          .map((param) => {
            const trimmed = param.trim();
            // Handle destructured params, typed params, default values
            const paramMatch = trimmed.match(
              /(?:\{([^}]+)\}|(\w+))(?::\s*([^=]+))?(?:\s*=\s*(.+))?/,
            );

            if (paramMatch) {
              if (paramMatch[1]) {
                // Destructured param
                return {
                  name: `{ ${paramMatch[1].trim()} }`,
                  type: paramMatch[3]?.trim() || "any",
                  hasDefault: !!paramMatch[4],
                  defaultValue: paramMatch[4]?.trim(),
                };
              } else {
                // Regular param
                return {
                  name: paramMatch[2],
                  type: paramMatch[3]?.trim() || "any",
                  hasDefault: !!paramMatch[4],
                  defaultValue: paramMatch[4]?.trim(),
                };
              }
            }
            return null;
          })
          .filter(Boolean);

        paramsMap[fnName] = params;
      }
    }
  });

  return paramsMap;
}

/**
 * Extract return types from functions
 */
function extractReturnTypes(content) {
  const returnTypes = {};

  // Match function return type annotations
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*:\s*([^{]+)\s*\{/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*:\s*([^=]+)\s*=>/g,
  ];

  patterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const fnName = match[1];
      const returnType = match[2].trim();
      returnTypes[fnName] = returnType;
    }
  });

  return returnTypes;
}

/**
 * Detect i18n usage (react-i18next)
 */
function detectI18n(content) {
  const i18nPatterns = [/useTranslation/, /\bt\(['"]/, /i18n\./, /from ['"]react-i18next['"]/];

  return i18nPatterns.some((pattern) => pattern.test(content));
}

/**
 * Detect routing usage (react-router)
 */
function detectRouting(content) {
  const routingPatterns = [
    /useNavigate/,
    /useParams/,
    /useLocation/,
    /useSearchParams/,
    /from ['"]react-router(-dom)?['"]/,
    /<Link\s/,
    /<Navigate\s/,
  ];

  return routingPatterns.some((pattern) => pattern.test(content));
}

/**
 * Detect form handling (react-hook-form, formik, etc.)
 */
function detectFormHandling(content) {
  const formPatterns = [
    /useForm/,
    /Controller/,
    /react-hook-form/,
    /useFormik/,
    /formik/i,
    /<Form\s/,
  ];

  return formPatterns.some((pattern) => pattern.test(content));
}

/**
 * Get detailed GraphQL information
 */
export function analyzeGraphQL(content) {
  const graphqlInfo = {
    hasQuery: false,
    hasMutation: false,
    hasLazyQuery: false,
    hasSubscription: false,
    operations: [],
  };

  // Detect query types
  if (config.graphqlPatterns.useQuery.test(content)) {
    graphqlInfo.hasQuery = true;
  }
  if (config.graphqlPatterns.useMutation.test(content)) {
    graphqlInfo.hasMutation = true;
  }
  if (config.graphqlPatterns.useLazyQuery.test(content)) {
    graphqlInfo.hasLazyQuery = true;
  }
  if (config.graphqlPatterns.useSubscription.test(content)) {
    graphqlInfo.hasSubscription = true;
  }

  // Extract GraphQL operation names
  const gqlMatches = content.matchAll(/gql`[\s\S]*?(?:query|mutation|subscription)\s+(\w+)/g);
  for (const match of gqlMatches) {
    graphqlInfo.operations.push(match[1]);
  }

  return graphqlInfo;
}

/**
 * Analyze hook complexity and characteristics
 */
export function analyzeHookComplexity(content, analysis) {
  const complexity = {
    score: 0,
    factors: [],
  };

  // GraphQL adds complexity
  if (analysis.isGraphQL) {
    complexity.score += 3;
    complexity.factors.push("GraphQL operations");
  }

  // Timer/debounce adds complexity
  if (analysis.hasTimers) {
    complexity.score += 2;
    complexity.factors.push("Timers/Debounce");
  }

  // Multiple React hooks add complexity
  if (analysis.reactHooks.length > 3) {
    complexity.score += 2;
    complexity.factors.push(`${analysis.reactHooks.length} React hooks`);
  }

  // State management
  if (analysis.reactHooks.includes("useState")) {
    complexity.score += 1;
  }
  if (analysis.reactHooks.includes("useEffect")) {
    complexity.score += 1;
  }

  // Complex logic patterns
  if (/useCallback|useMemo/.test(content)) {
    complexity.score += 1;
    complexity.factors.push("Memoization");
  }

  return complexity;
}

/**
 * Generate mock data based on prop type
 */
export function generateMockValue(type) {
  const typeStr = type.toLowerCase();

  if (typeStr.includes("string")) return "'test-string'";
  if (typeStr.includes("number")) return "42";
  if (typeStr.includes("boolean")) return "true";
  if (typeStr.includes("date")) return "new Date()";
  if (typeStr.includes("array") || typeStr.includes("[]")) return "[]";
  if (typeStr.includes("object") || typeStr === "any") return "{}";
  if (typeStr.includes("function") || typeStr.includes("=>")) return "vi.fn()";
  if (typeStr.includes("null")) return "null";
  if (typeStr.includes("undefined")) return "undefined";

  // Custom types
  return "{}";
}

/**
 * Generate default props object from props details
 */
export function generateDefaultProps(propsDetails) {
  if (!propsDetails || propsDetails.length === 0) {
    return "{}";
  }

  const props = propsDetails
    .filter((prop) => !prop.optional)
    .map((prop) => `    ${prop.name}: ${generateMockValue(prop.type)}`)
    .join(",\n");

  return props ? `{\n${props}\n  }` : "{}";
}

export default {
  analyzeFile,
  analyzeGraphQL,
  analyzeHookComplexity,
  generateMockValue,
  generateDefaultProps,
};
