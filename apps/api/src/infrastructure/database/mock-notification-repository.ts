import { NotificationRepository } from '../../application/ports/notification-repository'
import { LawChangeNotification, markAsRead } from '../../domain/monitoring/entities/law-change-notification'

export class MockNotificationRepository implements NotificationRepository {
  private notifications: Map<string, LawChangeNotification> = new Map()
  private userNotifications: Map<string, string[]> = new Map() // userId -> notificationIds

  async save(notification: LawChangeNotification): Promise<void> {
    // 通知を保存
    this.notifications.set(notification.id, { ...notification })
    
    // ユーザーIDを取得（実際の実装では、通知からユーザーIDを取得する必要がある）
    // 今回は簡易実装として、すべての通知を 'user-001' に紐付ける
    const userId = 'user-001'
    const userNotificationIds = this.userNotifications.get(userId) || []
    if (!userNotificationIds.includes(notification.id)) {
      userNotificationIds.push(notification.id)
      this.userNotifications.set(userId, userNotificationIds)
    }
  }

  async findByUserId(userId: string): Promise<LawChangeNotification[]> {
    // 指定されたユーザーの通知を取得
    const notificationIds = this.userNotifications.get(userId) || []
    const userNotifications = notificationIds
      .map(id => this.notifications.get(id))
      .filter((notification): notification is LawChangeNotification => notification !== undefined)
    
    // オブジェクトをコピーして返す（参照の共有を避ける）
    return userNotifications.map(notification => ({ ...notification }))
  }

  async markAsRead(notificationId: string): Promise<void> {
    // 通知を既読にする
    const notification = this.notifications.get(notificationId)
    if (notification) {
      const readNotification = markAsRead(notification)
      this.notifications.set(notificationId, readNotification)
    }
  }

  // テスト用のヘルパーメソッド
  clear(): void {
    this.notifications.clear()
    this.userNotifications.clear()
  }

  getAll(): LawChangeNotification[] {
    return Array.from(this.notifications.values()).map(notification => ({ ...notification }))
  }

  findById(notificationId: string): LawChangeNotification | null {
    const notification = this.notifications.get(notificationId)
    return notification ? { ...notification } : null
  }
}
