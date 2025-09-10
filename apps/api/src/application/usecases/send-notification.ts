import { EmailService, LawChangeNotification as EmailNotification } from '../../infrastructure/notification/email-service'
import { LawChangeNotification } from '../../domain/monitoring/entities/law-change-notification'

export interface SendNotificationResult {
  success: boolean
  error?: string
}

export class SendNotificationUseCase {
  constructor(private emailService: EmailService) {}

  async execute(notification: LawChangeNotification): Promise<SendNotificationResult> {
    try {
      // 環境変数から送信先メールアドレスを取得
      const toEmail = process.env.NOTIFICATION_EMAIL_TO
      
      if (!toEmail) {
        throw new Error('NOTIFICATION_EMAIL_TO environment variable is not set')
      }

      // ドメインオブジェクトをEmailService用の形式に変換
      const emailNotification: EmailNotification = {
        title: notification.title,
        description: notification.description,
        lawId: notification.lawId,
        detectedAt: notification.detectedAt
      }

      // メール送信
      const result = await this.emailService.sendLawChangeNotification(
        toEmail,
        emailNotification
      )

      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
