import { PrismaClient } from '@prisma/client'
import { LawSnapshot } from '../../domain/monitoring/entities/law-snapshot'
import { createLogger } from '../logging/logger'

export interface SnapshotRepository {
  save(snapshot: LawSnapshot): Promise<void>
  findByLawId(lawId: string): Promise<LawSnapshot | null>
  update(snapshot: LawSnapshot): Promise<void>
  findStaleSnapshots(hours: number): Promise<LawSnapshot[]>
}

export class PrismaSnapshotRepository implements SnapshotRepository {
  private readonly logger = createLogger('PrismaSnapshotRepository')

  constructor(private readonly prisma: PrismaClient) {}

  async save(snapshot: LawSnapshot): Promise<void> {
    try {
      await this.prisma.lawSnapshot.create({
        data: {
          lawId: snapshot.lawId,
          contentHash: snapshot.contentHash,
          metadata: snapshot.metadata,
          lastContent: snapshot.lastContent,
          version: snapshot.version,
          lastChecked: snapshot.lastChecked
        }
      })

      this.logger.info('Snapshot saved', {
        lawId: snapshot.lawId,
        hashPrefix: snapshot.contentHash.substring(0, 8)
      })
    } catch (error) {
      this.logger.error('Failed to save snapshot', {
        lawId: snapshot.lawId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async findByLawId(lawId: string): Promise<LawSnapshot | null> {
    try {
      const snapshot = await this.prisma.lawSnapshot.findUnique({
        where: { lawId }
      })

      if (!snapshot) {
        this.logger.debug('Snapshot not found', { lawId })
        return null
      }

      this.logger.debug('Snapshot found', {
        lawId,
        lastChecked: snapshot.lastChecked
      })

      return {
        id: snapshot.id,
        lawId: snapshot.lawId,
        contentHash: snapshot.contentHash,
        metadata: snapshot.metadata as any,
        lastContent: snapshot.lastContent || undefined,
        version: snapshot.version || undefined,
        lastChecked: snapshot.lastChecked,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt
      }
    } catch (error) {
      this.logger.error('Failed to find snapshot', {
        lawId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async update(snapshot: LawSnapshot): Promise<void> {
    try {
      await this.prisma.lawSnapshot.update({
        where: { lawId: snapshot.lawId },
        data: {
          contentHash: snapshot.contentHash,
          metadata: snapshot.metadata,
          lastContent: snapshot.lastContent,
          version: snapshot.version,
          lastChecked: snapshot.lastChecked
        }
      })

      this.logger.info('Snapshot updated', {
        lawId: snapshot.lawId,
        hashPrefix: snapshot.contentHash.substring(0, 8)
      })
    } catch (error) {
      this.logger.error('Failed to update snapshot', {
        lawId: snapshot.lawId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async findStaleSnapshots(hours: number): Promise<LawSnapshot[]> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - hours)

      const snapshots = await this.prisma.lawSnapshot.findMany({
        where: {
          lastChecked: {
            lt: cutoffDate
          }
        }
      })

      this.logger.info('Found stale snapshots', {
        count: snapshots.length,
        cutoffHours: hours
      })

      return snapshots.map(snapshot => ({
        id: snapshot.id,
        lawId: snapshot.lawId,
        contentHash: snapshot.contentHash,
        metadata: snapshot.metadata as any,
        lastContent: snapshot.lastContent || undefined,
        version: snapshot.version || undefined,
        lastChecked: snapshot.lastChecked,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt
      }))
    } catch (error) {
      this.logger.error('Failed to find stale snapshots', {
        hours,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}