import { EGovApi, EGovSearchResponse, EGovLawData } from '../../application/ports/e-gov-api'
import { SearchQuery, LawId } from '../../domain/law'

export class MockEGovClient implements EGovApi {
  async searchLaws(query: SearchQuery): Promise<EGovSearchResponse> {

    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (query.keyword.includes('労働')) {
      return {
        laws: [
          {
            id: '322AC0000000049',
            name: '労働基準法',
            number: '昭和二十二年法律第四十九号',
            promulgationDate: '1947-04-07',
            category: '憲法・法律',
            status: '施行中'
          },
          {
            id: '347AC0000000057',
            name: '労働安全衛生法',
            number: '昭和四十七年法律第五十七号',
            promulgationDate: '1972-06-08',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 2
      }
    }

    return { laws: [], totalCount: 0 }
  }

  async getLawDetail(id: LawId): Promise<EGovLawData> {
    throw new Error('Not implemented yet')
  }
}
