import { PrismaClient } from '@prisma/client'
import { Result, ok, err } from '../../domain/common/result'
import { LawRegistrySnapshot, LawRegistryDiff } from '../../domain/monitoring/entities/law-registry-snapshot'
import { ComprehensiveMonitoring, ComprehensiveMonitoringNotification } from '../../domain/monitoring/entities/comprehensive-monitoring'
import { LawRegistryRepository } from '../../application/ports/law-registry-repository'

export class PrismaLawRegistryRepository implements LawRegistryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveLawRegistrySnapshot(snapshot: LawRegistrySnapshot): Promise<Result<void, string>> {
    try {
      await this.prisma.lawRegistrySnapshot.create({
        data: {
          id: snapshot.id,
          snapshotDate: snapshot.snapshotDate,
          totalLawCount: snapshot.totalLawCount,
          lawsChecksum: snapshot.lawsChecksum,
          metadata: snapshot.metadata as any,
          createdAt: snapshot.createdAt
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`法令レジストリスナップショットの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getLatestSnapshot(): Promise<Result<LawRegistrySnapshot | null, string>> {
    try {
      const snapshot = await this.prisma.lawRegistrySnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' }
      })

      if (!snapshot) {
        return ok(null)
      }

      return ok({
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        totalLawCount: snapshot.totalLawCount,
        lawsChecksum: snapshot.lawsChecksum,
        metadata: snapshot.metadata as any,
        createdAt: snapshot.createdAt
      })
    } catch (error) {
      return err(`最新スナップショットの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getSnapshotById(id: string): Promise<Result<LawRegistrySnapshot | null, string>> {
    try {
      const snapshot = await this.prisma.lawRegistrySnapshot.findUnique({
        where: { id }
      })

      if (!snapshot) {
        return ok(null)
      }

      return ok({
        id: snapshot.id,
        snapshotDate: snapshot.snapshotDate,
        totalLawCount: snapshot.totalLawCount,
        lawsChecksum: snapshot.lawsChecksum,
        metadata: snapshot.metadata as any,
        createdAt: snapshot.createdAt
      })
    } catch (error) {
      return err(`スナップショットの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async saveLawRegistryDiff(diff: LawRegistryDiff): Promise<Result<void, string>> {
    try {
      await this.prisma.lawRegistryDiff.create({
        data: {
          id: `diff-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          previousSnapshotId: diff.previousSnapshotId,
          currentSnapshotId: diff.currentSnapshotId,
          detectedAt: diff.detectedAt,
          diffData: {
            newLaws: diff.newLaws,
            modifiedLaws: diff.modifiedLaws,
            removedLaws: diff.removedLaws
          } as any,
          summary: diff.summary as any
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`法令レジストリ差分の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getRecentDiffs(limit: number = 10): Promise<Result<LawRegistryDiff[], string>> {
    try {
      const diffs = await this.prisma.lawRegistryDiff.findMany({
        orderBy: { detectedAt: 'desc' },
        take: limit
      })

      const result = diffs.map(diff => ({
        previousSnapshotId: diff.previousSnapshotId,
        currentSnapshotId: diff.currentSnapshotId,
        detectedAt: diff.detectedAt,
        newLaws: (diff.diffData as any).newLaws || [],
        modifiedLaws: (diff.diffData as any).modifiedLaws || [],
        removedLaws: (diff.diffData as any).removedLaws || [],
        summary: diff.summary as any
      }))

      return ok(result)
    } catch (error) {
      return err(`最近の差分の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async saveComprehensiveMonitoring(monitoring: ComprehensiveMonitoring): Promise<Result<void, string>> {
    try {
      await this.prisma.comprehensiveMonitoring.create({
        data: {
          id: monitoring.id,
          userId: monitoring.userId,
          name: monitoring.name,
          isActive: monitoring.isActive,
          settings: monitoring.settings as any,
          createdAt: monitoring.createdAt,
          updatedAt: monitoring.updatedAt,
          lastCheckAt: monitoring.lastCheckAt || undefined
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`包括的監視の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getComprehensiveMonitoringByUserId(userId: string): Promise<Result<ComprehensiveMonitoring[], string>> {
    try {
      const monitorings = await this.prisma.comprehensiveMonitoring.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      const result = monitorings.map(monitoring => ({
        id: monitoring.id,
        userId: monitoring.userId,
        name: monitoring.name,
        isActive: monitoring.isActive,
        settings: monitoring.settings as any,
        createdAt: monitoring.createdAt,
        updatedAt: monitoring.updatedAt,
        lastCheckAt: monitoring.lastCheckAt || undefined
      }))

      return ok(result)
    } catch (error) {
      return err(`ユーザーの包括的監視の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getActiveComprehensiveMonitoring(): Promise<Result<ComprehensiveMonitoring[], string>> {
    try {
      const monitorings = await this.prisma.comprehensiveMonitoring.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })

      const result = monitorings.map(monitoring => ({
        id: monitoring.id,
        userId: monitoring.userId,
        name: monitoring.name,
        isActive: monitoring.isActive,
        settings: monitoring.settings as any,
        createdAt: monitoring.createdAt,
        updatedAt: monitoring.updatedAt,
        lastCheckAt: monitoring.lastCheckAt || undefined
      }))

      return ok(result)
    } catch (error) {
      return err(`アクティブな包括的監視の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async updateComprehensiveMonitoring(monitoring: ComprehensiveMonitoring): Promise<Result<void, string>> {
    try {
      await this.prisma.comprehensiveMonitoring.update({
        where: { id: monitoring.id },
        data: {
          name: monitoring.name,
          isActive: monitoring.isActive,
          settings: monitoring.settings as any,
          updatedAt: monitoring.updatedAt,
          lastCheckAt: monitoring.lastCheckAt || undefined
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`包括的監視の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async deleteComprehensiveMonitoring(id: string): Promise<Result<void, string>> {
    try {
      await this.prisma.comprehensiveMonitoring.delete({
        where: { id }
      })

      return ok(undefined)
    } catch (error) {
      return err(`包括的監視の削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async saveComprehensiveNotification(notification: ComprehensiveMonitoringNotification): Promise<Result<void, string>> {
    try {
      await this.prisma.comprehensiveNotification.create({
        data: {
          id: notification.id,
          monitoringId: notification.monitoringId,
          userId: notification.userId,
          title: notification.title,
          summary: notification.summary,
          diffData: notification.diff as any,
          notificationType: notification.notificationType,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          readAt: notification.readAt || undefined
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`包括的通知の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async getComprehensiveNotificationsByUserId(userId: string): Promise<Result<ComprehensiveMonitoringNotification[], string>> {
    try {
      const notifications = await this.prisma.comprehensiveNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50 // 最新50件を取得
      })

      const result = notifications.map(notification => ({
        id: notification.id,
        monitoringId: notification.monitoringId,
        userId: notification.userId,
        title: notification.title,
        summary: notification.summary,
        diff: notification.diffData as any,
        notificationType: notification.notificationType as any,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        readAt: notification.readAt || undefined
      }))

      return ok(result)
    } catch (error) {
      return err(`ユーザーの包括的通知の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<Result<void, string>> {
    try {
      await this.prisma.comprehensiveNotification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return ok(undefined)
    } catch (error) {
      return err(`通知の既読マークに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}