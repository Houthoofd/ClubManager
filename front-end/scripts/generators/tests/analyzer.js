/**
 * File analyzer - Detects file types and extracts metadata
 */

import path from 'path';
import config from './config.js';
import { readFile, getFileNameWithoutExt } from './utils.js';

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
    props: extractProps(fileContent),
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
 * Detect the type of file (hook, component, util, store, page)
 */
function detectFileType(fileName, content) {
  // Check for store
  if (config.patterns.store.test(fileName)) {
    return 'store';
  }

  // Check for page
  if (config.patterns.page.test(fileName)) {
    return 'page';
  }

  // Check for hook
  if (config.patterns.hook.test(fileName)) {
    // If hook uses GraphQL, mark as hookGraphQL
    if (detectGraphQL(content)) {
      return 'hookGraphQL';
    }
    return 'hook';
  }

  // Check for util/helper/formatter
  if (config.patterns.util.test(fileName)) {
    return 'util';
  }

  // Check for component (must be .tsx and start with capital letter)
  if (config.patterns.component.test(fileName)) {
    // Verify it's actually a component (has JSX/TSX)
    if (hasJSX(content)) {
      return 'component';
    }
  }

  return 'unknown';
}

/**
 * Detect if file uses GraphQL (Apollo Client)
 */
function detectGraphQL(content) {
  return Object.values(config.graphqlPatterns).some((pattern) =>
    pattern.test(content)
  );
}

/**
 * Detect if file uses timers or debounce/throttle
 */
function detectTimers(content) {
  return Object.values(config.timerPatterns).some((pattern) =>
    pattern.test(content)
  );
}

/**
 * Detect if file is a Zustand store
 */
function detectZustand(content) {
  return Object.values(config.zustandPatterns).some((pattern) =>
    pattern.test(content)
  );
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
    /<[A-Z]\w+/,           // <Component
    /<\w+\s+[^>]*>/,       // <div ...>
    /return\s*\(/,         // return (
    /jsx/i,                // jsx in content
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
    /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g
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
    const names = match[1].split(',').map((name) => {
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

    if (source.startsWith('.')) {
      imports.local.push(source);
    } else {
      imports.libraries.push(source);

      // Check for specific libraries
      if (source.includes('@apollo/client')) {
        imports.apollo = true;
      }
      if (source === 'react' || source.startsWith('react/')) {
        imports.react = true;
      }
      if (source === 'zustand') {
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
    complexity.factors.push('GraphQL operations');
  }

  // Timer/debounce adds complexity
  if (analysis.hasTimers) {
    complexity.score += 2;
    complexity.factors.push('Timers/Debounce');
  }

  // Multiple React hooks add complexity
  if (analysis.reactHooks.length > 3) {
    complexity.score += 2;
    complexity.factors.push(`${analysis.reactHooks.length} React hooks`);
  }

  // State management
  if (analysis.reactHooks.includes('useState')) {
    complexity.score += 1;
  }
  if (analysis.reactHooks.includes('useEffect')) {
    complexity.score += 1;
  }

  // Complex logic patterns
  if (/useCallback|useMemo/.test(content)) {
    complexity.score += 1;
    complexity.factors.push('Memoization');
  }

  return complexity;
}

export default {
  analyzeFile,
  analyzeGraphQL,
  analyzeHookComplexity,
};
