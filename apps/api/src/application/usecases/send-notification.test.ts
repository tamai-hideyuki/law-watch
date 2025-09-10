import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SendNotificationUseCase } from './send-notification'
import { createLawChangeNotification, ChangeType } from '../../domain/monitoring/entities/law-change-notification'
import { createLawId } from '../../domain/law'

describe('SendNotificationUseCase', () => {
  let mockEmailService: any
  let useCase: SendNotificationUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockEmailService = {
      sendLawChangeNotification: vi.fn().mockResolvedValue({ success: true })
    }

    useCase = new SendNotificationUseCase(mockEmailService)
  })

  it('法改正通知を環境変数のメールアドレスに送信する', async () => {
    // Arrange
    process.env.NOTIFICATION_EMAIL_TO = 'admin@lawwatch.com'
    
    const notification = createLawChangeNotification({
      id: 'notification-001',
      lawId: createLawId('322AC0000000049'),
      changeType: ChangeType.CONTENT_UPDATED,
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      detectedAt: new Date()
    })

    // Act
    const result = await useCase.execute(notification)

    // Assert
    expect(result.success).toBe(true)
    expect(mockEmailService.sendLawChangeNotification).toHaveBeenCalledWith(
      'admin@lawwatch.com',
      expect.objectContaining({
        title: '労働基準法の改正',
        description: '第36条が改正されました'
      })
    )
  })
})
