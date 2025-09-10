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
    private smtpConfig: {
      host: string
      port: number
      user: string
      pass: string
    }
  
    constructor() {
      this.smtpConfig = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
  
      this.validateConfig()
    }
  
    private validateConfig(): void {
      if (!process.env.NOTIFICATION_EMAIL_FROM) {
        throw new Error('NOTIFICATION_EMAIL_FROM environment variable is not set')
      }
      
      if (!this.smtpConfig.host || !this.smtpConfig.user || !this.smtpConfig.pass) {
        throw new Error('SMTP configuration is incomplete')
      }
    }
  
    async sendLawChangeNotification(
      toEmail: string,
      notification: LawChangeNotification
    ): Promise<EmailSendResult> {
      try {
        // メールアドレスのバリデーション
        this.validateEmail(toEmail)
        
        // メール内容の構築
        const subject = `【法改正通知】${notification.title}`
        const htmlContent = this.buildEmailContent(notification)
        
        // 実際のメール送信処理（ここではモック実装）
        const messageId = await this.sendEmail({
          from: process.env.NOTIFICATION_EMAIL_FROM!,
          to: toEmail,
          subject,
          html: htmlContent
        })
  
        return {
          success: true,
          messageId
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
  
    private async sendEmail(emailData: {
      from: string
      to: string
      subject: string
      html: string
    }): Promise<string> {
      // 実際のSMTP送信処理はここに実装
      // 現在はモック実装として、常に成功を返す
      console.log('Sending email:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject
      })
      
      // モック用のメッセージIDを生成
      return `mock-${Date.now()}`
    }
  }
  