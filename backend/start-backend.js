#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting DesiCargo Backend Server...\n');

// Use tsx which handles TypeScript better than ts-node
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    TS_NODE_TRANSPILE_ONLY: 'true'
  },
  cwd: __dirname
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});