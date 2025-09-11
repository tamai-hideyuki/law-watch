# e-Gov全法令リアルタイム差分追跡システム設計書

## 🎯 システム目標
日本の全法令（約8,000件）の変更を日次でチェックし、新規制定・改正・廃止をリアルタイムで検知・通知する

## 🏗️ システムアーキテクチャ

### 1. データ取得層
```typescript
interface LawDataFetcher {
  // 全法令リストを取得（軽量メタデータのみ）
  fetchAllLawsList(): Promise<LawListItem[]>
  
  // 特定法令の詳細を取得
  fetchLawDetail(lawId: string): Promise<LawDetail>
  
  // 法令本文を取得
  fetchLawContent(lawId: string): Promise<LawContent>
}
```

### 2. 差分検知層
```typescript
interface DiffDetector {
  // リスト差分（新規・削除）
  detectListDiff(previous: LawListItem[], current: LawListItem[]): ListDiff
  
  // メタデータ差分（改正日、施行日等）
  detectMetadataDiff(previous: LawDetail, current: LawDetail): MetadataDiff
  
  // 本文差分（条文の変更）
  detectContentDiff(previous: LawContent, current: LawContent): ContentDiff
}
```

### 3. スケジューリング層
```typescript
interface ScheduledJobs {
  // 日次全法令リストチェック（深夜2時実行）
  dailyFullScan(): Promise<void>
  
  // 時間毎の重要法令チェック（1時間毎）
  hourlyPriorityCheck(): Promise<void>
  
  // リアルタイム監視対象チェック（5分毎）
  realtimeMonitoring(): Promise<void>
}
```

## 📊 データベース設計

### law_snapshots（法令スナップショット）
```sql
CREATE TABLE law_snapshots (
  id UUID PRIMARY KEY,
  law_id VARCHAR(50) UNIQUE,
  law_name TEXT,
  law_number TEXT,
  promulgation_date DATE,
  enforcement_date DATE,
  last_revision_date DATE,
  metadata_hash VARCHAR(64),  -- メタデータのSHA-256
  content_hash VARCHAR(64),    -- 本文のSHA-256
  full_content TEXT,           -- 圧縮された法令本文
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_law_id (law_id),
  INDEX idx_metadata_hash (metadata_hash),
  INDEX idx_updated_at (updated_at)
);
```

### law_changes（変更履歴）
```sql
CREATE TABLE law_changes (
  id UUID PRIMARY KEY,
  law_id VARCHAR(50),
  change_type ENUM('NEW', 'REVISED', 'ABOLISHED', 'METADATA', 'CONTENT'),
  change_date DATE,
  previous_snapshot_id UUID,
  current_snapshot_id UUID,
  diff_summary JSONB,  -- 変更内容の要約
  detected_at TIMESTAMP,
  notified_at TIMESTAMP,
  INDEX idx_law_id (law_id),
  INDEX idx_change_type (change_type),
  INDEX idx_detected_at (detected_at)
);
```

### scan_history（スキャン履歴）
```sql
CREATE TABLE scan_history (
  id UUID PRIMARY KEY,
  scan_type ENUM('FULL', 'INCREMENTAL', 'PRIORITY'),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_laws_scanned INT,
  new_laws_found INT,
  revised_laws_found INT,
  abolished_laws_found INT,
  errors JSONB,
  INDEX idx_scan_type (scan_type),
  INDEX idx_completed_at (completed_at)
);
```

## 🔄 処理フロー

### 1. 初期全件取得（Initial Bulk Load）
```typescript
async function initialBulkLoad() {
  // Step 1: 全法令リスト取得
  const allLaws = await eGovApi.getAllLaws()  // 約8,000件
  
  // Step 2: バッチ処理で詳細取得（100件ずつ）
  for (const batch of chunk(allLaws, 100)) {
    await Promise.all(batch.map(async (law) => {
      const detail = await eGovApi.getLawDetail(law.id)
      const snapshot = createSnapshot(detail)
      await saveSnapshot(snapshot)
    }))
    
    // レート制限対策（1秒待機）
    await sleep(1000)
  }
}
```

