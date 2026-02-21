const fs = require('fs');
const path = require('path');

// Read the generated file
const filePath = path.join(__dirname, 'src/core/api/apollo/generated/graphql.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Strategy: Remove all lines that mention Suspense or skipToken
// and remove orphaned closing braces

// Split into lines for easier processing
const lines = content.split('\n');
const filteredLines = [];
let skipBlock = false;
let blockStartPattern = /export function \w+SuspenseQuery/;
let commentPattern = /\/\/ @ts-ignore/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip ts-ignore comments before Suspense functions
  if (commentPattern.test(line) && i + 1 < lines.length && blockStartPattern.test(lines[i + 1])) {
    continue;
  }
  
  // Start skipping at Suspense function declaration
  if (blockStartPattern.test(line)) {
    skipBlock = true;
    continue;
  }
  
  // Stop skipping after the function body ends (closing brace with specific indentation)
  if (skipBlock && /^\s{8}\}$/.test(line)) {
    skipBlock = false;
    continue;
  }
  
  // Skip SuspenseQueryHookResult type exports
  if (/export type \w+SuspenseQueryHookResult/.test(line)) {
    continue;
  }
  
  // Keep the line if we're not in a skip block
  if (!skipBlock) {
    filteredLines.push(line);
  }
}

content = filteredLines.join('\n');

// Write back the fixed content
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed generated GraphQL file - removed Suspense hooks');
