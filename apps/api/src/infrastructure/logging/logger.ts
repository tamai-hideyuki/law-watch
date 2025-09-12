export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  [key: string]: any
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
}

class ConsoleLogger implements Logger {
  private readonly logLevel: LogLevel
  private readonly serviceName: string

  constructor(serviceName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName
    this.logLevel = logLevel
  }

  debug(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, context)
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.log('INFO', message, context)
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.log('WARN', message, context)
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, context)
    }
  }

  private log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...(context && { context })
    }

    // 開発環境では読みやすい形式で出力
    if (process.env.NODE_ENV === 'development') {
      const emoji = this.getEmoji(level)
      const contextStr = context ? ` ${JSON.stringify(context, null, 2)}` : ''
      console.log(`${emoji} [${level}] ${this.serviceName}: ${message}${contextStr}`)
    } else {
      // 本番環境ではJSON形式で出力（ログ収集ツール用）
      console.log(JSON.stringify(logEntry))
    }
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'DEBUG': return '🔍'
      case 'INFO': return '📧'
      case 'WARN': return '⚠️'
      case 'ERROR': return '🚨'
      default: return '📝'
    }
  }
}

// ファクトリー関数
export const createLogger = (serviceName: string): Logger => {
  const logLevel = process.env.LOG_LEVEL 
    ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] 
    : LogLevel.INFO
  
  return new ConsoleLogger(serviceName, logLevel)
}

// デフォルトLogger
export const logger = createLogger('law-watch-api')