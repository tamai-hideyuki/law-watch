import { Result } from '../../domain/common/result'
import { LawRegistrySnapshot, LawRegistryDiff } from '../../domain/monitoring/entities/law-registry-snapshot'
import { ComprehensiveMonitoring, ComprehensiveMonitoringNotification } from '../../domain/monitoring/entities/comprehensive-monitoring'

export interface LawRegistryRepository {
  saveLawRegistrySnapshot(snapshot: LawRegistrySnapshot): Promise<Result<void, string>>
  getLatestSnapshot(): Promise<Result<LawRegistrySnapshot | null, string>>
  getSnapshotById(id: string): Promise<Result<LawRegistrySnapshot | null, string>>
  
  saveLawRegistryDiff(diff: LawRegistryDiff): Promise<Result<void, string>>
  getRecentDiffs(limit?: number): Promise<Result<LawRegistryDiff[], string>>
  
  saveComprehensiveMonitoring(monitoring: ComprehensiveMonitoring): Promise<Result<void, string>>
  getComprehensiveMonitoringByUserId(userId: string): Promise<Result<ComprehensiveMonitoring[], string>>
  getActiveComprehensiveMonitoring(): Promise<Result<ComprehensiveMonitoring[], string>>
  updateComprehensiveMonitoring(monitoring: ComprehensiveMonitoring): Promise<Result<void, string>>
  deleteComprehensiveMonitoring(id: string): Promise<Result<void, string>>
  
  saveComprehensiveNotification(notification: ComprehensiveMonitoringNotification): Promise<Result<void, string>>
  getComprehensiveNotificationsByUserId(userId: string): Promise<Result<ComprehensiveMonitoringNotification[], string>>
  markNotificationAsRead(notificationId: string): Promise<Result<void, string>>
}