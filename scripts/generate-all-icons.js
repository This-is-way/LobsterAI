/**
 * Generate all icons from main.png (app icons + tray icons)
 * This is the main entry point for icon generation
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Starting icon generation...\n');

// Generate app icons
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 Generating app icons...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('node scripts/generate-icons-trimmed.js', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ App icons generated\n');
} catch (error) {
  console.error('❌ Failed to generate app icons');
  process.exit(1);
}

// Generate tray icons
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔔 Generating tray icons...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('node scripts/generate-tray-icons-sharp.js', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Tray icons generated\n');
} catch (error) {
  console.error('❌ Failed to generate tray icons');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 All icons generated successfully!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Generated files:');
console.log('  • App icons:   build/icons/');
console.log('  • Tray icons:  resources/tray/');
console.log('  • Logo:        public/logo.png');
