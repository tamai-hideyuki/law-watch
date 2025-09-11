import { LawId } from '../../law'
import { LawRegistryDiff, LawRegistryChangeType } from './law-registry-snapshot'

/**
 * 包括的法令監視設定
 * 全法令の新規追加・変更・廃止を監視する設定
 */
export interface ComprehensiveMonitoring {
  readonly id: string
  readonly userId: string
  readonly name: string
  readonly isActive: boolean
  readonly settings: ComprehensiveMonitoringSettings
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly lastCheckAt?: Date
}

export interface ComprehensiveMonitoringSettings {
  readonly targetCategories: string[] // 空の場合は全カテゴリ
  readonly changeTypes: LawRegistryChangeType[] // 監視する変更種別
  readonly notificationSettings: NotificationSettings
  readonly checkInterval: CheckInterval
}

export interface NotificationSettings {
  readonly email: boolean
  readonly immediateNotify: boolean // 変更検知時即座に通知
  readonly dailySummary: boolean // 日次サマリー通知
  readonly weeklySummary: boolean // 週次サマリー通知
  readonly threshold: NotificationThreshold
}

export interface NotificationThreshold {
  readonly minNewLaws: number // 新規法令の最小通知件数
  readonly minModifiedLaws: number // 変更法令の最小通知件数
  readonly minRemovedLaws: number // 廃止法令の最小通知件数
}

export enum CheckInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MANUAL = 'manual'
}

/**
 * 包括的監視の通知
 */
export interface ComprehensiveMonitoringNotification {
  readonly id: string
  readonly monitoringId: string
  readonly userId: string
  readonly title: string
  readonly summary: string
  readonly diff: LawRegistryDiff
  readonly notificationType: ComprehensiveNotificationType
  readonly isRead: boolean
  readonly createdAt: Date
  readonly readAt?: Date
}

export enum ComprehensiveNotificationType {
  IMMEDIATE = 'immediate',
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary'
}

export const createComprehensiveMonitoring = (params: {
  id: string
  userId: string
  name: string
  settings: ComprehensiveMonitoringSettings
}): ComprehensiveMonitoring => {
  return {
    id: params.id,
    userId: params.userId,
    name: params.name,
    isActive: true,
    settings: params.settings,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastCheckAt: undefined
  }
}

export const getDefaultComprehensiveMonitoringSettings = (): ComprehensiveMonitoringSettings => {
  return {
    targetCategories: [], // 全カテゴリを監視
    changeTypes: [
      LawRegistryChangeType.NEW,
      LawRegistryChangeType.MODIFIED,
      LawRegistryChangeType.REMOVED
    ],
    notificationSettings: {
      email: true,
      immediateNotify: true,
      dailySummary: false,
      weeklySummary: true,
      threshold: {
        minNewLaws: 1,
        minModifiedLaws: 1,
        minRemovedLaws: 1
      }
    },
    checkInterval: CheckInterval.DAILY
  }
}

export const createComprehensiveMonitoringNotification = (params: {
  id: string
  monitoringId: string
  userId: string
  title: string
  summary: string
  diff: LawRegistryDiff
  notificationType: ComprehensiveNotificationType
}): ComprehensiveMonitoringNotification => {
  return {
    id: params.id,
    monitoringId: params.monitoringId,
    userId: params.userId,
    title: params.title,
    summary: params.summary,
    diff: params.diff,
    notificationType: params.notificationType,
    isRead: false,
    createdAt: new Date(),
    readAt: undefined
  }
}

export const shouldNotify = (
  diff: LawRegistryDiff,
  settings: ComprehensiveMonitoringSettings
): boolean => {
  const { threshold } = settings.notificationSettings
  
  return (
    diff.summary.totalNew >= threshold.minNewLaws ||
    diff.summary.totalModified >= threshold.minModifiedLaws ||
    diff.summary.totalRemoved >= threshold.minRemovedLaws
  )
}

export const isTargetCategory = (
  category: string,
  settings: ComprehensiveMonitoringSettings
): boolean => {
  // 空の場合は全カテゴリが対象
  if (settings.targetCategories.length === 0) {
    return true
  }
  
  return settings.targetCategories.includes(category)
}

export const updateLastCheck = (monitoring: ComprehensiveMonitoring): ComprehensiveMonitoring => {
  return {
    ...monitoring,
    lastCheckAt: new Date(),
    updatedAt: new Date()
  }
}