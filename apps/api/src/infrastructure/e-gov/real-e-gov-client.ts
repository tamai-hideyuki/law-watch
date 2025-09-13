import { EGovApi, EGovSearchResponse, EGovLawData, EGovAllLawsResponse } from '../../application/ports/e-gov-api'
import { SimpleSearchQuery as SearchQuery, LawId } from '../../domain/law'
import { createLogger } from '../logging/logger'
import { RateLimiter } from './rate-limiter'

// デフォルト設定を名前付き定数として定義
const DEFAULT_E_GOV_API_BASE_URL = 'https://laws.e-gov.go.jp/api/1'
const DEFAULT_API_TIMEOUT_MS = '10000'
const DEFAULT_RATE_LIMIT = '100'

// 日本の元号から西暦への変換オフセット
const ERA_OFFSETS = {
  SHOWA: 1925,    // 昭和元年 = 1926年（昭和年 + 1925）
  HEISEI: 1988,   // 平成元年 = 1989年（平成年 + 1988）
  REIWA: 2018     // 令和元年 = 2019年（令和年 + 2018）
} as const

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
  private readonly baseUrl = process.env.E_GOV_API_BASE_URL || DEFAULT_E_GOV_API_BASE_URL
  private readonly logger = createLogger('RealEGovClient')
  private readonly timeout = parseInt(process.env.E_GOV_API_TIMEOUT || DEFAULT_API_TIMEOUT_MS)
  private readonly rateLimiter: RateLimiter

  constructor() {
    const rateLimit = parseInt(process.env.E_GOV_API_RATE_LIMIT || DEFAULT_RATE_LIMIT)
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

  async getAllLaws(): Promise<EGovAllLawsResponse> {
    await this.rateLimiter.waitForSlot()
    
    const startTime = Date.now()
    const url = `${this.baseUrl}/lawlists/1`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒タイムアウト（大量データのため）

    this.logger.info('Starting to fetch all laws from real e-Gov API', { 
      url,
      timeout: 60000
    })

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
      this.logger.info('XML response received', { 
        xmlSize: xmlText.length,
        fetchTimeMs: Date.now() - startTime
      })

      const laws = await this.parseXmlToLawList(xmlText)
      
      // 開発・テスト環境では法令数を制限
      const maxLaws = parseInt(process.env.E_GOV_MAX_LAWS || '0')
      const finalLaws = maxLaws > 0 ? laws.slice(0, maxLaws) : laws

      const processingTime = Date.now() - startTime

      this.logger.info('All laws retrieved and parsed successfully', { 
        totalFound: laws.length,
        returned: finalLaws.length,
        totalTimeMs: processingTime,
        limited: maxLaws > 0
      })

      return {
        laws: finalLaws,
        totalCount: finalLaws.length,
        lastUpdated: new Date(),
        version: `egov-v1-${new Date().toISOString().split('T')[0]}`,
        success: true,
        error: ''
      }
    } catch (error) {
      this.logger.error('Failed to get all laws', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - startTime
      })
      
      return {
        laws: [],
        totalCount: 0,
        lastUpdated: new Date(),
        version: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async parseXmlToLawList(xmlText: string): Promise<EGovLawData[]> {
    try {
      // 実際のe-Gov APIの構造: <LawNameListInfo>要素を探す
      const lawPattern = /<LawNameListInfo>(.*?)<\/LawNameListInfo>/gs
      const laws: EGovLawData[] = []

      let match
      while ((match = lawPattern.exec(xmlText)) !== null) {
        const lawXml = match[1]
        
        const lawId = this.extractXmlValue(lawXml, 'LawId') || ''
        const lawName = this.extractXmlValue(lawXml, 'LawName') || ''
        const lawNumber = this.extractXmlValue(lawXml, 'LawNo') || ''
        const promulgationDate = this.extractXmlValue(lawXml, 'PromulgationDate') || ''
        
        // 法令番号から種別を推定
        let category = '法令'
        if (lawNumber.includes('憲法')) {
          category = '憲法'
        } else if (lawNumber.includes('法律')) {
          category = '法律'
        } else if (lawNumber.includes('政令')) {
          category = '政令'
        } else if (lawNumber.includes('省令') || lawNumber.includes('府令')) {
          category = '省令'
        }
        
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

      this.logger.info('Parsed law list from real e-Gov API', {
        totalLaws: laws.length,
        sampleLaws: laws.slice(0, 5).map(law => ({ id: law.id, name: law.name, category: law.category }))
      })

      return laws
    } catch (error) {
      this.logger.error('Failed to parse XML law list', {
        error: error instanceof Error ? error.message : 'Unknown error',
        xmlSample: xmlText.substring(0, 1000)
      })
      throw new Error('Failed to parse law list XML')
    }
  }

  private async parseXmlToLawData(xmlText: string, lawId: string): Promise<EGovLawData> {
    try {
      // 実際のe-Gov API法令詳細の構造に対応
      const lawNumber = this.extractXmlValue(xmlText, 'LawNum') || ''
      const lawTitle = this.extractXmlValue(xmlText, 'LawTitle') || ''

      // Law要素から属性を抽出（属性の順序に依存しない改良版）
      let promulgationDate = ''

      // Era属性を個別に抽出
      const eraMatch = xmlText.match(/<Law[^>]*\sEra="([^"]*)"/)
      const yearMatch = xmlText.match(/<Law[^>]*\sYear="([^"]*)"/)
      const monthMatch = xmlText.match(/<Law[^>]*\sPromulgateMonth="([^"]*)"/)
      const dayMatch = xmlText.match(/<Law[^>]*\sPromulgateDay="([^"]*)"/)

      if (eraMatch && yearMatch && monthMatch && dayMatch) {
        const era = eraMatch[1]
        const year = parseInt(yearMatch[1])
        const month = monthMatch[1]
        const day = dayMatch[1]

        // 元号を西暦に変換
        let westernYear = year
        if (era === 'Showa') {
          westernYear += ERA_OFFSETS.SHOWA
        } else if (era === 'Heisei') {
          westernYear += ERA_OFFSETS.HEISEI
        } else if (era === 'Reiwa') {
          westernYear += ERA_OFFSETS.REIWA
        }

        promulgationDate = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      } else {
        // 日付が取得できない場合はデフォルト値を使用
        this.logger.warn('Could not extract promulgation date from XML', {
          lawId,
          hasEra: !!eraMatch,
          hasYear: !!yearMatch,
          hasMonth: !!monthMatch,
          hasDay: !!dayMatch
        })
        promulgationDate = '1970-01-01' // デフォルト日付
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