import { PrismaClient } from '@prisma/client'
import { NotificationRepository } from '../../application/ports/notification-repository'
import { LawChangeNotification, ChangeType } from '../../domain/monitoring/entities/law-change-notification'
import { createLawId } from '../../domain/law'

export class PrismaNotificationRepository implements NotificationRepository {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async save(notification: LawChangeNotification): Promise<void> {
    await this.prisma.notification.create({
      data: {
        id: notification.id,
        lawId: notification.lawId,
        userId: 'user-001', // 現在は固定ユーザー
        changeType: notification.changeType,
        title: notification.title,
        description: notification.description,
        isRead: notification.isRead,
        detectedAt: notification.detectedAt,
        readAt: notification.readAt
      }
    })
  }

  async findById(id: string): Promise<LawChangeNotification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return null
    }

    return {
      id: notification.id,
      lawId: createLawId(notification.lawId),
      changeType: notification.changeType as ChangeType,
      title: notification.title,
      description: notification.description,
      detectedAt: notification.detectedAt,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined
    }
  }

  async findByUserId(userId: string): Promise<LawChangeNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { detectedAt: 'desc' }
    })

    return notifications.map(notification => ({
      id: notification.id,
      lawId: createLawId(notification.lawId),
      changeType: notification.changeType as ChangeType,
      title: notification.title,
      description: notification.description,
      detectedAt: notification.detectedAt,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined
    }))
  }

  async update(notification: LawChangeNotification): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        title: notification.title,
        description: notification.description,
        isRead: notification.isRead,
        readAt: notification.readAt
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id }
    })
  }

  async findByLawId(lawId: string): Promise<LawChangeNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { lawId },
      orderBy: { detectedAt: 'desc' }
    })

    return notifications.map(notification => ({
      id: notification.id,
      lawId: createLawId(notification.lawId),
      changeType: notification.changeType as ChangeType,
      title: notification.title,
      description: notification.description,
      detectedAt: notification.detectedAt,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined
    }))
  }

  async markAsRead(id: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  async findUnreadByUserId(userId: string): Promise<LawChangeNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { 
        userId,
        isRead: false
      },
      orderBy: { detectedAt: 'desc' }
    })

    return notifications.map(notification => ({
      id: notification.id,
      lawId: createLawId(notification.lawId),
      changeType: notification.changeType as ChangeType,
      title: notification.title,
      description: notification.description,
      detectedAt: notification.detectedAt,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined
    }))
  }
}