import { PrismaClient } from '@prisma/client'
import { WatchListRepository } from '../../application/ports/watch-list-repository'
import { WatchList } from '../../domain/monitoring/entities/watch-list'
import { createLawId } from '../../domain/law'

export class PrismaWatchListRepository implements WatchListRepository {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async save(watchList: WatchList): Promise<void> {
    await this.prisma.watchList.upsert({
      where: { id: watchList.id },
      update: {
        name: watchList.name,
        updatedAt: watchList.updatedAt
      },
      create: {
        id: watchList.id,
        userId: watchList.userId,
        name: watchList.name,
        createdAt: watchList.createdAt,
        updatedAt: watchList.updatedAt
      }
    })

    // 法令の関連付けも更新
    if (watchList.lawIds.length > 0) {
      // 既存の関連を削除
      await this.prisma.watchListLaw.deleteMany({
        where: { watchListId: watchList.id }
      })

      // 新しい関連を作成
      await this.prisma.watchListLaw.createMany({
        data: watchList.lawIds.map(lawId => ({
          watchListId: watchList.id,
          lawId
        }))
      })
    }
  }

  async create(watchList: WatchList): Promise<void> {
    await this.save(watchList)
  }

  async findById(id: string): Promise<WatchList | null> {
    const watchList = await this.prisma.watchList.findUnique({
      where: { id },
      include: {
        laws: true
      }
    })

    if (!watchList) {
      return null
    }

    return {
      id: watchList.id,
      userId: watchList.userId,
      name: watchList.name,
      lawIds: watchList.laws.map(law => createLawId(law.lawId)),
      createdAt: watchList.createdAt,
      updatedAt: watchList.updatedAt
    }
  }

  async findByUserId(userId: string): Promise<WatchList[]> {
    const watchLists = await this.prisma.watchList.findMany({
      where: { userId },
      include: {
        laws: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return watchLists.map(watchList => ({
      id: watchList.id,
      userId: watchList.userId,
      name: watchList.name,
      lawIds: watchList.laws.map(law => createLawId(law.lawId)),
      createdAt: watchList.createdAt,
      updatedAt: watchList.updatedAt
    }))
  }

  async update(watchList: WatchList): Promise<void> {
    // トランザクション内で既存の法令を削除し、新しい法令を追加
    await this.prisma.$transaction(async (tx) => {
      // 基本情報を更新
      await tx.watchList.update({
        where: { id: watchList.id },
        data: {
          name: watchList.name,
          updatedAt: watchList.updatedAt
        }
      })

      // 既存の法令関係を削除
      await tx.watchListLaw.deleteMany({
        where: { watchListId: watchList.id }
      })

      // 新しい法令関係を作成
      if (watchList.lawIds.length > 0) {
        await tx.watchListLaw.createMany({
          data: watchList.lawIds.map(lawId => ({
            watchListId: watchList.id,
            lawId
          }))
        })
      }
    })
  }

  async delete(id: string): Promise<void> {
    // Cascadeが設定されているので、watchListを削除すると関連するwatchListLawも自動削除される
    await this.prisma.watchList.delete({
      where: { id }
    })
  }

  async addLawToWatchList(watchListId: string, lawId: string): Promise<void> {
    await this.prisma.watchListLaw.create({
      data: {
        watchListId,
        lawId
      }
    })
  }

  async removeLawFromWatchList(watchListId: string, lawId: string): Promise<void> {
    await this.prisma.watchListLaw.delete({
      where: {
        watchListId_lawId: {
          watchListId,
          lawId
        }
      }
    })
  }

  async findAll(): Promise<WatchList[]> {
    const watchLists = await this.prisma.watchList.findMany({
      include: {
        laws: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return watchLists.map(watchList => ({
      id: watchList.id,
      userId: watchList.userId,
      name: watchList.name,
      lawIds: watchList.laws.map(law => createLawId(law.lawId)),
      createdAt: watchList.createdAt,
      updatedAt: watchList.updatedAt
    }))
  }
}