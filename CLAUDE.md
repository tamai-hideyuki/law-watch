# CLAUDE.md - Law Watch システム状態記録

## 概要
Law Watch は「法的変化の早期発見による社会の安全性向上システム」として開発された、法令監視・通知システムです。ドメイン駆動設計（DDD）による4層アーキテクチャを採用し、TypeScriptによる型安全性を確保したモノレポ構成になっています。

## アーキテクチャ構成

```
law-watch/
├── apps/
│   ├── api/        # Hono API サーバー（ポート3000）
│   └── web/        # Next.js Webアプリケーション（ポート3001）
├── packages/       # 共有パッケージ
└── tools/          # 開発ツール設定
```

### 技術スタック
- **バックエンド**: Node.js + Hono + TypeScript
- **フロントエンド**: Next.js 14 + React + TypeScript + Tailwind CSS  
- **テスト**: Vitest
- **パッケージ管理**: pnpm ワークスペース

## 実装済み機能一覧

### 1. 法令検索システム
- **エンドポイント**: `GET /search?q={keyword}`
- **機能**: キーワードベースの法令検索
- **対応カテゴリ**: 労働、建築、消費者、環境、交通
- **実装**: MockEGovClient による9つの実在法令データ

### 2. 全法令一覧表示
- **エンドポイント**: `GET /laws`
- **機能**: データベース内の全法令を一覧表示
- **UI**: `/laws` ページで監視ボタン付き法令リスト

### 3. 監視リストシステム

#### 3.1 監視リスト管理
- **作成**: `POST /monitoring/watch-list`
- **取得**: `GET /monitoring/watch/{userId}`
- **詳細取得**: `GET /monitoring/watch/detail/{watchListId}`

#### 3.2 法令監視機能
- **監視追加**: `POST /monitoring/watch`
- **監視削除**: `DELETE /monitoring/watch/{watchListId}/{lawId}`
- **UI**: 検索結果・全法令一覧での監視/監視解除ボタン

#### 3.3 監視ダッシュボード
- **ページ**: `/monitoring`
- **機能**: 監視中の法令一覧表示・削除機能
- **データ**: 監視リスト統計情報

### 4. 法令変更検知・通知システム

#### 4.1 変更検知
- **エンドポイント**: `POST /monitoring/detect-changes`
- **機能**: 監視中法令の変更を自動検知
- **実装**: DetectLawChangesUseCase
- **検知ロジック**: 法令名に「改正版」「令和7年改正版」が含まれる場合

#### 4.2 通知システム
- **エンドポイント**: `GET /monitoring/notifications/{userId}`
- **機能**: ユーザーごとの変更通知一覧
- **データ**: 通知ID, 法令ID, 変更種別, タイトル, 説明, 検知日時, 読了状態

#### 4.3 テスト用機能
- **エンドポイント**: `POST /monitoring/simulate-change`
- **機能**: 法令変更をシミュレーション（テスト・デモ用）

## DDD アーキテクチャ詳細

### Domain Layer（ドメイン層）
- **エンティティ**: Law, WatchList, LawChangeNotification
- **値オブジェクト**: LawId, LawCategory, LawStatus, ChangeType
- **ドメインルール**: 検索クエリ検証, 法令データ検証

### Application Layer（アプリケーション層）
- **ユースケース**:
  - `SearchLawsUseCase`: 法令検索処理
  - `CreateWatchListUseCase`: 監視リスト作成
  - `AddLawToWatchListUseCase`: 法令監視追加
  - `RemoveLawFromWatchListUseCase`: 法令監視削除
  - `DetectLawChangesUseCase`: 法令変更検知

### Infrastructure Layer（インフラ層）
- **データアクセス**: 
  - `MockWatchListRepository`: 監視リスト永続化
  - `MockNotificationRepository`: 通知データ永続化
- **外部API**: 
  - `MockEGovClient`: e-Gov API モック実装

### Presentation Layer（プレゼンテーション層）
- **API**: RESTful エンドポイント, CORS設定
- **Web UI**: Next.js ページコンポーネント

## フロントエンド構成

### ページ構成
1. **検索ページ** (`/`) - 法令検索・監視機能
2. **全法令一覧** (`/laws`) - 全法令表示・監視機能  
3. **監視ダッシュボード** (`/monitoring`) - 監視中法令管理

