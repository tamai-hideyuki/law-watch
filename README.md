# Law Watch

**法的変化の早期発見による社会の安全性向上システム**  
*System for improving societal safety through early detection of legal changes*

## Vision

企業や個人が法改正による影響を早期に察知し、適切に対応できる社会を実現する。  
*To create a society where companies and individuals can detect the impact of legal revisions early and respond appropriately.*

## アーキテクチャ

**TypeScriptバックエンドアーキテクチャ** を採用し、Clean Architecture（DDD 4層構成）で設計されています。

```
law-watch/
├── apps/
│   ├── api/        # Hono API サーバー（ポート3000）
│   └── web/        # Next.js Webアプリケーション（ポート3001）
├── packages/       # 共有パッケージ
└── tools/          # 開発ツール設定
```

### Clean Architecture（DDD 4層）

```
┌─ Presentation層 ─────────────────────────
│ HTTP Request/Response, API分割設計        ← 副作用の境界
│ - watch-management.ts, notification-management.ts    
│ - 統一バリデーション, レスポンス形式
└─────────────────────────────────────────
           ↓
┌─ Application層 ──────────────────────────
│ UseCase (オーケストレーション)              ← 純粋関数中心
│ - SearchLawsUseCase, DetectLawChangesUseCase             
│ - Ports (インターフェース定義)     
└─────────────────────────────────────────
           ↓
┌─ Domain層 ──────────────────────────────
│ ビジネスロジック (純粋関数のみ)             ← 完全に純粋
│ - Value Objects: LawId, LawCategory, LawStatus       
│ - Validation Rules: TDD実装
│ - Result型による関数型エラーハンドリング                
└─────────────────────────────────────────
           ↑
┌─ Infrastructure層 ───────────────────────
│ 副作用の実装                             ← 副作用の境界
│ - PrismaRepository, EmailService, Logger                
│ - PostgreSQL, Nodemailer, MockEGovClient               
└─────────────────────────────────────────
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

### 法令検索・監視システム
- **法令検索**: キーワードによる日本の法令検索
- **全法令一覧**: データベース内の法令を閲覧
- **監視リスト**: ユーザーごとの法令監視管理
- **監視操作**: ワンクリックで監視追加・削除

### 変更検知・通知システム
- **変更検知**: 監視中法令の自動変更検知
- **メール通知**: 法改正通知の自動送信
- **通知履歴**: ユーザーごとの通知一覧管理
- **プレビュー**: Ethereal EmailによるメールUI確認

### データ管理
- **実在法令データ**: 9つの日本の法令（労働基準法、建築基準法等）
- **PostgreSQL**: 7テーブル設計（リレーション完備）
- **Prisma**: 型安全なORM、マイグレーション管理

## API エンドポイント

### 検索・一覧系
```bash
GET /search?q={keyword}        # 法令検索
GET /laws                      # 全法令一覧
```

### 監視管理系
```bash
POST /monitoring/watch-list                    # 監視リスト作成
GET /monitoring/watch/{userId}                 # 監視リスト取得
POST /monitoring/watch                         # 法令監視追加
DELETE /monitoring/watch/{watchListId}/{lawId} # 監視削除
```

### 通知・検知系
```bash
POST /monitoring/detect-changes               # 変更検知実行
GET /monitoring/notifications/{userId}        # 通知一覧
POST /monitoring/simulate-change              # 変更シミュレーション
```

## ページ構成

| パス | ページ | 機能 |
|------|--------|------|
| `/` | 検索ページ | キーワード検索、監視追加 |
| `/laws` | 全法令一覧 | 全法令表示、個別監視 |
| `/monitoring` | 監視ダッシュボード | 監視中法令管理 |

## 品質基準（達成済み）

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

## API テスト例

```bash
# 法令検索
curl "http://localhost:3000/search?q=労働"

# 監視リスト作成
curl -X POST http://localhost:3000/monitoring/watch-list \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001", "name": "労働法監視"}'

# 法令を監視リストに追加
curl -X POST http://localhost:3000/monitoring/watch \
  -H "Content-Type: application/json" \
  -d '{"watchListId": "your-watch-list-id", "lawId": "322AC0000000049"}'

# 変更検知実行（メール送信付き）
curl -X POST http://localhost:3000/monitoring/detect-changes
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

- **テストファイル**: 28ファイル
- **総テスト数**: 203テスト（100%通過）
- **any型使用**: 0箇所
- **アーキテクチャ**: Clean Architecture準拠
- **品質基準**: 世界クラスTypeScriptアーキテクチャ

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

  システム構成

  起動後のアクセス先：
  - Webアプリ: http://localhost:3001
  - API サーバー: http://localhost:3000
  - Prisma Studio: http://localhost:5555
  - PostgreSQL: localhost:5432
  