#!/bin/bash

###############################################################################
# Bulletproof Game - Deployment Preparation Script
# Prepares files for upload to GitHub Pages, Netlify, Vercel, etc.
###############################################################################

echo "🎮 Preparing Bulletproof Game for Deployment"
echo "==========================================="
echo ""

# Create deployment directory
DEPLOY_DIR="bulletproof_game_deploy"
mkdir -p "$DEPLOY_DIR"

echo "📦 Copying bulletproof files..."

# Copy core bulletproof files
cp config.js "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  config.js not found"
cp texture_generator_client.js "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  texture_generator_client.js not found"
cp asset_manager_bulletproof.js "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  asset_manager_bulletproof.js not found"
cp index.html "$DEPLOY_DIR/" 2>/dev/null || echo "⚠️  index.html not found"

# Copy and rename game client files
if [ -f "game_client_updated.js" ]; then
    cp game_client_updated.js "$DEPLOY_DIR/game_client.js"
    echo "✅ game_client_updated.js → game_client.js"
elif [ -f "game_client.js" ]; then
    cp game_client.js "$DEPLOY_DIR/"
    echo "✅ game_client.js"
fi

if [ -f "game_client_part2_updated.js" ]; then
    cp game_client_part2_updated.js "$DEPLOY_DIR/game_client_part2.js"
    echo "✅ game_client_part2_updated.js → game_client_part2.js"
elif [ -f "game_client_part2.js" ]; then
    cp game_client_part2.js "$DEPLOY_DIR/"
    echo "✅ game_client_part2.js"
fi

# Copy documentation
cp README_BULLETPROOF.md "$DEPLOY_DIR/README.md" 2>/dev/null || echo "ℹ️  No README"
cp BULLETPROOF_DEPLOYMENT.md "$DEPLOY_DIR/" 2>/dev/null || echo "ℹ️  No deployment guide"

echo ""
echo "✅ Deployment package ready!"
echo ""
echo "📁 Files in $DEPLOY_DIR/:"
ls -lh "$DEPLOY_DIR/"

echo ""
echo "🚀 Next steps:"
echo ""
echo "Option 1: GitHub Pages"
echo "  cd $DEPLOY_DIR"
echo "  git init"
echo "  git add ."
echo "  git commit -m 'Bulletproof game'"
echo "  git remote add origin YOUR_REPO_URL"
echo "  git push -u origin main"
echo "  Then enable Pages in GitHub Settings"
echo ""
echo "Option 2: Netlify"
echo "  Drag the '$DEPLOY_DIR' folder to netlify.com"
echo ""
echo "Option 3: Vercel"
echo "  Import the '$DEPLOY_DIR' folder at vercel.com"
echo ""
echo "Option 4: Test Locally"
echo "  cd $DEPLOY_DIR"
echo "  python3 -m http.server 8000"
echo "  Open http://localhost:8000"
echo ""
echo "✨ Your game is bulletproof and ready!"

