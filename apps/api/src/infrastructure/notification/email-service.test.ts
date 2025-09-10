import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmailService } from './email-service'
import nodemailer from 'nodemailer'

// nodemailerをモック化
vi.mock('nodemailer', () => ({
  default: {
    createTestAccount: vi.fn(),
    createTransport: vi.fn(),
    getTestMessageUrl: vi.fn()
  }
}))

describe('EmailService', () => {
  let emailService: EmailService
  const mockTransporter = {
    sendMail: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 環境変数をモック
    process.env.NOTIFICATION_EMAIL_FROM = 'noreply@lawwatch.com'
    process.env.SMTP_HOST = 'smtp.gmail.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@gmail.com'
    process.env.SMTP_PASS = 'test-password'
    
    // nodemailerのモックセットアップ
    vi.mocked(nodemailer.createTestAccount).mockResolvedValue({
      user: 'test@ethereal.email',
      pass: 'test-password'
    } as any)
    
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as any)
    vi.mocked(nodemailer.getTestMessageUrl).mockReturnValue('https://ethereal.email/message/test')
    
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

    // sendMailの成功レスポンスをモック
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'test-message-id',
      response: 'OK'
    })

    // Act
    const result = await emailService.sendLawChangeNotification(
      'user@example.com',
      notification
    )

    // Assert
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('test-message-id')
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: 'noreply@lawwatch.com',
      to: 'user@example.com',
      subject: '【法改正通知】労働基準法の改正',
      html: expect.stringContaining('法改正通知')
    })
  })

  it('無効なメールアドレスの場合エラーを返す', async () => {
    // Arrange
    const notification = {
      title: '労働基準法の改正',
      description: '第36条が改正されました',
      lawId: '322AC0000000049',
      detectedAt: new Date()
    }

    // Act
    const result = await emailService.sendLawChangeNotification(
      'invalid-email',
      notification
    )

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid email format')
  })
})