### 2. 差分検知処理（Incremental Check）
```typescript
async function incrementalCheck() {
  // Step 1: 最新の法令リスト取得
  const currentLaws = await eGovApi.getAllLaws()
  const previousLaws = await db.getLatestLawsList()
  
  // Step 2: リスト差分検知
  const listDiff = detectListDiff(previousLaws, currentLaws)
  
  // Step 3: 新規法令の処理
  for (const newLaw of listDiff.added) {
    await processNewLaw(newLaw)
  }
  
  // Step 4: 変更可能性のある法令をチェック
  for (const law of listDiff.unchanged) {
    if (await hasMetadataChanged(law)) {
      await processRevisedLaw(law)
    }
  }
  
  // Step 5: 廃止法令の処理
  for (const abolished of listDiff.removed) {
    await processAbolishedLaw(abolished)
  }
}
```

### 3. 優先度ベースチェック
```typescript
const PRIORITY_CATEGORIES = [
  '労働基準法',
  '建築基準法', 
  '個人情報保護法',
  '消費者契約法'
]

async function priorityCheck() {
  const priorityLaws = await db.getLawsByCategories(PRIORITY_CATEGORIES)
  
  for (const law of priorityLaws) {
    const current = await eGovApi.getLawDetail(law.id)
    const previous = await db.getLatestSnapshot(law.id)
    
    if (hasChanged(previous, current)) {
      await processChange(law, previous, current)
    }
  }
}
```

## 🚀 実装優先順位

### Phase 1: 基本機能（1-2週間）
- [ ] e-Gov API統合（RealEGovClient実装）
- [ ] 法令スナップショットDB設計
- [ ] 基本的な差分検知ロジック

### Phase 2: スケジューリング（1週間）
- [ ] Cronジョブ設定
- [ ] バッチ処理の実装
- [ ] エラーハンドリング

### Phase 3: 最適化（1週間）
- [ ] レート制限対策
- [ ] キャッシング戦略
- [ ] 並列処理の最適化

### Phase 4: 通知システム（1週間）
- [ ] リアルタイム通知
- [ ] ダイジェスト通知
- [ ] Webhook連携

## ⚡ パフォーマンス最適化

### 1. キャッシング戦略
```typescript
// Redisを使用した多層キャッシュ
const cache = {
  // L1: メモリキャッシュ（頻繁アクセス）
  memory: new Map(),
  
  // L2: Redis（中期保存）
  redis: new Redis(),
  
  // L3: PostgreSQL（永続化）
  db: new Database()
}
```

### 2. レート制限対策
```typescript
class RateLimitedClient {
  private queue = new PQueue({ 
    concurrency: 10,  // 同時実行数
    interval: 1000,   // 1秒間隔
    intervalCap: 100  // 1秒あたり最大100リクエスト
  })
  
  async fetch(url: string) {
    return this.queue.add(() => fetch(url))
  }
}
```

### 3. 差分計算の効率化
```typescript
// ハッシュベースの高速比較
function quickDiff(previous: Snapshot, current: Snapshot): boolean {
  // メタデータハッシュで高速比較
  if (previous.metadataHash !== current.metadataHash) {
    return true
  }
  
  // 変更がなければ詳細比較をスキップ
  return false
}
```

## 📈 監視メトリクス

### 重要指標
- スキャン完了時間
- 検知した変更数
- API呼び出し数/レート
- エラー率
- 通知遅延時間

### アラート条件
- スキャン失敗が3回連続
- API制限エラー
- 処理時間が通常の2倍超過
- 未処理キューが1000件超過

## 🔒 セキュリティ考慮事項

1. **API認証**: e-Gov APIキーの安全な管理
2. **データ暗号化**: 法令本文の暗号化保存
3. **アクセス制御**: 管理者権限の適切な設定
4. **監査ログ**: 全ての変更操作を記録

## 📝 実装例

```typescript
// apps/api/src/services/law-tracking-service.ts
export class LawTrackingService {
  private readonly egovClient: RealEGovClient
  private readonly db: Database
  private readonly notifier: NotificationService
  
  async performDailyFullScan(): Promise<ScanResult> {
    const scanId = await this.startScan('FULL')
    
    try {
      // 全法令リスト取得
      const allLaws = await this.egovClient.getAllLaws()
      
      // 差分検知
      const changes = await this.detectChanges(allLaws)
      
      // 通知送信
      if (changes.hasSignificantChanges()) {
        await this.notifier.sendChangeNotification(changes)
      }
      
      // スキャン完了
      return await this.completeScan(scanId, changes)
      
    } catch (error) {
      await this.failScan(scanId, error)
      throw error
    }
  }
}
```

## 次のステップ

1. **e-Gov API仕様書の詳細確認**
2. **プロトタイプ実装**（100法令でテスト）
3. **パフォーマンステスト**
4. **本番環境への段階的デプロイ**