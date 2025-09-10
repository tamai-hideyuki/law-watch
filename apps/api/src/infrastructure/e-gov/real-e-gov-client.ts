import { EGovApi, EGovSearchResponse, EGovLawData } from '../../application/ports/e-gov-api'
import { SimpleSearchQuery as SearchQuery, LawId } from '../../domain/law'
import { createLogger } from '../logging/logger'
import { RateLimiter } from './rate-limiter'

interface EGovLawListItem {
  法令ID: string
  法令名: string
  法令番号: string
  公布年月日: string
  種別: string
  効力: string
}

interface EGovLawListResponse {
  DataRoot: {
    法令一覧情報: {
      法令: EGovLawListItem[]
    }
  }
}

interface EGovLawDetailResponse {
  DataRoot: {
    法令: {
      法令ID: string
      法令名: string
      法令番号: string
      公布年月日: string
      種別: string
      効力: string
    }
  }
}

export class RealEGovClient implements EGovApi {
  private readonly baseUrl = process.env.E_GOV_API_BASE_URL || 'https://laws.e-gov.go.jp/api/1'
  private readonly logger = createLogger('RealEGovClient')
  private readonly timeout = parseInt(process.env.E_GOV_API_TIMEOUT || '10000')
  private readonly rateLimiter: RateLimiter

