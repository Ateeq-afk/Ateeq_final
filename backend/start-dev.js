import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the TypeScript server with ts-node
const server = spawn('node', [
  '--loader',
  'ts-node/esm',
  '--no-warnings',
  join(__dirname, 'src/index.ts')
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true',
    TS_NODE_PROJECT: join(__dirname, 'tsconfig.json'),
    NODE_ENV: 'development'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle termination
process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});