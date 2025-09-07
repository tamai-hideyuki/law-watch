import { describe, it, expect, beforeEach } from 'vitest'
import { MockNotificationRepository } from './mock-notification-repository'
import { createLawChangeNotification, ChangeType } from '../../domain/monitoring/entities/law-change-notification'
import { createLawId } from '../../domain/law'

describe('MockNotificationRepository', () => {
  let repository: MockNotificationRepository

  beforeEach(() => {
    repository = new MockNotificationRepository()
  })

  it('通知を保存して取得する', async () => {
    // Arrange
    const notification = createLawChangeNotification({
      id: 'notification-001',
      lawId: createLawId('322AC0000000049'),
      changeType: ChangeType.CONTENT_UPDATED,
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      detectedAt: new Date()
    })

    // Act
    await repository.save(notification)
    const userNotifications = await repository.findByUserId('user-001')

    // Assert
    expect(userNotifications).toHaveLength(1)
    expect(userNotifications[0].title).toBe('労働基準法の改正')
  })

  it('通知を既読にする', async () => {
    // Arrange
    const notification = createLawChangeNotification({
      id: 'notification-001',
      lawId: createLawId('322AC0000000049'),
      changeType: ChangeType.CONTENT_UPDATED,
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      detectedAt: new Date()
    })
    await repository.save(notification)

    // Act
    await repository.markAsRead('notification-001')
    const userNotifications = await repository.findByUserId('user-001')

    // Assert
    expect(userNotifications[0].isRead).toBe(true)
  })
})
