# Law Watch

**法的変化の早期発見による社会の安全性向上システム**  
*System for improving societal safety through early detection of legal changes*

## Vision

企業や個人が法改正による影響を早期に察知し、適切に対応できる社会を実現する。  
*To create a society where companies and individuals can detect the impact of legal revisions early and respond appropriately.*

## アーキテクチャ

**TypeScriptバックエンドアーキテクチャ** を採用し、Clean Architecture（DDD 4層構成）で設計

```
law-watch/
├── apps/
│   ├── api/        # Hono API サーバー（ポート3000）
│   └── web/        # Next.js Webアプリケーション（ポート3001）
├── packages/       # 共有パッケージ
└── tools/          # 開発ツール設定
```



## 技術スタック

### バックエンド
- **Runtime**: Node.js 20+
- **Framework**: Hono (高速軽量WebAPI)
- **Language**: TypeScript (any型0箇所)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Mail**: Nodemailer + Ethereal Email（開発）/ Gmail SMTP（本番）
- **Logging**: 構造化ログシステム（環境別設定）
- **Testing**: Vitest（203テスト、28ファイル、TDD実装）

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript + React
- **Styling**: Tailwind CSS
- **State**: カスタムフック（型安全API統合）
- **Architecture**: Atomic Design

### 開発・運用
- **Package Manager**: pnpm (ワークスペース)
- **Containerization**: Docker (PostgreSQL)
- **Architecture**: Clean Architecture + DDD
- **Error Handling**: Result型（関数型プログラミング）
- **Quality**: SOLID原則準拠、セキュリティ対策済み

## 実装済み機能

### 1. 法令検索・監視システム
- **法令検索**: キーワードによる日本の法令検索（労働、建築、消費者、環境、交通カテゴリ対応）
- **法令詳細取得**: e-Gov APIからの法令データ取得・保存
- **監視リスト管理**: ユーザーごとの監視リスト作成・管理
- **法令ID入力**: 直接法令IDを入力して監視対象に追加
- **一括削除機能**: 複数法令の一括削除、監視リスト全体削除

### 2. 変更検知・通知システム
- **ハッシュベース検知**: SHA-256による高精度な法令変更検知
- **スナップショット管理**: 法令の履歴管理と差分比較
- **変更タイプ分類**: 新規・改正・廃止・メタデータ変更の自動分類
- **メール通知**: 法令変更検知時の自動メール送信
- **通知履歴**: ユーザーごとの通知履歴保存

### 3. 全国法令追跡システム
- **フルスキャン**: 日本全法令の一括スキャン（非同期処理）
- **増分スキャン**: 前回からの差分のみチェック
- **カテゴリ別スキャン**: 特定分野の集中監視
- **統計情報**: スキャン実行統計と変更履歴

### 4. データ管理
- **実在法令データ**: 9つの日本の法令（労働基準法、建築基準法等）
- **PostgreSQL**: 8テーブル設計（リレーション完備）
- **Prisma**: 型安全なORM、マイグレーション管理

## API エンドポイント一覧

### 検索・一覧系
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/search?q={keyword}` | 法令をキーワード検索 |
| GET | `/laws` | 全法令一覧を取得 |

### 監視リスト管理
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/monitoring/watch-list` | 新規監視リスト作成 |
| GET | `/monitoring/watch/{userId}` | ユーザーの監視リスト一覧取得 |
| GET | `/monitoring/watch/detail/{watchListId}` | 監視リスト詳細取得 |
| POST | `/monitoring/watch` | 法令を監視リストに追加 |
| DELETE | `/monitoring/watch/{watchListId}/{lawId}` | 法令を監視リストから削除 |
| DELETE | `/monitoring/watch-list/{watchListId}` | 監視リスト全体削除 |
| DELETE | `/monitoring/watch/{watchListId}/bulk` | 監視リストから複数法令一括削除 |

### 通知・検知系
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/monitoring/detect-changes-hash` | ハッシュベース法令変更検知実行（推奨） |
| POST | `/monitoring/detect-changes` | 従来の法令変更検知実行 |
| GET | `/monitoring/notifications/{userId}` | ユーザーの通知一覧取得 |
| POST | `/monitoring/simulate-change` | 法令変更シミュレーション（テスト用） |

### 全国法令追跡システム
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/national-tracking/scan` | 全日本法令フルスキャン実行（非同期処理） |
| POST | `/national-tracking/scan-incremental` | 増分スキャン実行（前回からの差分のみ） |
| POST | `/national-tracking/scan-category` | カテゴリ別法令スキャン実行 |
| GET | `/national-tracking/recent-changes?days=7` | 最近の法令変更履歴取得 |
| GET | `/national-tracking/statistics` | スキャン統計情報取得 |

## ページ構成

| パス | ページ | 機能 |
|------|--------|------|
| `/` | 検索ページ | キーワード検索、検索結果から監視追加 |
| `/laws` | 全法令一覧 | 監視中法令の表示、個別監視ボタン |
| `/monitoring` | 監視ダッシュボード | 法令ID入力追加、監視中法令管理、削除機能、変更検知ボタン |

## 品質基準

- **Clean Architecture**: DDD 4層アーキテクチャ完全実装
- **型安全性**: any型0箇所、完全TypeScript化
- **テスト品質**: TDD実装、203テスト、28ファイル
- **関数型プログラミング**: Result型エラーハンドリング
- **SOLID原則**: 単一責任・依存性逆転・開放閉鎖原則準拠
- **セキュリティ**: SQLインジェクション対策、入力検証
- **可観測性**: 構造化ログ、環境別設定
- **メンテナンス性**: API分割、責任分離設計

## クイックスタート

