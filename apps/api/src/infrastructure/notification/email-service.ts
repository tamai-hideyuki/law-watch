import nodemailer, { Transporter } from 'nodemailer'
import { createLogger } from '../logging/logger'

export interface LawChangeNotification {
    title: string
    description: string
    lawId: string
    detectedAt: Date
  }
  
  export interface EmailSendResult {
    success: boolean
    messageId?: string
    error?: string
  }
  
  export class EmailService {
    private transporter: Transporter | null = null
    private readonly logger = createLogger('EmailService')
  
    async initialize() {
      // Ethereal用テストアカウント自動作成
      const testAccount = await nodemailer.createTestAccount()
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      })
      
      this.logger.info('Ethereal Email initialized', { account: testAccount.user })
    }
  
    async sendLawChangeNotification(
      toEmail: string,
      notification: LawChangeNotification
    ): Promise<EmailSendResult> {
      try {
        // 初期化されていない場合は初期化
        if (!this.transporter) {
          await this.initialize()
        }
        
        // メールアドレスのバリデーション
        this.validateEmail(toEmail)
        
        if (!this.transporter) {
          throw new Error('Email transporter not initialized')
        }
        
        // メール送信
        const info = await this.transporter.sendMail({
          from: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@lawwatch.com',
          to: toEmail,
          subject: `【法改正通知】${notification.title}`,
          html: this.buildEmailContent(notification)
        })
        
        this.logger.info('Email sent successfully', {
          messageId: info.messageId,
          previewUrl: nodemailer.getTestMessageUrl(info),
          recipient: toEmail
        })
  
        return {
          success: true,
          messageId: info.messageId
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  
    private validateEmail(email: string): void {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }
    }
  
    private buildEmailContent(notification: LawChangeNotification): string {
      return `
        <html>
          <body>
            <h2>法改正通知</h2>
            <h3>${notification.title}</h3>
            <p>${notification.description}</p>
            <p><strong>法令ID:</strong> ${notification.lawId}</p>
            <p><strong>検出日時:</strong> ${notification.detectedAt.toLocaleString('ja-JP')}</p>
            <hr>
            <p>このメールは自動送信されています。</p>
          </body>
        </html>
      `
    }
  
  }
  