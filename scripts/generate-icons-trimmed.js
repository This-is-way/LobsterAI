/**
 * Generate all platform icons from main.png with transparent padding removed
 * Uses sharp to auto-crop transparent areas
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'build', 'icons', 'main.png');
const PNG_DIR = path.join(__dirname, '..', 'build', 'icons', 'png');
const MAC_DIR = path.join(__dirname, '..', 'build', 'icons', 'mac');
const WIN_DIR = path.join(__dirname, '..', 'build', 'icons', 'win');

const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

async function main() {
  console.log('🎨 Generating icons from', SOURCE, '...');

  // Check if source exists
  if (!fs.existsSync(SOURCE)) {
    console.error('❌ Error: Source file not found at', SOURCE);
    process.exit(1);
  }

  // Load and trim the source image (remove transparent padding)
  console.log('✂️  Trimming transparent areas from source image...');
  const trimmedImage = sharp(SOURCE);
  const metadata = await trimmedImage.metadata();

  // Use sharp's trim to remove transparent borders
  // threshold: 0 means any non-transparent pixel will be kept
  const trimmed = await trimmedImage.trim({
    threshold: 0,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }).toBuffer();

  console.log(`   Original size: ${metadata.width}x${metadata.height}`);
  const trimmedMetadata = await sharp(trimmed).metadata();
  console.log(`   Trimmed size: ${trimmedMetadata.width}x${trimmedMetadata.height}`);

  // Ensure output directories exist
  fs.mkdirSync(PNG_DIR, { recursive: true });
  fs.mkdirSync(MAC_DIR, { recursive: true });
  fs.mkdirSync(WIN_DIR, { recursive: true });

  // Generate PNG files in different sizes
  console.log('📦 Generating PNG files...');
  for (const size of SIZES) {
    console.log(`  Generating ${size}x${size}...`);

    // Resize the trimmed image to the target size
    await sharp(trimmed)
      .resize(size, size, {
        fit: 'contain',  // Keep aspect ratio, contain within the box
        background: { r: 0, g: 0, b: 0, alpha: 0 },  // Transparent background
        withoutEnlargement: false
      })
      .toFile(path.join(PNG_DIR, `${size}x${size}.png`));
  }

  console.log('✅ PNG files generated in', PNG_DIR);

  // Generate macOS .icns file
  console.log('🍎 Generating macOS .icns file...');

  const { execSync } = require('child_process');
  const ICONSET_DIR = path.join(MAC_DIR, 'icon.iconset');

  // Remove old iconset
  if (fs.existsSync(ICONSET_DIR)) {
    fs.rmSync(ICONSET_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(ICONSET_DIR, { recursive: true });

  // Create iconset structure
  const iconsetMappings = [
    ['16x16.png', 'icon_16x16.png'],
    ['32x32.png', 'icon_16x16@2x.png'],
    ['32x32.png', 'icon_32x32.png'],
    ['64x64.png', 'icon_32x32@2x.png'],
    ['128x128.png', 'icon_128x128.png'],
    ['256x256.png', 'icon_128x128@2x.png'],
    ['256x256.png', 'icon_256x256.png'],
    ['512x512.png', 'icon_256x256@2x.png'],
    ['512x512.png', 'icon_512x512.png'],
    ['1024x1024.png', 'icon_512x512@2x.png']
  ];

  for (const [source, target] of iconsetMappings) {
    fs.copyFileSync(
      path.join(PNG_DIR, source),
      path.join(ICONSET_DIR, target)
    );
  }

  // Generate .icns file
  try {
    execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${path.join(MAC_DIR, 'icon.icns')}"`, {
      stdio: 'inherit'
    });
    console.log('✅ macOS icon generated:', path.join(MAC_DIR, 'icon.icns'));
    fs.rmSync(ICONSET_DIR, { recursive: true, force: true });
  } catch (error) {
    console.error('❌ Failed to generate macOS icon:', error.message);
    process.exit(1);
  }

  // Generate Windows .ico file
  console.log('🪟 Generating Windows .ico file...');

  const ICO_SIZES = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const size of ICO_SIZES) {
    const buffer = fs.readFileSync(path.join(PNG_DIR, `${size}x${size}.png`));
    pngBuffers.push({ size, data: buffer });
  }

  // Build ICO file
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset0 = headerSize + entrySize * count;

  let currentOffset = dataOffset0;
  const entries = pngBuffers.map(({ size, data }) => ({
    width: size >= 256 ? 0 : size,
    height: size >= 256 ? 0 : size,
    dataSize: data.length,
    offset: currentOffset,
    data,
  }));

  currentOffset = dataOffset0;
  entries.forEach(e => {
    currentOffset += e.data.length;
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

  fs.writeFileSync(path.join(WIN_DIR, 'icon.ico'), ico);
  console.log('✅ Windows icon generated:', path.join(WIN_DIR, 'icon.ico'));

  console.log('\n🎉 Icon generation complete with transparent padding removed!');
  console.log('   PNG files:', PNG_DIR);
  console.log('   macOS icon:', path.join(MAC_DIR, 'icon.icns'));
  console.log('   Windows icon:', path.join(WIN_DIR, 'icon.ico'));
}

main().catch(console.error);
