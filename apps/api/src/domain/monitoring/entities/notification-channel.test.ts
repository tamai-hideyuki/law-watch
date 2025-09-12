import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createEmailChannel, NotificationChannelType } from './notification-channel'

describe('NotificationChannel', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // テスト用の環境変数を設定
    process.env.NOTIFICATION_FROM_EMAIL = 'system@lawwatch.com'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createEmailChannel', () => {
    it('メール通知チャネルを作成する', () => {
      // Act
      const emailChannel = createEmailChannel({
        toEmail: 'user@example.com',
        enabled: true
      })

      // Assert
      expect(emailChannel.type).toBe(NotificationChannelType.EMAIL)
      expect(emailChannel.config.fromEmail).toBe('system@lawwatch.com')
      expect(emailChannel.config.toEmail).toBe('user@example.com')
      expect(emailChannel.enabled).toBe(true)
    })

    it('無効なtoEmailで作成を拒否する', () => {
      // Act & Assert
      expect(() => createEmailChannel({
        toEmail: 'invalid-email',
        enabled: true
      })).toThrow('Invalid toEmail format')
    })

    it('環境変数が設定されていない場合にエラーを投げる', () => {
      // Arrange
      delete process.env.NOTIFICATION_FROM_EMAIL

      // Act & Assert
      expect(() => createEmailChannel({
        toEmail: 'user@example.com',
        enabled: true
      })).toThrow('NOTIFICATION_FROM_EMAIL environment variable is not set')
    })

    it('環境変数のメールアドレスが無効な場合にエラーを投げる', () => {
      // Arrange
      process.env.NOTIFICATION_FROM_EMAIL = 'invalid-email'

      // Act & Assert
      expect(() => createEmailChannel({
        toEmail: 'user@example.com',
        enabled: true
      })).toThrow('Invalid fromEmail format in environment variable')
    })
  })
})