  constructor() {
    const rateLimit = parseInt(process.env.E_GOV_API_RATE_LIMIT || '100')
    this.rateLimiter = new RateLimiter({
      maxRequests: rateLimit,
      windowMs: 60 * 1000 // 1分間のウィンドウ
    })

    this.logger.info('RealEGovClient initialized', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      rateLimit
    })
  }

  async searchLaws(query: SearchQuery): Promise<EGovSearchResponse> {
    await this.rateLimiter.waitForSlot()
    this.logger.info('Searching laws', { query: query.keyword })

    try {
      // 全法令一覧を取得
      if (query.keyword === '__ALL_LAWS__' || !query.keyword || query.keyword.trim() === '') {
        return await this.getAllLaws()
      }

      // キーワード検索の場合は、全法令を取得してフィルタリング
      // e-Gov API v1には直接的な検索機能がないため
      const allLaws = await this.getAllLaws()
      const filteredLaws = allLaws.laws.filter(law => 
        law.name.includes(query.keyword) || 
        law.number.includes(query.keyword)
      )

      this.logger.info('Search completed', { 
        keyword: query.keyword,
        totalFound: filteredLaws.length 
      })

      return {
        laws: filteredLaws,
        totalCount: filteredLaws.length
      }
    } catch (error) {
      this.logger.error('Search failed', { 
        keyword: query.keyword,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async getLawDetail(id: LawId): Promise<EGovLawData> {
    await this.rateLimiter.waitForSlot()
    this.logger.info('Getting law detail', { lawId: id })

    try {
      const url = `${this.baseUrl}/lawdata/${id}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'LawWatch/1.0.0'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const xmlText = await response.text()
      const lawData = await this.parseXmlToLawData(xmlText, id)

      this.logger.info('Law detail retrieved successfully', { lawId: id })
      return lawData

    } catch (error) {
      this.logger.error('Failed to get law detail', {
        lawId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private async getAllLaws(): Promise<EGovSearchResponse> {
    const url = `${this.baseUrl}/lawlists/1`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'LawWatch/1.0.0'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const xmlText = await response.text()
      const laws = await this.parseXmlToLawList(xmlText)

      this.logger.info('All laws retrieved successfully', { count: laws.length })

      return {
        laws,
        totalCount: laws.length
      }
    } catch (error) {
      this.logger.error('Failed to get all laws', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private async parseXmlToLawList(xmlText: string): Promise<EGovLawData[]> {
    // XMLパースの簡易実装（実際のe-Gov API形式に対応）
    try {
      // 実際のe-Gov APIの構造: <LawNameListInfo>要素を探す
      const lawPattern = /<LawNameListInfo[^>]*>(.*?)<\/LawNameListInfo>/gs
      const laws: EGovLawData[] = []

      let match
      while ((match = lawPattern.exec(xmlText)) !== null) {
        const lawXml = match[1]
        
        const lawId = this.extractXmlValue(lawXml, 'LawId') || ''
        const lawName = this.extractXmlValue(lawXml, 'LawName') || ''
        const lawNumber = this.extractXmlValue(lawXml, 'LawNo') || ''
        const promulgationDate = this.extractXmlValue(lawXml, 'PromulgationDate') || ''
        
        // e-Gov APIには種別と効力の情報がないため、デフォルト値を設定
        const category = '憲法・法律'
        const status = '施行中' // 法令一覧に含まれているものは基本的に現行法

        if (lawId && lawName) {
          laws.push({
            id: lawId,
            name: lawName,
            number: lawNumber,
            promulgationDate: this.formatDate(promulgationDate),
            category,
            status
          })
        }
      }

      this.logger.debug('Parsed law list', {
        totalLaws: laws.length,
        sampleLaws: laws.slice(0, 3).map(law => ({ id: law.id, name: law.name }))
      })

      return laws
    } catch (error) {
      this.logger.error('Failed to parse XML law list', {
        error: error instanceof Error ? error.message : 'Unknown error',
        xmlSample: xmlText.substring(0, 500)
      })
      throw new Error('Failed to parse law list XML')
    }
  }

  private async parseXmlToLawData(xmlText: string, lawId: string): Promise<EGovLawData> {
    try {
      // 実際のe-Gov API法令詳細の構造に対応
      const lawNumber = this.extractXmlValue(xmlText, 'LawNum') || ''
      const lawTitle = this.extractXmlValue(xmlText, 'LawTitle') || ''
      
      // Law要素から属性を抽出
      const lawElementMatch = xmlText.match(/<Law[^>]+Era="([^"]*)"[^>]+Year="([^"]*)"[^>]+Num="([^"]*)"[^>]+PromulgateMonth="([^"]*)"[^>]+PromulgateDay="([^"]*)"/)
      
      let promulgationDate = ''
      if (lawElementMatch) {
        const era = lawElementMatch[1]
        const year = lawElementMatch[2]
        const month = lawElementMatch[4]
        const day = lawElementMatch[5]
        
        // 元号を西暦に変換（簡易版）
        let westernYear = parseInt(year)
        if (era === 'Showa') {
          westernYear += 1925
        } else if (era === 'Heisei') {
          westernYear += 1988
        } else if (era === 'Reiwa') {
          westernYear += 2018
        }
        
        promulgationDate = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }

      return {
        id: lawId,
        name: lawTitle,
        number: lawNumber,
        promulgationDate,
        category: '憲法・法律',
        status: '施行中'
      }
    } catch (error) {
      this.logger.error('Failed to parse XML law detail', {
        lawId,
        error: error instanceof Error ? error.message : 'Unknown error',
        xmlSample: xmlText.substring(0, 500)
      })
      throw new Error('Failed to parse law detail XML')
    }
  }

  private extractXmlValue(xml: string, tagName: string): string | null {
    const pattern = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i')
    const match = pattern.exec(xml)
    return match ? match[1].trim() : null
  }

  private mapEffectToStatus(effect: string): string {
    // e-Gov APIの効力値をシステムのステータスにマッピング
    switch (effect) {
      case '現行法':
      case '施行':
        return '施行中'
      case '廃止':
        return '廃止'
      case '未施行':
        return '未施行'
      default:
        return '施行中'
    }
  }

  private formatDate(dateString: string): string {
    // e-Gov APIの日付形式（YYYYMMDD）をISO形式に変換
    if (!dateString) return ''
    
    // YYYYMMDD形式（e-Gov APIの標準形式）
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`
    }
    
    // YYYY/MM/DD形式（念のため）
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      }
    }
    
    // その他の形式はそのまま返す
    return dateString
  }
}