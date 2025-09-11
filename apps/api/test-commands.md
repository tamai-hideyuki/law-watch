# Law Watch API テストコマンド集

## 環境設定確認

### 1. Mockクライアント使用（開発環境）
```bash
# .envファイル設定
echo "USE_REAL_E_GOV_API=false" >> apps/api/.env

# サーバー起動
cd apps/api && pnpm dev
```

### 2. 実際のe-Gov API使用（本番環境）
```bash
# .envファイル設定
echo "USE_REAL_E_GOV_API=true" >> apps/api/.env
echo "E_GOV_API_BASE_URL=https://laws.e-gov.go.jp/api/1" >> apps/api/.env
echo "E_GOV_API_TIMEOUT=10000" >> apps/api/.env
echo "E_GOV_API_RATE_LIMIT=100" >> apps/api/.env

# サーバー起動
cd apps/api && pnpm dev
```

## API テストコマンド

### 🔍 **法令検索系**

#### 1. 全法令一覧取得
```bash
curl -X GET "http://localhost:3000/laws" \
  -H "Accept: application/json"
```

#### 2. キーワード検索（労働関連）
```bash
curl -X GET "http://localhost:3000/search?q=労働" \
  -H "Accept: application/json"
```

#### 3. キーワード検索（建築関連）
```bash
curl -X GET "http://localhost:3000/search?q=建築" \
  -H "Accept: application/json"
```

#### 4. キーワード検索（環境関連）
```bash
curl -X GET "http://localhost:3000/search?q=環境" \
  -H "Accept: application/json"
```

### 📋 **監視リスト管理系**

#### 1. 監視リスト作成
```bash
curl -X POST "http://localhost:3000/monitoring/watch-list" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "name": "労働法監視リスト"
  }'
```

#### 2. 監視リスト一覧取得
```bash
curl -X GET "http://localhost:3000/monitoring/watch/user-001" \
  -H "Accept: application/json"
```

#### 3. 法令を監視リストに追加（労働基準法）
```bash
# 先に監視リストを作成してIDを取得してから実行
curl -X POST "http://localhost:3000/monitoring/watch" \
  -H "Content-Type: application/json" \
  -d '{
    "watchListId": "YOUR_WATCH_LIST_ID",
    "lawId": "322AC0000000049"
  }'
```

#### 4. 監視リスト詳細取得
```bash
curl -X GET "http://localhost:3000/monitoring/watch/detail/YOUR_WATCH_LIST_ID" \
  -H "Accept: application/json"
```

#### 5. 監視解除
```bash
curl -X DELETE "http://localhost:3000/monitoring/watch/YOUR_WATCH_LIST_ID/322AC0000000049"
```

### 📧 **通知・変更検知系**

#### 1. 法令変更シミュレーション（テスト用）
```bash
curl -X POST "http://localhost:3000/monitoring/simulate-change" \
  -H "Content-Type: application/json"
```

#### 2. 変更検知実行（メール送信付き）
```bash
curl -X POST "http://localhost:3000/monitoring/detect-changes" \
  -H "Content-Type: application/json"
```

#### 3. 通知一覧取得
```bash
curl -X GET "http://localhost:3000/monitoring/notifications/user-001" \
  -H "Accept: application/json"
```

## 実際のe-Gov API統合テスト

### 専用テストスクリプト実行
```bash
# 実際のe-Gov APIに接続してテスト
cd apps/api && pnpm test:real-egov
```

### 手動確認用コマンド

#### 1. e-Gov API直接アクセス（法令一覧）
```bash
curl -X GET "https://laws.e-gov.go.jp/api/1/lawlists/1" \
  -H "Accept: application/xml" \
  -H "User-Agent: LawWatch/1.0.0"
```

#### 2. e-Gov API直接アクセス（労働基準法詳細）
```bash
curl -X GET "https://laws.e-gov.go.jp/api/1/lawdata/322AC0000000049" \
  -H "Accept: application/xml" \
  -H "User-Agent: LawWatch/1.0.0"
```

## 完全なワークフローテスト

### シナリオ: 労働法の監視設定からメール通知まで

```bash
#!/bin/bash

# 1. 監視リスト作成
echo "=== 1. 監視リスト作成 ==="
WATCH_LIST_RESPONSE=$(curl -s -X POST "http://localhost:3000/monitoring/watch-list" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "name": "労働法監視テスト"
  }')

echo $WATCH_LIST_RESPONSE

# レスポンスからwatchListIdを抽出（jqが必要）
WATCH_LIST_ID=$(echo $WATCH_LIST_RESPONSE | jq -r '.watchList.id')
echo "監視リストID: $WATCH_LIST_ID"

# 2. 労働基準法を監視リストに追加
echo "=== 2. 労働基準法を監視追加 ==="
curl -s -X POST "http://localhost:3000/monitoring/watch" \
  -H "Content-Type: application/json" \
  -d "{
    \"watchListId\": \"$WATCH_LIST_ID\",
    \"lawId\": \"322AC0000000049\"
  }" | jq

# 3. 監視リスト確認
echo "=== 3. 監視リスト確認 ==="
curl -s -X GET "http://localhost:3000/monitoring/watch/detail/$WATCH_LIST_ID" | jq

# 4. 変更シミュレーション
echo "=== 4. 変更シミュレーション ==="
curl -s -X POST "http://localhost:3000/monitoring/simulate-change" | jq

# 5. 変更検知実行（メール送信）
echo "=== 5. 変更検知実行 ==="
curl -s -X POST "http://localhost:3000/monitoring/detect-changes" | jq

# 6. 通知確認
echo "=== 6. 通知一覧確認 ==="
curl -s -X GET "http://localhost:3000/monitoring/notifications/user-001" | jq
```

## エラー確認用コマンド

### 1. サーバーログ確認
```bash
# サーバー起動時のログでe-Gov APIクライアントの種類を確認
cd apps/api && pnpm dev | grep "egovClient"
```

### 2. レート制限テスト
```bash
# 短時間で大量リクエストを送信してレート制限をテスト
for i in {1..10}; do
  curl -s "http://localhost:3000/laws" &
done
wait
```

### 3. タイムアウトテスト
```bash
# 長時間のリクエストでタイムアウト動作を確認
# （実際のe-Gov APIでは使用しないことを推奨）
```

## 期待される結果

### Mockクライアント使用時
- 9つの固定法令データが返される
- レスポンス時間: ~100ms
- メール通知: Ethereal Emailでプレビュー

### 実際のe-Gov API使用時  
- 実際の法令データ（数千件）が返される
- レスポンス時間: 数秒〜十数秒
- XMLからJSONへの変換が行われる
- レート制限が適用される

## トラブルシューティング

### よくあるエラーと対処法

1. **CORS エラー**:
   ```bash
   # APIサーバーが起動しているか確認
   curl http://localhost:3000/laws
   ```

2. **e-Gov API接続エラー**:
   ```bash
   # 環境変数確認
   grep USE_REAL_E_GOV_API apps/api/.env
   ```

3. **レート制限エラー**:
   ```bash
   # ログでレート制限メッセージを確認
   # 1分待ってから再試行
   ```

4. **XMLパースエラー**:
   ```bash
   # e-Gov APIの直接レスポンスを確認
   curl "https://laws.e-gov.go.jp/api/1/lawlists/1"
   ```