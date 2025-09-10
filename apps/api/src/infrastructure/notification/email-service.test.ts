import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailService } from './email-service'

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 環境変数をモック
    process.env.NOTIFICATION_EMAIL_FROM = 'noreply@lawwatch.com'
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@gmail.com'
    process.env.SMTP_PASS = 'test-password'
    
    emailService = new EmailService()
  })

  it('法改正通知メールを送信する', async () => {
    // Arrange
    const notification = {
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      lawId: '322AC0000000049',
      detectedAt: new Date()
    }

    // Act
    const result = await emailService.sendLawChangeNotification(
      'user@example.com',
      notification
    )

    // Assert
    expect(result.success).toBe(true)
  })
})
