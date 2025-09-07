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
          },
          {
            id: '360AC0000000116',
            name: '労働者派遣事業の適正な運営の確保及び派遣労働者の保護等に関する法律',
            number: '昭和六十年法律第八十八号',
            promulgationDate: '1985-07-05',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 3
      }
    }

    if (query.keyword.includes('建築')) {
      return {
        laws: [
          {
            id: '325AC1000000201',
            name: '建築基準法',
            number: '昭和二十五年法律第二百一号',
            promulgationDate: '1950-05-24',
            category: '憲法・法律',
            status: '施行中'
          },
          {
            id: '324AC0000000100',
            name: '建設業法',
            number: '昭和二十四年法律第百号',
            promulgationDate: '1949-05-24',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 2
      }
    }

    if (query.keyword.includes('消費者')) {
      return {
        laws: [
          {
            id: '412AC0000000061',
            name: '消費者契約法',
            number: '平成十二年法律第六十一号',
            promulgationDate: '2000-05-12',
            category: '憲法・法律',
            status: '施行中'
          },
          {
            id: '343AC0000000078',
            name: '消費者基本法',
            number: '昭和四十三年法律第七十八号',
            promulgationDate: '1968-05-30',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 2
      }
    }

    if (query.keyword.includes('環境')) {
      return {
        laws: [
          {
            id: '405AC0000000091',
            name: '環境基本法',
            number: '平成五年法律第九十一号',
            promulgationDate: '1993-11-19',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 1
      }
    }

    if (query.keyword.includes('道路') || query.keyword.includes('交通')) {
      return {
        laws: [
          {
            id: '335AC0000000105',
            name: '道路交通法',
            number: '昭和三十五年法律第百五号',
            promulgationDate: '1960-06-25',
            category: '憲法・法律',
            status: '施行中'
          }
        ],
        totalCount: 1
      }
    }

    return { laws: [], totalCount: 0 }
  }

  async getLawDetail(id: LawId): Promise<EGovLawData> {
    throw new Error('Not implemented yet')
  }
}
