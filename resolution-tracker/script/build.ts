import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildClient() {
  console.log('Building client...');
  await viteBuild({
    configFile: resolve(__dirname, '..', 'vite.config.ts'),
  });
  console.log('✓ Client built successfully');
}

async function buildServer() {
  console.log('Building server...');
  await esbuild({
    entryPoints: [resolve(__dirname, '..', 'server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outfile: resolve(__dirname, '..', 'dist/index.js'),
    packages: 'external',
    minify: false,
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
  });
  
  // Copy shared files
  const distDir = resolve(__dirname, '..', 'dist');
  const sharedSrc = resolve(__dirname, '..', 'shared');
  const sharedDest = resolve(distDir, 'shared');
  
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  cpSync(sharedSrc, sharedDest, { recursive: true });
  console.log('✓ Server built successfully');
}

async function main() {
  try {
    await buildClient();
    await buildServer();
    console.log('\n✓ Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();
