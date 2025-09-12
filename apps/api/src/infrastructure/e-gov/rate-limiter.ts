import { createLogger } from '../logging/logger'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RequestRecord {
  timestamp: number
  count: number
}

export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map()
  private logger = createLogger('RateLimiter')

  constructor(private config: RateLimitConfig) {
    this.logger.info('RateLimiter initialized', {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs
    })
  }

  async checkLimit(key: string = 'default'): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // 古いレコードを削除
    this.cleanupOldRequests(key, windowStart)
    
    const currentRequests = this.requests.get(key) || []
    
    if (currentRequests.length >= this.config.maxRequests) {
      this.logger.warn('Rate limit exceeded', {
        key,
        currentRequests: currentRequests.length,
        maxRequests: this.config.maxRequests
      })
      return false
    }

    // 新しいリクエストを記録
    currentRequests.push({ timestamp: now, count: 1 })
    this.requests.set(key, currentRequests)

    this.logger.debug('Rate limit check passed', {
      key,
      currentRequests: currentRequests.length,
      maxRequests: this.config.maxRequests
    })

    return true
  }

  async waitForSlot(key: string = 'default'): Promise<void> {
    const canProceed = await this.checkLimit(key)
    if (canProceed) {
      return
    }

    // 次のスロットまで待機
    const requests = this.requests.get(key) || []
    if (requests.length > 0) {
      const oldestRequest = requests[0]
      const waitTime = Math.max(0, oldestRequest.timestamp + this.config.windowMs - Date.now())
      
      this.logger.info('Waiting for rate limit slot', {
        key,
        waitTimeMs: waitTime
      })

      await new Promise(resolve => setTimeout(resolve, waitTime + 100)) // 100ms buffer
      return this.waitForSlot(key) // 再帰的に確認
    }
  }

  private cleanupOldRequests(key: string, windowStart: number): void {
    const requests = this.requests.get(key)
    if (!requests) return

    const validRequests = requests.filter(req => req.timestamp >= windowStart)
    
    if (validRequests.length === 0) {
      this.requests.delete(key)
    } else {
      this.requests.set(key, validRequests)
    }
  }

  getRemainingRequests(key: string = 'default'): number {
    const requests = this.requests.get(key) || []
    return Math.max(0, this.config.maxRequests - requests.length)
  }

  getResetTime(key: string = 'default'): number {
    const requests = this.requests.get(key)
    if (!requests || requests.length === 0) return 0

    const oldestRequest = requests[0]
    return oldestRequest.timestamp + this.config.windowMs
  }
}