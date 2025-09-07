import { describe, it, expect } from 'vitest'
import { createLawChangeNotification, ChangeType, markAsRead } from './law-change-notification'
import { createLawId } from '../../law'

describe('LawChangeNotification', () => {
  it('法令変更通知を作成する', () => {
    // Arrange & Act
    const notification = createLawChangeNotification({
      id: 'notification-001',
      lawId: createLawId('322AC0000000049'),
      changeType: ChangeType.CONTENT_UPDATED,
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      detectedAt: new Date('2025-09-07T10:00:00Z')
    })

    // Assert
    expect(notification.id).toBe('notification-001')
    expect(notification.changeType).toBe(ChangeType.CONTENT_UPDATED)
    expect(notification.title).toBe('労働基準法の改正')
    expect(notification.isRead).toBe(false)
  })

  it('通知を既読にする', () => {
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
    const readNotification = markAsRead(notification)

    // Assert
    expect(readNotification.isRead).toBe(true)
    expect(readNotification.readAt).toBeInstanceOf(Date)
  })
})
