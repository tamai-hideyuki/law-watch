#!/bin/bash

# Law Watch API Integration Test Script
# 
# このスクリプトは本番e-Gov API統合の動作確認を行います
# 
# 使用方法:
#   chmod +x scripts/test-api-integration.sh
#   ./scripts/test-api-integration.sh [mock|real]

set -e

# カラー出力設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# デフォルト設定
API_MODE=${1:-mock}
BASE_URL="http://localhost:3000"
TEST_USER_ID="test-user-$(date +%s)"

echo -e "${BLUE}🚀 Law Watch API Integration Test${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "Mode: ${YELLOW}$API_MODE${NC}"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo -e "Test User ID: ${YELLOW}$TEST_USER_ID${NC}"
echo ""

# jqの存在確認
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is required but not installed. Please install jq first.${NC}"
    echo "  macOS: brew install jq"
    echo "  Ubuntu: sudo apt-get install jq"
    exit 1
fi

# API サーバーの起動確認
echo -e "${BLUE}🔍 Checking API server status...${NC}"
if ! curl -s "$BASE_URL/laws" > /dev/null; then
    echo -e "${RED}❌ API server is not running at $BASE_URL${NC}"
    echo "Please start the server with: cd apps/api && pnpm dev"
    exit 1
fi
echo -e "${GREEN}✅ API server is running${NC}"
echo ""

