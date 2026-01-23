#!/bin/bash
set -e

PLUGIN_DIR="$(pwd)"
SANDBOX_DIR="../sandbox-vite-plugin-shopify-clean"
ASSETS_DIR="$SANDBOX_DIR/assets"

echo "=== Building and packing plugin ==="
npm run build
TARBALL=$(npm pack | tail -1)

echo ""
echo "=== Installing in sandbox ==="
cd "$SANDBOX_DIR"
npm install "$PLUGIN_DIR/$TARBALL"

echo ""
echo "=== Enabling plugin in vite.config.js ==="
sed -i '' "s|^// import shopifyClean|import shopifyClean|" vite.config.js
sed -i '' "s|^    // shopifyClean()|    shopifyClean()|" vite.config.js

echo ""
echo "=== Cleaning assets and creating stale files ==="
npm run clean
npm run simulate-stale

echo ""
echo "=== BEFORE BUILD: assets/ ==="
ls "$ASSETS_DIR"

echo ""
echo "=== Running vite build ==="
npm run build

echo ""
echo "=== AFTER BUILD: assets/ ==="
ls "$ASSETS_DIR"

echo ""
echo "=== Restoring vite.config.js ==="
sed -i '' "s|^import shopifyClean|// import shopifyClean|" vite.config.js
sed -i '' "s|^    shopifyClean()|    // shopifyClean()|" vite.config.js

echo ""
echo "Build test complete!"
echo "To test dev/watch mode manually:"
echo "  1. cd $SANDBOX_DIR"
echo "  2. Uncomment shopifyClean in vite.config.js"
echo "  3. npm run dev"
echo ""
cd "$PLUGIN_DIR"
echo "Returned to plugin directory."
rm -f driver-digital-vite-plugin-shopify-clean-*.tgz
