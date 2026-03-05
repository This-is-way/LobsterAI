#!/bin/bash
# Build a development version with proper entitlements for testing sandbox

set -e

echo "🔨 Building development version with sandbox entitlements..."

# Clean previous build
rm -rf release/mac/dev-build

# Build frontend
echo "📦 Building frontend..."
npm run build

# Compile Electron main process
echo "🔧 Compiling Electron..."
npm run compile:electron

# Build development version (unsigned, but with entitlements)
echo "🏗️  Building dev version..."
npx electron-builder --mac --dir --config electron-builder.json --mac.com.target=dir

echo "✅ Development build complete!"
echo ""
echo "🚀 To run with sandbox support:"
echo "   open \"release/mac/Johnson.app\""
echo ""
echo "⚠️  Note: Development builds are unsigned and may need:"
echo "   1. Right-click → Open (to bypass Gatekeeper)"
echo "   2. Or: sudo spctl --master-disable (disable Gatekeeper temporarily)"
