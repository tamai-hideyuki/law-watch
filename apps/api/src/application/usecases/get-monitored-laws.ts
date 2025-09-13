import { LawRepository } from '../ports/law-repository'
import { createLogger } from '../../infrastructure/logging/logger'
import { EGovUrlBuilder } from '../../domain/law/services/e-gov-url-builder'

export interface MonitoredLawData {
  id: string
  name: string
  number: string
  category: string
  status: string
  promulgationDate: string
  detailUrl: string
}

export interface GetMonitoredLawsResult {
  laws: MonitoredLawData[]
  totalCount: number
  executedAt: string
}

export class GetMonitoredLawsUseCase {
  private readonly logger = createLogger('GetMonitoredLawsUseCase')

  constructor(
    private readonly lawRepository: LawRepository
  ) {}

  async execute(): Promise<GetMonitoredLawsResult> {
    this.logger.info('Getting all monitored laws from database')
    
    // データベースに保存されている法令（= 監視対象として登録された法令）のみを取得
    const laws = await this.lawRepository.findAll()
    
    const monitoredLaws: MonitoredLawData[] = laws.map(law => ({
      id: law.id,
      name: law.name,
      number: law.number,
      category: law.category,
      status: law.status,
      promulgationDate: law.promulgationDate.toISOString(),
      detailUrl: EGovUrlBuilder.buildLawDetailUrlFromString(law.id)
    }))

    this.logger.info('Retrieved monitored laws', { count: monitoredLaws.length })

    return {
      laws: monitoredLaws,
      totalCount: monitoredLaws.length,
      executedAt: new Date().toISOString()
    }
  }
}