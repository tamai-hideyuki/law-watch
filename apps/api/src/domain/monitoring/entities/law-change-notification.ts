import { LawId } from '../../law'

export interface LawChangeNotification {
  readonly id: string
  readonly lawId: LawId
  readonly changeType: ChangeType
  readonly title: string
  readonly description: string
  readonly detectedAt: Date
  readonly isRead: boolean
  readonly readAt?: Date
}

export enum ChangeType {
  CONTENT_UPDATED = 'content_updated',
  STATUS_CHANGED = 'status_changed',
  NEW_LAW = 'new_law',
  LAW_REPEALED = 'law_repealed'
}

export const createLawChangeNotification = (params: {
  id: string
  lawId: LawId
  changeType: ChangeType
  title: string
  description: string
  detectedAt: Date
}): LawChangeNotification => {
  return {
    id: params.id,
    lawId: params.lawId,
    changeType: params.changeType,
    title: params.title,
    description: params.description,
    detectedAt: params.detectedAt,
    isRead: false, // デフォルトで未読
    readAt: undefined
  }
}

export const markAsRead = (notification: LawChangeNotification): LawChangeNotification => {
  if (notification.isRead) {
    return notification // 既に既読の場合はそのまま返す
  }

  return {
    ...notification,
    isRead: true,
    readAt: new Date()
  }
}

export const markAsUnread = (notification: LawChangeNotification): LawChangeNotification => {
  return {
    ...notification,
    isRead: false,
    readAt: undefined
  }
}

export const isRecentNotification = (notification: LawChangeNotification, hours: number = 24): boolean => {
  const now = new Date()
  const hoursAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000))
  return notification.detectedAt >= hoursAgo
}

export const getNotificationSummary = (notification: LawChangeNotification): string => {
  const changeTypeText = {
    [ChangeType.CONTENT_UPDATED]: '内容更新',
    [ChangeType.STATUS_CHANGED]: 'ステータス変更',
    [ChangeType.NEW_LAW]: '新法制定',
    [ChangeType.LAW_REPEALED]: '法令廃止'
  }

  return `${changeTypeText[notification.changeType]}: ${notification.title}`
}
