# Law Watch

- 法的変化の早期発見による社会の安全性向上システム
- System for improving societal safety through early detection of legal changes.

## vision

- 企業や個人が法改正による影響を早期に察知し、適切に対応できる社会を実現する。
- To create a society where companies and individuals can detect the impact of legal revisions early and respond appropriately.

## 現状：
- まずは全文検索をフロントまでモックのみで

## ブランチ構成
- 通常作業：feature/LW-<番号>
- 

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
