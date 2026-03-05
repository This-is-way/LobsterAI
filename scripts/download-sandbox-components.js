/**
 * Download sandbox components for bundling
 * This script downloads QEMU runtime and VM images to include in the app package
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SANDBOX_RESOURCES_DIR = path.join(__dirname, '..', 'sandbox-resources');

// Download URLs for different platforms
const DOWNLOADS = {
  'darwin-arm64': {
    runtime: 'https://ydhardwarecommon.nosdn.127.net/f23e57c47e4356c31b5bf1012f10a53e.gz',
    image: 'https://ydhardwarecommon.nosdn.127.net/59d9df60ce9c0463c54e3043af60cb10.qcow2',
    runtimeFile: 'qemu-system-aarch64.gz',
    imageFile: 'alpine-arm64.qcow2',
  },
  'darwin-amd64': {
    runtime: 'https://ydhardwarecommon.nosdn.127.net/20a9f6a34705ca51dbd9fb8c7695c1e5.gz',
    image: 'https://ydhardwarebusiness.nosdn.127.net/3ba0e509b60aaf8b5a969618d1b4e170.qcow2',
    runtimeFile: 'qemu-system-x86_64.gz',
    imageFile: 'alpine-amd64.qcow2',
  },
  'win32-amd64': {
    runtime: 'https://ydhardwarecommon.nosdn.127.net/02a016878c4457bd819e11e55b7b6884.gz',
    image: 'https://ydhardwarebusiness.nosdn.127.net/3ba0e509b60aaf8b5a969618d1b4e170.qcow2',
    runtimeFile: 'qemu-system-x86_64.exe.gz',
    imageFile: 'alpine-amd64.qcow2',
  },
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    console.log(`📥 Downloading: ${url}`);
    console.log(`   To: ${destPath}`);

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      let downloadedBytes = 0;
      let totalBytes = parseInt(response.headers['content-length'], 10);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
          const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n   ✅ Download complete');
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadPlatform(platform) {
  const config = DOWNLOADS[platform];
  if (!config) {
    console.log(`⚠️  Platform ${platform} not supported, skipping...`);
    return;
  }

  const platformDir = path.join(SANDBOX_RESOURCES_DIR, platform);
  fs.mkdirSync(platformDir, { recursive: true });

  console.log(`\n📦 Processing platform: ${platform}`);

  // Download runtime
  const runtimePath = path.join(platformDir, config.runtimeFile);
  if (!fs.existsSync(runtimePath)) {
    await downloadFile(config.runtime, runtimePath);
  } else {
    console.log(`✅ Runtime already exists: ${runtimePath}`);
  }

  // Download image
  const imagePath = path.join(platformDir, config.imageFile);
  if (!fs.existsSync(imagePath)) {
    await downloadFile(config.image, imagePath);
  } else {
    console.log(`✅ Image already exists: ${imagePath}`);
  }

  console.log(`✅ Platform ${platform} complete!`);
}

async function main() {
  console.log('🎯 Downloading sandbox components for bundling...\n');

  // Detect current platform
  const platform = process.platform;
  const arch = process.arch;
  const platformKey = `${platform}-${arch}`;

  console.log(`🖥️  Current platform: ${platformKey}`);
  console.log(`📋 Available platforms: ${Object.keys(DOWNLOADS).join(', ')}`);

  // Download for current platform
  await downloadPlatform(platformKey);

  // Also download darwin-arm64 if on macOS (for universal builds)
  if (platform === 'darwin' && arch === 'arm64') {
    console.log('\n🔄 Also downloading darwin-amd64 for universal builds...');
    await downloadPlatform('darwin-amd64');
  }

  console.log('\n✅ All downloads complete!');
  console.log(`📁 Files saved to: ${SANDBOX_RESOURCES_DIR}`);
  console.log('\n📦 These files will be bundled with the application.');
  console.log('💡 Users won\'t need to download sandbox components separately.');
}

main().catch(console.error);
