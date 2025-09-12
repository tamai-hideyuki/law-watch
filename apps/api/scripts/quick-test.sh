#!/bin/bash

# Quick API Test Script for Law Watch
# 
# 使用方法:
#   chmod +x scripts/quick-test.sh
#   ./scripts/quick-test.sh

BASE_URL="http://localhost:3000"

echo "🚀 Law Watch Quick API Test"
echo "=========================="
echo ""

# API動作確認
echo "1. 🔍 Testing basic search..."
curl -s "$BASE_URL/search?q=労働" | jq '.success, .laws[0].name' 2>/dev/null || echo "❌ Search failed"
echo ""

echo "2. 📋 Testing law list..."
curl -s "$BASE_URL/laws" | jq '.success, (.laws | length)' 2>/dev/null || echo "❌ Law list failed"
echo ""

echo "3. 📝 Testing watch list creation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/watch-list" \
  -H "Content-Type: application/json" \
  -d '{"userId": "quick-test", "name": "Quick Test List"}')

if echo "$RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
    WATCH_LIST_ID=$(echo "$RESPONSE" | jq -r '.watchList.id')
    echo "✅ Watch list created: $WATCH_LIST_ID"
    
    echo "4. 👁️  Testing law monitoring..."
    MONITOR_RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/watch" \
      -H "Content-Type: application/json" \
      -d "{\"watchListId\": \"$WATCH_LIST_ID\", \"lawId\": \"322AC0000000049\"}")
    
    if echo "$MONITOR_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
        echo "✅ Law monitoring added"
    else
        echo "⚠️  Law monitoring failed (law may not exist in current data)"
    fi
else
    echo "❌ Watch list creation failed"
fi
echo ""

echo "5. 📧 Testing change detection..."
curl -s -X POST "$BASE_URL/monitoring/detect-changes" | jq '.success, .message' 2>/dev/null || echo "❌ Change detection failed"
echo ""

echo "🎉 Quick test completed!"
echo ""
echo "💡 For comprehensive testing, use:"
echo "   ./scripts/test-api-integration.sh"
echo ""
echo "🔧 To test real e-Gov API:"
echo "   1. Set USE_REAL_E_GOV_API=true in .env"
echo "   2. Restart the server"
echo "   3. Run: pnpm test:real-egov"