### コンポーネント構造（Atomic Design）
```
components/
├── atoms/          # 基本コンポーネント
├── molecules/      # 複合コンポーネント
├── organisms/      # 複雑な機能単位
└── templates/      # ページテンプレート
```

### 状態管理
- **カスタムフック**: `use-search-laws`, `use-all-laws`, `use-watch-lists`
- **API統合**: 型安全なAPIクライアント実装

## テスト構成

### バックエンドテスト
- **カバレッジ**: ドメイン、アプリケーション、インフラ、プレゼンテーション層
- **モック**: 外部依存関係の完全モック化
- **テスト数**: 13テスト（全て通過）

### テストファイル
- `monitoring.test.ts`: 監視API統合テスト
- `mock-e-gov-client.test.ts`: e-Gov APIモックテスト
- `detect-law-changes.test.ts`: 変更検知ユースケーステスト

## データ構造

### 法令データ（LawData）
```typescript
{
  id: string           // 法令ID
  name: string         // 法令名
  number: string       // 法令番号
  category: string     // カテゴリ
  status: string       // 状態
  promulgationDate: string // 公布日
}
```

### 監視リスト（WatchList）
```typescript
{
  id: string           // 監視リストID
  userId: string       // ユーザーID
  name: string         // 監視リスト名
  lawIds: string[]     // 監視対象法令ID配列
  createdAt: Date      // 作成日時
  updatedAt: Date      // 更新日時
}
```

### 変更通知（LawChangeNotification）
```typescript
{
  id: string           // 通知ID
  lawId: string        // 対象法令ID
  changeType: ChangeType // 変更種別
  title: string        // 通知タイトル
  description: string  // 通知説明
  isRead: boolean      // 読了フラグ
  detectedAt: Date     // 検知日時
  readAt?: Date        // 読了日時
}
```

## 実際の法令データ

システムには以下の実在する日本の法令データが含まれています：

1. **労働基準法** (昭和二十二年法律第四十九号)
2. **労働安全衛生法** (昭和四十七年法律第五十七号)  
3. **労働者派遣法** (昭和六十年法律第八十八号)
4. **建築基準法** (昭和二十五年法律第二百一号)
5. **建設業法** (昭和二十四年法律第百号)
6. **消費者契約法** (平成十二年法律第六十一号)
7. **消費者基本法** (昭和四十三年法律第七十八号)
8. **環境基本法** (平成五年法律第九十一号)
9. **道路交通法** (昭和三十五年法律第百五号)

## 開発・運用コマンド

### 開発サーバー起動
```bash
# 全体起動
pnpm dev

# API サーバーのみ
pnpm --filter api dev

# Webアプリのみ  
pnpm --filter web dev
```

### テスト実行
```bash
# 全テスト実行
pnpm test

# 監視機能のみテスト
pnpm test apps/api/src/presentation/api/monitoring.test.ts
```

### API テスト例
```bash
# 法令検索
curl "http://localhost:3000/search?q=労働"

# 監視リスト作成
curl -X POST http://localhost:3000/monitoring/watch-list \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "name": "労働法監視"}'

# 変更検知実行
curl -X POST http://localhost:3000/monitoring/detect-changes

# 変更シミュレーション
curl -X POST http://localhost:3000/monitoring/simulate-change
```

## 現在の制限事項・TODO

### 制限事項
1. **ユーザー認証なし** - `user-001` 固定
2. **データ永続化なし** - メモリ内保存（サーバー再起動で消失）
3. **e-Gov API連携なし** - モック実装のみ

### 技術的課題
1. **スケジューラー未実装** - 変更検知の定期実行なし
2. **通知配信機能なし** - メール・プッシュ通知未実装
3. **ユーザー管理機能なし** - 認証・認可システム未実装

### 将来の拡張ポイント
1. **実際のe-Gov API連携**
2. **PostgreSQL等による永続化**  
3. **JWT認証システム**
4. **リアルタイム通知（WebSocket）**
5. **変更内容の詳細比較機能**
6. **通知設定のカスタマイズ**

## 最終更新
- **日付**: 2025-09-07
- **状態**: 法令変更検知・通知システム完全実装完了
- **テスト**: 全13テスト通過
- **機能**: コア機能すべて実装・動作確認済み