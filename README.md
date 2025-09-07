# Law Watch

- 法的変化の早期発見による社会の安全性向上システム
- System for improving societal safety through early detection of legal changes.

## vision

- 企業や個人が法改正による影響を早期に察知し、適切に対応できる社会を実現する。
- To create a society where companies and individuals can detect the impact of legal revisions early and respond appropriately.

## 現状：
- まずは全文検索をフロントまでモックのみで

## エンドポイント
```
- APIサーバー (localhost:3000):

GET /search?q={keyword} - 法令検索
GET /laws - 全法令一覧

Webサーバー (localhost:3001):

/ - 検索ページ
/laws - 全法令一覧ページ
/ - 法令検索ページ
```

## 関数型DDDについて
```
┌─ Presentation層 ─────────────────
│ HTTP Request/Response             ← 副作用の境界
│ - search.ts (APIエンドポイント)    
└─────────────────────────────────
           ↓
┌─ Application層 ──────────────────
│ UseCase (オーケストレーション)       ← 純粋関数中心
│ - SearchLawsUseCase             
│ - Ports (インターフェース定義)     
└─────────────────────────────────
           ↓
┌─ Domain層 ──────────────────────
│ ビジネスロジック (純粋関数のみ)      ← 完全に純粋
│ - Entities, Value Objects       
│ - Business Rules                
└─────────────────────────────────
           ↑
┌─ Infrastructure層 ───────────────
│ 副作用の実装                      ← 副作用の境界
│ - MockEGovClient                
│ - Database Access               
└─────────────────────────────────
```

## 検索コマンド

```
curl "http://localhost:3000/search?q=$(urlencode "労働")"
```

```
Law Watch システムの実装済み機能一覧

  基本機能

  1. 法令検索 - キーワードによる日本の法令検索（労働、建築、消費者、環境、交通カテゴリ対応）
  2. 全法令一覧表示 - データベース内の全法令を閲覧可能
  3. 監視リスト機能 - ユーザーごとの法令監視リスト作成・管理
  4. 監視追加/削除 - ワンクリックで法令を監視リストに追加・削除
  5. 3ページ構成 - 検索（/）、全法令（/laws）、監視中（/monitoring）

  API エンドポイント

  - GET /search?q={keyword} - 法令検索
  - GET /laws - 全法令取得
  - POST /monitoring/watch-list - 監視リスト作成
  - POST /monitoring/watch - 法令を監視リストに追加
  - DELETE /monitoring/watch/{watchListId}/{lawId} - 監視解除
  - GET /monitoring/watch/{userId} - ユーザーの監視リスト取得

  技術的特徴

  - DDD設計 - ドメイン駆動設計による4層アーキテクチャ
  - TypeScript - フロントエンド・バックエンド両方で型安全性確保
  - Next.js 14 + Hono - モダンなフレームワーク構成
  - テスト完備 - Vitestによる包括的なユニットテスト
  - モノレポ構成 - pnpmワークスペースによる効率的な管理

  現在の制限事項

  - e-Gov APIはモック実装（9つの実在法令データ）
  - ユーザー認証なし（user-001固定）
  - データベース永続化なし（メモリ内保存）

```