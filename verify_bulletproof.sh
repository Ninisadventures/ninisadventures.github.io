#!/bin/bash

###############################################################################
# Bulletproof Game - Verification Script
# Checks that all files are present and ready for deployment
###############################################################################

echo "🔍 Bulletproof Game System Verification"
echo "======================================="
echo ""

MISSING=0
PRESENT=0

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 ($2)"
        PRESENT=$((PRESENT + 1))
        return 0
    else
        echo "❌ MISSING: $1"
        MISSING=$((MISSING + 1))
        return 1
    fi
}

echo "📦 Checking Core Bulletproof Files..."
echo ""

check_file "config.js" "Environment auto-detection"
check_file "texture_generator_client.js" "Client-side texture generation"
check_file "asset_manager_bulletproof.js" "Smart asset loading"
check_file "index.html" "UI and initialization"

if [ -f "game_client_updated.js" ]; then
    check_file "game_client_updated.js" "Game engine (updated)"
elif [ -f "game_client.js" ]; then
    check_file "game_client.js" "Game engine"
else
    echo "❌ MISSING: game_client.js or game_client_updated.js"
    MISSING=$((MISSING + 1))
fi

if [ -f "game_client_part2_updated.js" ]; then
    check_file "game_client_part2_updated.js" "Renderer (updated)"
elif [ -f "game_client_part2.js" ]; then
    check_file "game_client_part2.js" "Renderer"
else
    echo "❌ MISSING: game_client_part2.js or game_client_part2_updated.js"
    MISSING=$((MISSING + 1))
fi

echo ""
echo "📚 Checking Documentation..."
echo ""

check_file "README_BULLETPROOF.md" "Main README"
check_file "BULLETPROOF_DEPLOYMENT.md" "Deployment guide"
check_file "COMPLETE_FIXES_SUMMARY.md" "Fixes summary"

echo ""
echo "🔧 Checking Scripts..."
echo ""

check_file "prepare_deployment.sh" "Deployment preparation"

echo ""
echo "========================================="
echo "📊 Verification Results:"
echo ""
echo "  ✅ Files Present: $PRESENT"
echo "  ❌ Files Missing: $MISSING"
echo ""

if [ $MISSING -eq 0 ]; then
    echo "🎉 ALL SYSTEMS READY!"
    echo ""
    echo "✅ Your bulletproof game is complete and ready for deployment!"
    echo ""
    echo "🚀 Next Steps:"
    echo ""
    echo "1. Run preparation script:"
    echo "   bash prepare_deployment.sh"
    echo ""
    echo "2. Deploy to your platform of choice:"
    echo "   - GitHub Pages (drag to repo)"
    echo "   - Netlify (drag to netlify.com)"
    echo "   - Vercel (import at vercel.com)"
    echo ""
    echo "3. Or test locally:"
    echo "   python3 -m http.server 8000"
    echo ""
    exit 0
else
    echo "⚠️  MISSING FILES DETECTED!"
    echo ""
    echo "Please ensure all required files are in this directory."
    echo ""
    echo "Required files:"
    echo "  - config.js"
    echo "  - texture_generator_client.js"
    echo "  - asset_manager_bulletproof.js"
    echo "  - game_client.js (or game_client_updated.js)"
    echo "  - game_client_part2.js (or game_client_part2_updated.js)"
    echo "  - index.html"
    echo ""
    exit 1
fi
