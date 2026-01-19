import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

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

    // Check for Docker build flags
    const args = process.argv.slice(2);
    
    if (args.includes('--docker')) {
      await buildDockerImage();
    }
    
    if (args.includes('--push-to-ghcr')) {
      const token = args[args.indexOf('--push-to-ghcr') + 1];
      const owner = args[args.indexOf('--push-to-ghcr') + 2];
      
      if (!token || !owner) {
        console.error('\n✗ Error: --push-to-ghcr requires GITHUB_TOKEN and GITHUB_OWNER');
        console.log('Usage: npm run build -- --push-to-ghcr YOUR_TOKEN nexaddo');
        console.log('\nOr use npm script: npm run build:push-ghcr nexaddo');
        process.exit(1);
      }
      
      await buildDockerImage();
      await pushToGitHubRegistry(token, owner);
    }
    
    if (args.includes('--push-to-nas')) {
      const nasIP = args[args.indexOf('--push-to-nas') + 1];
      const nasUser = args[args.indexOf('--push-to-nas') + 2] || 'admin';
      
      if (!nasIP) {
        console.error('\n✗ Error: --push-to-nas requires NAS_IP and optional NAS_USER');
        console.log('Usage: npm run build -- --push-to-nas 192.168.1.100 [admin]');
        process.exit(1);
      }
      
      await buildDockerImage();
      await pushDockerToNAS(nasIP, nasUser);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function buildDockerImage() {
  console.log('\n📦 Building Docker image...');
  try {
    execSync('docker build -t resolution-tracker:latest .', {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✓ Docker image built successfully');
  } catch (error) {
    console.error('Docker build failed:', error);
    throw error;
  }
}

async function pushToGitHubRegistry(token: string, owner: string) {
  console.log(`\n🚀 Pushing Docker image to GitHub Container Registry`);
  
  const imageName = 'resolution-tracker';
  const ghcrImage = `ghcr.io/${owner}/${imageName}:latest`;

  try {
    // Step 1: Login to GitHub Container Registry
    console.log('\n1️⃣  Authenticating with GitHub Container Registry...');
    try {
      execSync(`echo "${token}" | docker login ghcr.io -u ${owner} --password-stdin`, {
        stdio: 'pipe',
      });
      console.log('✓ Successfully authenticated with GitHub Container Registry');
    } catch (error) {
      console.error('❌ GitHub authentication failed');
      console.error('   - Verify your GitHub token is valid');
      console.error('   - Token should have write:packages permission');
      throw error;
    }

    // Step 2: Tag image for GHCR
    console.log('\n2️⃣  Tagging image for GitHub Container Registry...');
    execSync(`docker tag resolution-tracker:latest ${ghcrImage}`, {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log(`✓ Image tagged as ${ghcrImage}`);

    // Step 3: Push to GHCR
    console.log('\n3️⃣  Pushing image to GitHub Container Registry...');
    execSync(`docker push ${ghcrImage}`, {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✓ Image pushed successfully');

    // Step 4: Logout
    console.log('\n4️⃣  Logging out from GitHub Container Registry...');
    execSync('docker logout ghcr.io', { stdio: 'pipe' });
    console.log('✓ Logged out');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Docker image successfully pushed to GitHub!');
    console.log('='.repeat(60));
    console.log(`\n📍 Image location:`);
    console.log(`   ${ghcrImage}`);
    console.log(`\n📍 Next steps:`);
    console.log(`   1. View on GitHub: https://github.com/${owner}/packages`);
    console.log(`   2. Pull from any machine:`);
    console.log(`      docker pull ${ghcrImage}`);
    console.log(`   3. Deploy to NAS:`);
    console.log(`      docker run -d -p 5000:5000 ${ghcrImage}`);
  } catch (error) {
    console.error('\n✗ Failed to push Docker image to GitHub Container Registry');
    console.error('Troubleshooting:');
    console.error('  - Verify GITHUB_TOKEN is a valid Personal Access Token');
    console.error('  - Token must have repo and write:packages scopes');
    console.error('  - Verify GitHub username (owner) is correct');
    console.error('  - Docker must be running');
    throw error;
  }
}

async function pushDockerToNAS(nasIP: string, nasUser: string) {
  console.log(`\n🚀 Pushing Docker image to NAS (${nasUser}@${nasIP})`);
  
  const imageName = 'resolution-tracker:latest';
  const tarFile = 'resolution-tracker.tar';
  const nasPath = '/volume1/docker/';

  try {
    // Step 1: Save Docker image
    console.log('\n1️⃣  Saving Docker image to tar file...');
    execSync(`docker save ${imageName} -o ${tarFile}`, {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log(`✓ Image saved to ${tarFile}`);

    // Step 2: Transfer to NAS
    console.log('\n2️⃣  Transferring tar file to NAS...');
    execSync(
      `scp ${tarFile} ${nasUser}@${nasIP}:${nasPath}`,
      {
        cwd: resolve(__dirname, '..'),
        stdio: 'inherit',
      }
    );
    console.log('✓ Image transferred to NAS');

    // Step 3: Load image on NAS
    console.log('\n3️⃣  Loading image on NAS...');
    execSync(
      `ssh ${nasUser}@${nasIP} "cd ${nasPath} && sudo docker load -i ${tarFile} && rm ${tarFile}"`,
      { stdio: 'inherit' }
    );
    console.log('✓ Image loaded on NAS');

    // Step 4: Cleanup local tar file
    console.log('\n4️⃣  Cleaning up local files...');
    execSync(`rm ${tarFile}`, {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✓ Cleanup complete');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Docker image successfully pushed to NAS!');
    console.log('='.repeat(60));
    console.log(`\n📍 Next steps:`);
    console.log(`   1. SSH to NAS: ssh ${nasUser}@${nasIP}`);
    console.log(`   2. Navigate: cd /volume1/docker/resolution-tracker`);
    console.log(`   3. Deploy: docker compose --env-file .env.production up -d --build`);
  } catch (error) {
    console.error('\n✗ Failed to push Docker image to NAS');
    console.error('Troubleshooting:');
    console.error('  - Verify NAS IP address is correct');
    console.error('  - Ensure SSH access is enabled on NAS');
    console.error('  - Check Docker is installed on NAS');
    throw error;
  }
}

main();
