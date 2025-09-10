# Prisma セットアップ手順

## 1. PostgreSQLのセットアップ

### Macの場合（Homebrew）
```bash
# PostgreSQLインストール
brew install postgresql@16
brew services start postgresql@16

# データベース作成
createdb law_watch_dev
```

### Dockerの場合
```bash
# PostgreSQL起動
docker run --name law-watch-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=law_watch_dev \
  -p 5432:5432 \
  -d postgres:16
```

## 2. 依存関係のインストール

```bash
cd apps/api
pnpm add prisma @prisma/client
pnpm add -D @types/node
```

## 3. 環境変数の設定

`.env`ファイルを作成（既存の場合は追加）:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/law_watch_dev?schema=public"
```

## 3. Prismaの初期化とマイグレーション

```bash
# Prisma Clientの生成
npx prisma generate

# 初回マイグレーション実行
npx prisma migrate dev --name init

# データベースの確認（Prisma Studio）
npx prisma studio
```

## 4. シードデータの投入（オプション）

```bash
# prisma/seed.ts を作成後
npx prisma db seed
```

## スキーマの概要

### 主要テーブル
- **laws**: 法令マスタデータ
- **watch_lists**: ユーザーの監視リスト
- **watch_list_laws**: 監視リストと法令の関連（多対多）
- **notifications**: 法令変更通知

### 拡張用テーブル
- **users**: ユーザー管理（将来実装）
- **law_change_histories**: 変更履歴（将来実装）

## Repository実装の更新

現在のMockRepositoryをPrismaRepositoryに置き換え：

```typescript
// 例: PrismaWatchListRepository
import { PrismaClient } from '@prisma/client'

export class PrismaWatchListRepository implements WatchListRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findByUserId(userId: string): Promise<WatchList[]> {
    const result = await this.prisma.watchList.findMany({
      where: { userId },
      include: { laws: true }
    })
    // ドメインエンティティに変換
    return result.map(this.toDomainEntity)
  }
  // ... 他のメソッド
}
```