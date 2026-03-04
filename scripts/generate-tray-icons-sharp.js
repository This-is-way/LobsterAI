/**
 * Generate tray icons using sharp (no ImageMagick required)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'build', 'icons', 'main.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'resources', 'tray');

async function main() {
  console.log('🎨 Generating tray icons from', SOURCE, '...');

  if (!fs.existsSync(SOURCE)) {
    console.error('❌ Error: Source file not found at', SOURCE);
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load and trim the source image
  console.log('✂️  Trimming transparent areas...');
  const trimmed = await sharp(SOURCE)
    .trim({
      threshold: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  const metadata = await sharp(trimmed).metadata();
  console.log(`   Trimmed size: ${metadata.width}x${metadata.height}`);

  // Generate Linux/Windows tray icon (48x48)
  console.log('📦 Generating tray-icon.png...');
  await sharp(trimmed)
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(OUTPUT_DIR, 'tray-icon.png'));

  // Generate macOS tray icons (standard and @2x)
  console.log('🍎 Generating macOS tray icons...');

  // Standard (16x16, displayed as 18x18 with padding)
  await sharp(trimmed)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 1,
      bottom: 1,
      left: 1,
      right: 1,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(OUTPUT_DIR, 'tray-icon-mac.png'));

  // Retina @2x (32x32, displayed as 36x36 with padding)
  await sharp(trimmed)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 2,
      bottom: 2,
      left: 2,
      right: 2,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(OUTPUT_DIR, 'tray-icon-mac@2x.png'));

  // Generate Windows .ico file
  console.log('🪟 Generating tray-icon.ico...');

  const ICO_SIZES = [48, 32, 16];
  const pngBuffers = [];

  for (const size of ICO_SIZES) {
    const buffer = await sharp(trimmed)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    pngBuffers.push({ size, data: buffer });
  }

  // Build ICO file
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset0 = headerSize + entrySize * count;

  let currentOffset = dataOffset0;
  const entries = pngBuffers.map(({ size, data }) => {
    const entry = {
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      dataSize: data.length,
      offset: currentOffset,
      data,
    };
    currentOffset += data.length;
    return entry;
  });

  const totalSize = currentOffset;
  const ico = Buffer.alloc(totalSize);

  // ICONDIR header
  ico.writeUInt16LE(0, 0);        // reserved
  ico.writeUInt16LE(1, 2);        // type = ICO
  ico.writeUInt16LE(count, 4);    // image count

  // ICONDIRENTRY for each image
  entries.forEach((e, i) => {
    const off = headerSize + i * entrySize;
    ico.writeUInt8(e.width, off + 0);
    ico.writeUInt8(e.height, off + 1);
    ico.writeUInt8(0, off + 2);
    ico.writeUInt8(0, off + 3);
    ico.writeUInt16LE(1, off + 4);
    ico.writeUInt16LE(32, off + 6);
    ico.writeUInt32LE(e.dataSize, off + 8);
    ico.writeUInt32LE(e.offset, off + 12);
  });

  // Image data
  entries.forEach(e => {
    e.data.copy(ico, e.offset);
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'tray-icon.ico'), ico);

  console.log('\n🎉 Tray icons generated successfully!');
  console.log('   Files:', OUTPUT_DIR);
  console.log('   - tray-icon.png (Linux/Windows)');
  console.log('   - tray-icon-mac.png (macOS standard)');
  console.log('   - tray-icon-mac@2x.png (macOS Retina)');
  console.log('   - tray-icon.ico (Windows)');
}

main().catch(console.error);
