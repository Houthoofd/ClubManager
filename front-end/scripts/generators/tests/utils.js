/**
 * Utility functions for the test generator
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the project root directory
 */
export function getProjectRoot() {
  // From scripts/generators/tests/ we need to go up 3 levels to reach project root
  return path.resolve(__dirname, "../../..");
}

/**
 * Check if a file exists
 */
export function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Create a directory recursively
 */
export function ensureDir(dirPath) {
  if (!dirExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read file content
 */
export function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file content
 */
export function writeFile(filePath, content) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Get all files recursively from a directory
 */
export function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip ignored directories
      if (!config.ignoreDirs.includes(file)) {
        getFilesRecursively(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check if a file should be ignored
 */
export function shouldIgnoreFile(fileName) {
  return config.ignorePatterns.some((pattern) => pattern.test(fileName));
}

/**
 * Get relative path from project root
 */
export function getRelativePath(filePath) {
  return path.relative(getProjectRoot(), filePath);
}

/**
 * Convert file path to test file path
 */
export function getTestFilePath(sourceFilePath, fileType) {
  const projectRoot = getProjectRoot();
  const relativePath = path.relative(projectRoot, sourceFilePath);
  const parsedPath = path.parse(relativePath);

  // Determine the feature/module directory
  let featureDir;
  if (relativePath.startsWith("src/features/")) {
    // Extract feature name (e.g., src/features/users/hooks/useUser.ts -> users)
    const parts = relativePath.split(path.sep);
    featureDir = path.join(projectRoot, "src", "features", parts[2]);
  } else if (relativePath.startsWith("src/shared/")) {
    featureDir = path.join(projectRoot, "src", "shared");
  } else if (relativePath.startsWith("src/core/")) {
    featureDir = path.join(projectRoot, "src", "core");
  } else {
    // Fallback to parent directory
    featureDir = parsedPath.dir;
  }

  // Get test subdirectory based on file type
  const typeConfig = config.fileTypes[fileType];
  const subdir = typeConfig?.subdir || "misc";

  // Construct test file path
  const testDir = path.join(featureDir, config.testDirName, subdir);
  const testFileName = config.naming.testFile(parsedPath.name, parsedPath.ext);

  return path.join(testDir, testFileName);
}

/**
 * Extract exports from a file
 */
export function extractExports(content) {
  const exports = {
    default: null,
    named: [],
    all: [],
  };

  // Extract default export
  const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
  if (defaultExportMatch) {
    exports.default = defaultExportMatch[1];
    exports.all.push(defaultExportMatch[1]);
  }

  // Extract named exports
  const namedExportMatches = content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
  for (const match of namedExportMatches) {
    exports.named.push(match[1]);
    exports.all.push(match[1]);
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
    exports.named.push(...names);
    exports.all.push(...names);
  }

  return exports;
}

/**
 * Colorize text for console output
 */
export function colorize(text, color) {
  if (!config.colors[color]) {
    return text;
  }
  return `${config.colors[color]}${text}${config.colors.reset}`;
}

/**
 * Log with color
 */
export function log(message, color = null) {
  console.log(color ? colorize(message, color) : message);
}

/**
 * Log success message
 */
export function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

/**
 * Log error message
 */
export function logError(message) {
  log(`✗ ${message}`, "red");
}

/**
 * Log warning message
 */
export function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

/**
 * Log info message
 */
export function logInfo(message) {
  log(`ℹ ${message}`, "blue");
}

/**
 * Convert to PascalCase
 */
export function toPascalCase(str) {
  return str
    .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase());
}

/**
 * Convert to camelCase
 */
export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExt(filePath) {
  return path.parse(filePath).name;
}

/**
 * Get file extension
 */
export function getFileExtension(filePath) {
  return path.parse(filePath).ext;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Create a progress bar
 */
export function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${percentage}% (${current}/${total})`;
}

/**
 * Pluralize a word
 */
export function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Get import path for test file
 */
export function getImportPath(testFilePath, sourceFilePath) {
  const testDir = path.dirname(testFilePath);
  const relativePath = path.relative(testDir, sourceFilePath);

  // Remove extension and normalize path separators
  const importPath = relativePath.replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "");

  // Ensure it starts with ./ or ../
  return importPath.startsWith(".") ? importPath : `./${importPath}`;
}

/**
 * Parse command line arguments
 */
export function parseArgs(args) {
  const parsed = {
    _: [],
    flags: {},
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      // Check if next arg is a value or another flag
      if (nextArg && !nextArg.startsWith("-")) {
        parsed.flags[key] = nextArg;
        i++; // Skip next arg
      } else {
        parsed.flags[key] = true;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      parsed.flags[key] = true;
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

/**
 * Ask user for confirmation (simple readline)
 */
export async function confirm(question) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Get statistics from generated tests
 */
export function getTestStats(generatedTests) {
  return {
    total: generatedTests.length,
    byType: generatedTests.reduce((acc, test) => {
      acc[test.type] = (acc[test.type] || 0) + 1;
      return acc;
    }, {}),
    totalLines: generatedTests.reduce((sum, test) => sum + (test.lines || 0), 0),
  };
}

export default {
  getProjectRoot,
  fileExists,
  dirExists,
  ensureDir,
  readFile,
  writeFile,
  getFilesRecursively,
  shouldIgnoreFile,
  getRelativePath,
  getTestFilePath,
  extractExports,
  colorize,
  log,
  logSuccess,
  logError,
  logWarning,
  logInfo,
  toPascalCase,
  toCamelCase,
  getFileNameWithoutExt,
  getFileExtension,
  formatFileSize,
  createProgressBar,
  pluralize,
  truncate,
  getImportPath,
  parseArgs,
  confirm,
  getTestStats,
};
