import { LawChangeNotification } from '../../domain/monitoring/entities/law-change-notification'

export interface NotificationRepository {
  save(notification: LawChangeNotification): Promise<void>
  findByUserId(userId: string): Promise<LawChangeNotification[]>
  markAsRead(notificationId: string): Promise<void>
}