### 1. 環境準備
```bash
# リポジトリクローン
git clone <repository-url>
cd law-watch

# 依存関係インストール
pnpm install
```

### 2. データベース起動
```bash
# PostgreSQL起動（Docker）
docker-compose up -d

# Prismaマイグレーション
npx prisma migrate dev
```

### 3. 開発サーバー起動
```bash
# 全体起動（API + Web）
pnpm dev

# 個別起動
pnpm --filter api dev    # APIのみ（ポート3000）
pnpm --filter web dev    # Webのみ（ポート3001）
```

### 4. テスト実行
```bash
# 全テスト実行（203テスト）
pnpm test

# 型安全テスト
pnpm test:safe
```

## curl コマンド例

### 検索・一覧系

```bash
# 法令検索
curl "http://localhost:3000/search?q=労働"

# 全法令一覧取得
curl http://localhost:3000/laws
```

### 監視リスト管理

```bash
# 監視リスト作成
curl -X POST http://localhost:3000/monitoring/watch-list \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "name": "労働法監視"}'

# ユーザーの監視リスト一覧取得
curl http://localhost:3000/monitoring/watch/user-001

# 監視リスト詳細取得
curl http://localhost:3000/monitoring/watch/detail/{watchListId}

# 法令を監視リストに追加（労働基準法の例）
curl -X POST http://localhost:3000/monitoring/watch \
  -H "Content-Type: application/json" \
  -d '{"watchListId": "your-watch-list-id", "lawId": "322AC0000000049"}'

# 法令を監視リストから削除
curl -X DELETE http://localhost:3000/monitoring/watch/{watchListId}/{lawId}

# 監視リスト全体削除
curl -X DELETE http://localhost:3000/monitoring/watch-list/{watchListId}

# 複数法令一括削除
curl -X DELETE http://localhost:3000/monitoring/watch/{watchListId}/bulk \
  -H "Content-Type: application/json" \
  -d '{"lawIds": ["322AC0000000049", "347AC0000000057"]}'
```

### 変更検知・通知

```bash
# ハッシュベース変更検知実行（推奨）
curl -X POST http://localhost:3000/monitoring/detect-changes-hash

# 従来の変更検知実行
curl -X POST http://localhost:3000/monitoring/detect-changes

# 通知一覧取得
curl http://localhost:3000/monitoring/notifications/user-001

# 変更シミュレーション（テスト用）
curl -X POST http://localhost:3000/monitoring/simulate-change
```

### 全国法令追跡システム

```bash
# 全法令フルスキャン
curl -X POST http://localhost:3000/national-tracking/scan

# 増分スキャン
curl -X POST http://localhost:3000/national-tracking/scan-incremental

# カテゴリ別スキャン
curl -X POST http://localhost:3000/national-tracking/scan-category \
  -H "Content-Type: application/json" \
  -d '{"categories": ["労働", "建築"]}'

# 最近の変更履歴取得（7日分）
curl "http://localhost:3000/national-tracking/recent-changes?days=7"

# スキャン統計取得
curl http://localhost:3000/national-tracking/statistics
```

### 実在法令IDの例

```bash
# 労働基準法を監視追加
curl -X POST http://localhost:3000/monitoring/watch \
  -H "Content-Type: application/json" \
  -d '{"watchListId": "your-id", "lawId": "322AC0000000049"}'

# 建築基準法を監視追加
curl -X POST http://localhost:3000/monitoring/watch \
  -H "Content-Type: application/json" \
  -d '{"watchListId": "your-id", "lawId": "325AC1000000201"}'

# 労働安全衛生法を監視追加
curl -X POST http://localhost:3000/monitoring/watch \
  -H "Content-Type: application/json" \
  -d '{"watchListId": "your-id", "lawId": "347AC0000000057"}'
```

## メール通知デモ

### 開発環境（Ethereal Email）
1. 変更検知実行後、サーバーログでプレビューURL確認
2. `https://ethereal.email/message/[メッセージID]` で内容閲覧
3. 実際の送信なし、UI確認のみ

### 本番環境設定
```bash
# .env設定例
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com
NOTIFICATION_EMAIL_TO=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 開発ガイド

### Prisma Studio（DB GUI）
```bash
npx prisma studio  # http://localhost:5555
```

### ログレベル設定
```bash
export LOG_LEVEL=DEBUG  # DEBUG, INFO, WARN, ERROR
```

### トラブルシューティング
1. **ポート競合**: `lsof -i :3000` でプロセス確認
2. **DB接続エラー**: `docker-compose up -d` でPostgreSQL起動確認
3. **CORS エラー**: APIサーバー（3000）起動確認

## プロジェクト統計

- **テストファイル**: 29ファイル
- **総テスト数**: 222テスト
- **any型使用**: 多分0箇所
- **アーキテクチャ**: Clean Architecture準拠
- **品質基準**: TypeScriptアーキテクチャ

## 今後の拡張

### 高優先度
- 実際のe-Gov API連携実装
- JWT認証システム導入
- 定期実行スケジューラー（cron）実装

### 中優先度
- リアルタイム通知（WebSocket）
- 変更内容詳細比較機能
- フロントエンド完全型安全化

## ライセンス

このプロジェクトは[LICENSE](LICENSE)の下で公開されています。

---

**Law Watch** - 法的変化の早期発見による社会の安全性向上を目指して


  必須コマンド

  1. PostgreSQL起動

  docker compose up -d
  - データベース（PostgreSQL）をバックグラウンドで起動

  2. 開発サーバー起動

  pnpm dev
  - API サーバー（ポート3000）とWebアプリ（ポート3001）を同時起動

  3. データベース管理UI

  npx prisma studio
  - データベース内容を確認・編集するGUI（ポート5555）

