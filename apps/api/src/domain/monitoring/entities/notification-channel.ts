export enum NotificationChannelType {
    EMAIL = 'EMAIL'
  }
  
  export interface EmailChannelConfig {
    fromEmail: string
    toEmail: string
  }
  
  export interface NotificationChannel {
    type: NotificationChannelType
    config: EmailChannelConfig
    enabled: boolean
  }
  
  export function createEmailChannel(config: {
    toEmail: string
    enabled: boolean
  }): NotificationChannel {
    // 環境変数から送信者メールアドレスを取得
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL
    
    if (!fromEmail) {
      throw new Error('NOTIFICATION_FROM_EMAIL environment variable is not set')
    }
  
    // メールアドレスのバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(fromEmail)) {
      throw new Error('Invalid fromEmail format in environment variable')
    }
    
    if (!emailRegex.test(config.toEmail)) {
      throw new Error('Invalid toEmail format')
    }
  
    return {
      type: NotificationChannelType.EMAIL,
      config: {
        fromEmail,
        toEmail: config.toEmail
      },
      enabled: config.enabled
    }
  }
  