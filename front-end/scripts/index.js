#!/usr/bin/env node

/**
 * ClubManager Frontend Scripts - Entry Point
 *
 * This file redirects to the main CLI menu
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Launch the main menu
const menuPath = join(__dirname, 'cli', 'menu.js');

const child = spawn('node', [menuPath], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (error) => {
  console.error('Error launching menu:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
