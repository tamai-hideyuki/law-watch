import { EGovApi, EGovSearchResponse, EGovLawData, EGovAllLawsResponse } from '../../application/ports/e-gov-api'
import { SimpleSearchQuery as SearchQuery, LawId } from '../../domain/law'



export class MockEGovClient implements EGovApi {
  private hasChanges: boolean = false

  // 変更をシミュレートするメソッド
  simulateChange(): void {
    this.hasChanges = true
  }

  // 変更をリセットするメソッド
  resetChanges(): void {
    this.hasChanges = false
  }
  private getAllMockData(): EGovLawData[] {
    return [
      // 憲法
      {
        id: '321CONSTITUTION',
        name: '日本国憲法',
        number: '憲法',
        promulgationDate: '1946-11-03',
        category: '憲法・法律',
        status: '施行中'
      },
      // 労働関連
      {
        id: '322AC0000000049',
        name: this.hasChanges ? '労働基準法（令和7年改正版）' : '労働基準法', // 変更をシミュレート
        number: '昭和二十二年法律第四十九号',
        promulgationDate: '1947-04-07',
        category: '憲法・法律',
        status: '施行中'
      },
      // 労働関連
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
      },
      // 建築関連
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
      },
      // 消費者関連
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
      },
      // 環境関連
      {
        id: '405AC0000000091',
        name: '環境基本法',
        number: '平成五年法律第九十一号',
        promulgationDate: '1993-11-19',
        category: '憲法・法律',
        status: '施行中'
      },
      // 交通関連
      {
        id: '335AC0000000105',
        name: '道路交通法',
        number: '昭和三十五年法律第百五号',
        promulgationDate: '1960-06-25',
        category: '憲法・法律',
        status: '施行中'
      },
      // テスト用追加法令
      {
        id: '331AC0000000126',
        name: '食品安全基本法',
        number: '平成十五年法律第四十八号',
        promulgationDate: '2003-05-23',
        category: '憲法・法律',
        status: '施行中'
      },
      {
        id: '414AC0000000037',
        name: '個人情報保護法',
        number: '平成十五年法律第五十七号',
        promulgationDate: '2003-05-30',
        category: '憲法・法律',
        status: '施行中'
      }
    ]
  }
  

  async searchLaws(query: SearchQuery): Promise<EGovSearchResponse> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 全法令取得の場合
    if (query.keyword === '__ALL_LAWS__' || !query.keyword || query.keyword.trim() === '') {
      const allLaws = this.getAllMockData()
      return {
        laws: allLaws,
        totalCount: allLaws.length
      }
    }
    
    // キーワード検索の場合（既存ロジック）
    if (query.keyword.includes('労働')) {
      const filteredLaws = this.getAllMockData().filter(law => law.name.includes('労働'))
      return {
        laws: filteredLaws,
        totalCount: filteredLaws.length
      }
    }

    if (query.keyword.includes('建築')) {
      return {
        laws: this.getAllMockData().filter(law => law.name.includes('建築') || law.name.includes('建設')),
        totalCount: 2
      }
    }

    if (query.keyword.includes('消費者')) {
      return {
        laws: this.getAllMockData().filter(law => law.name.includes('消費者')),
        totalCount: 2
      }
    }

    if (query.keyword.includes('環境')) {
      return {
        laws: this.getAllMockData().filter(law => law.name.includes('環境')),
        totalCount: 1
      }
    }

    if (query.keyword.includes('道路') || query.keyword.includes('交通')) {
      return {
        laws: this.getAllMockData().filter(law => law.name.includes('道路') || law.name.includes('交通')),
        totalCount: 1
      }
    }

    return { laws: [], totalCount: 0 }
  }

  async getLawDetail(id: LawId): Promise<EGovLawData> {
    const allLaws = this.getAllMockData()
    const matchingLaws = allLaws.filter(l => l.id === id)
    
    if (matchingLaws.length === 0) {
      throw new Error(`Law with id ${id} not found`)
    }
    
    // hasChangesフラグがある場合は変更後の状態を、ない場合は最初の要素を返す
    if (this.hasChanges && matchingLaws.length > 1) {
      return matchingLaws[0] // 変更後の状態（hasChangesで条件分岐する最初の要素）
    }
    
    // 重複がある場合は最後の要素（通常の状態）を返す
    return matchingLaws[matchingLaws.length - 1]
  }

  async getAllLaws(): Promise<EGovAllLawsResponse> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const allLaws = this.getAllMockData()
    
    // 重複を除去（法令IDが重複している場合）
    const uniqueLaws = allLaws.reduce((acc, law) => {
      const existing = acc.find(l => l.id === law.id)
      if (!existing) {
        acc.push(law)
      } else if (this.hasChanges && law.name.includes('改正版')) {
        // 変更がある場合は改正版を優先
        const index = acc.findIndex(l => l.id === law.id)
        acc[index] = law
      }
      return acc
    }, [] as EGovLawData[])
    
    return {
      laws: uniqueLaws,
      totalCount: uniqueLaws.length,
      lastUpdated: new Date(),
      version: this.hasChanges ? '2025.1.1' : '2025.1.0'
    }
  }
}