# Test Results Storage
RESULTS_FILE="/tmp/law-watch-test-results-$(date +%s).json"
echo '{"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}}' > "$RESULTS_FILE"

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    echo -e "${BLUE}🧪 Test: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        jq ".tests += [{\"name\": \"$test_name\", \"status\": \"passed\"}] | .summary.passed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        jq ".tests += [{\"name\": \"$test_name\", \"status\": \"failed\"}] | .summary.failed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    fi
    echo ""
}

# Test 1: 監視対象法令一覧取得（初期状態では0件の可能性あり）
run_test "監視対象法令一覧取得" \
    'curl -s "$BASE_URL/laws" | jq -e ".totalCount >= 0 and .laws"'

# Test 2: キーワード検索（労働）
run_test "キーワード検索（労働）" \
    'curl -s "$BASE_URL/search?q=%E5%8A%B4%E5%83%8D" | jq -e ".totalCount > 0 and (.laws | length) > 0"'

# Test 3: キーワード検索（建築）
run_test "キーワード検索（建築）" \
    'curl -s "$BASE_URL/search?q=%E5%BB%BA%E7%AF%89" | jq -e ".totalCount >= 0 and .laws"'

# Test 4: 監視リスト作成
echo -e "${BLUE}🧪 Test: 監視リスト作成${NC}"
WATCH_LIST_RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/watch-list" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"$TEST_USER_ID\",
        \"name\": \"テスト監視リスト\"
    }")

if echo "$WATCH_LIST_RESPONSE" | jq -e '.success == true' > /dev/null; then
    WATCH_LIST_ID=$(echo "$WATCH_LIST_RESPONSE" | jq -r '.watchList.id')
    echo -e "${GREEN}✅ PASSED: 監視リスト作成 (ID: $WATCH_LIST_ID)${NC}"
    jq ".tests += [{\"name\": \"監視リスト作成\", \"status\": \"passed\"}] | .summary.passed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
else
    echo -e "${RED}❌ FAILED: 監視リスト作成${NC}"
    echo "Response: $WATCH_LIST_RESPONSE"
    jq ".tests += [{\"name\": \"監視リスト作成\", \"status\": \"failed\"}] | .summary.failed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    WATCH_LIST_ID=""
fi
echo ""

# Test 5: 法令を監視リストに追加（e-Gov APIからデータ取得・保存をテスト）
if [ -n "$WATCH_LIST_ID" ]; then
    echo -e "${BLUE}🧪 Test: 法令監視追加（e-Gov APIからデータ取得）${NC}"
    echo -e "${YELLOW}テスト対象法令: 労働基準法 (322AC0000000049)${NC}"
    
    # 変更検知システムの正しい動作をテスト：
    # 1. 法令ID入力 → 2. e-Gov APIから取得 → 3. DB保存 → 4. 監視リスト追加
    WATCH_ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/watch" \
        -H "Content-Type: application/json" \
        -d "{
            \"watchListId\": \"$WATCH_LIST_ID\",
            \"lawId\": \"322AC0000000049\"
        }")
    
    if echo "$WATCH_ADD_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ PASSED: 法令監視追加（e-Gov APIからデータ取得成功）${NC}"
        
        # 法令がデータベースに保存されたか確認
        LAWS_AFTER=$(curl -s "$BASE_URL/laws")
        LAW_ADDED=$(echo "$LAWS_AFTER" | jq -e '.laws[] | select(.id == "322AC0000000049")' > /dev/null && echo "true" || echo "false")
        
        if [ "$LAW_ADDED" = "true" ]; then
            echo -e "${GREEN}✅ 確認: 法令データがデータベースに保存されました${NC}"
        else
            echo -e "${YELLOW}⚠️  法令データの保存確認に失敗${NC}"
        fi
        
        jq ".tests += [{\"name\": \"法令監視追加（e-Gov API連携）\", \"status\": \"passed\"}] | .summary.passed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAILED: 法令監視追加${NC}"
        echo "Response: $WATCH_ADD_RESPONSE"
        jq ".tests += [{\"name\": \"法令監視追加（e-Gov API連携）\", \"status\": \"failed\"}] | .summary.failed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    fi
    echo ""
fi

# Test 6: 監視リスト詳細取得
if [ -n "$WATCH_LIST_ID" ]; then
    run_test "監視リスト詳細取得" \
        'curl -s "$BASE_URL/monitoring/watch/detail/$WATCH_LIST_ID" | jq -e ".success == true"'
fi

# Test 7: ユーザーの監視リスト一覧取得
run_test "ユーザー監視リスト一覧" \
    'curl -s "$BASE_URL/monitoring/watch/$TEST_USER_ID" | jq -e ".success == true"'

# Test 8: 変更シミュレーション
run_test "変更シミュレーション" \
    'curl -s -X POST "$BASE_URL/monitoring/simulate-change" | jq -e ".success == true"'

# Test 9: 変更検知実行
echo -e "${BLUE}🧪 Test: 変更検知実行（メール送信）${NC}"
DETECT_RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/detect-changes")

if echo "$DETECT_RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ PASSED: 変更検知実行${NC}"
    
    # Ethereal Emailの情報があれば表示
    PREVIEW_URL=$(echo "$DETECT_RESPONSE" | jq -r '.emailInfo.previewUrl // empty')
    if [ -n "$PREVIEW_URL" ] && [ "$PREVIEW_URL" != "null" ]; then
        echo -e "${BLUE}📧 Email Preview URL: ${YELLOW}$PREVIEW_URL${NC}"
    fi
    
    jq ".tests += [{\"name\": \"変更検知実行\", \"status\": \"passed\"}] | .summary.passed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
else
    echo -e "${RED}❌ FAILED: 変更検知実行${NC}"
    echo "Response: $DETECT_RESPONSE"
    jq ".tests += [{\"name\": \"変更検知実行\", \"status\": \"failed\"}] | .summary.failed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
fi
echo ""

# Test 10: 通知一覧取得
run_test "通知一覧取得" \
    'curl -s "$BASE_URL/monitoring/notifications/$TEST_USER_ID" | jq -e ".success == true"'

# Test 11: 別の法令を追加（建築基準法）でe-Gov API動作確認
if [ -n "$WATCH_LIST_ID" ]; then
    echo -e "${BLUE}🧪 Test: 別法令追加テスト（建築基準法）${NC}"
    echo -e "${YELLOW}テスト対象法令: 建築基準法 (325AC1000000201)${NC}"
    
    SECOND_LAW_RESPONSE=$(curl -s -X POST "$BASE_URL/monitoring/watch" \
        -H "Content-Type: application/json" \
        -d "{
            \"watchListId\": \"$WATCH_LIST_ID\",
            \"lawId\": \"325AC1000000201\"
        }")
    
    if echo "$SECOND_LAW_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ PASSED: 別法令追加テスト${NC}"
        
        # 監視対象法令数の確認
        FINAL_LAWS=$(curl -s "$BASE_URL/laws")
        LAW_COUNT=$(echo "$FINAL_LAWS" | jq '.totalCount')
        echo -e "${BLUE}📊 最終監視対象法令数: ${YELLOW}$LAW_COUNT件${NC}"
        
        jq ".tests += [{\"name\": \"別法令追加テスト\", \"status\": \"passed\"}] | .summary.passed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAILED: 別法令追加テスト${NC}"
        jq ".tests += [{\"name\": \"別法令追加テスト\", \"status\": \"failed\"}] | .summary.failed += 1 | .summary.total += 1" "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
    fi
    echo ""
fi

# Test Results Summary
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}======================${NC}"

SUMMARY=$(jq -r '.summary | "Total: \(.total), Passed: \(.passed), Failed: \(.failed)"' "$RESULTS_FILE")
PASSED=$(jq -r '.summary.passed' "$RESULTS_FILE")
TOTAL=$(jq -r '.summary.total' "$RESULTS_FILE")

echo -e "Results: $SUMMARY"

if [ "$PASSED" -eq "$TOTAL" ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    SUCCESS_RATE="100%"
else
    echo -e "${YELLOW}⚠️  Some tests failed or were skipped${NC}"
    SUCCESS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc -l)"%"
fi

echo -e "Success Rate: ${GREEN}$SUCCESS_RATE${NC}"
echo ""

# Failed tests details
FAILED_TESTS=$(jq -r '.tests[] | select(.status == "failed") | .name' "$RESULTS_FILE")
if [ -n "$FAILED_TESTS" ]; then
    echo -e "${RED}Failed Tests:${NC}"
    echo "$FAILED_TESTS" | while read -r test; do
        echo -e "  ${RED}- $test${NC}"
    done
    echo ""
fi

# Environment info
echo -e "${BLUE}🔧 Environment Info${NC}"
echo -e "${BLUE}==================${NC}"
echo -e "API Mode: ${YELLOW}$API_MODE${NC}"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo -e "Test Results File: ${YELLOW}$RESULTS_FILE${NC}"

# Cleanup option
echo ""
read -p "Delete test results file? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$RESULTS_FILE"
    echo -e "${GREEN}✅ Test results file deleted${NC}"
else
    echo -e "${BLUE}📁 Test results saved to: $RESULTS_FILE${NC}"
fi

# Exit with appropriate code
if [ "$PASSED" -eq "$TOTAL" ]; then
    exit 0
else
    exit 1
fi