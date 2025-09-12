import { Result, ok, err } from '../../domain/common/result'
import { 
  NationalLawTrackerRepository,
  NationalLawSnapshot,
  LawChangeDetection,
  DailyLawScanResult
} from '../../application/usecases/national-law-tracker'

/**
 * モック実装：本番環境ではPrismaRepositoryに置き換え
 */
export class MockNationalLawTrackerRepository implements NationalLawTrackerRepository {
  private snapshots = new Map<string, NationalLawSnapshot>()
  private changes: LawChangeDetection[] = []
  private scanResults: DailyLawScanResult[] = []

  async saveSnapshot(snapshot: NationalLawSnapshot): Promise<Result<void, string>> {
    try {
      this.snapshots.set(snapshot.lawId, snapshot)
      return ok(undefined)
    } catch (error) {
      return err(`Failed to save snapshot: ${error}`)
    }
  }

  async getLatestSnapshot(lawId: string): Promise<Result<NationalLawSnapshot | null, string>> {
    try {
      const snapshot = this.snapshots.get(lawId) || null
      return ok(snapshot)
    } catch (error) {
      return err(`Failed to get snapshot: ${error}`)
    }
  }

  async getAllLatestSnapshots(): Promise<Result<NationalLawSnapshot[], string>> {
    try {
      const snapshots = Array.from(this.snapshots.values())
      return ok(snapshots)
    } catch (error) {
      return err(`Failed to get all snapshots: ${error}`)
    }
  }

  async saveScanResult(result: DailyLawScanResult): Promise<Result<void, string>> {
    try {
      this.scanResults.push(result)
      return ok(undefined)
    } catch (error) {
      return err(`Failed to save scan result: ${error}`)
    }
  }

  async getLatestScanResult(): Promise<Result<DailyLawScanResult | null, string>> {
    try {
      const latest = this.scanResults[this.scanResults.length - 1] || null
      return ok(latest)
    } catch (error) {
      return err(`Failed to get latest scan result: ${error}`)
    }
  }

  async saveChangeDetection(change: LawChangeDetection): Promise<Result<void, string>> {
    try {
      this.changes.push(change)
      return ok(undefined)
    } catch (error) {
      return err(`Failed to save change detection: ${error}`)
    }
  }

  async getRecentChanges(days: number): Promise<Result<LawChangeDetection[], string>> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const recentChanges = this.changes.filter(
        change => change.detectedAt >= cutoffDate
      )
      
      return ok(recentChanges)
    } catch (error) {
      return err(`Failed to get recent changes: ${error}`)
    }
  }
}