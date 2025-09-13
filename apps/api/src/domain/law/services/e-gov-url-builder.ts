import { LawId } from '../value-objects'

/**
 * e-Gov法令検索システムのURL生成サービス
 * 
 * e-Gov法令検索のURL構造:
 * https://laws.e-gov.go.jp/law/{法令ID}
 * 
 * 例:
 * - 労働基準法: https://laws.e-gov.go.jp/law/322AC0000000049
 * - 建築基準法: https://laws.e-gov.go.jp/law/325AC1000000201
 */
export class EGovUrlBuilder {
  private static readonly E_GOV_BASE_URL = 'https://laws.e-gov.go.jp'

  /**
   * 法令IDからe-Gov法令検索の詳細ページURLを生成
   * @param lawId 法令ID
   * @returns e-Gov法令検索の詳細ページURL
   */
  static buildLawDetailUrl(lawId: LawId): string {
    return `${this.E_GOV_BASE_URL}/law/${lawId}`
  }

  /**
   * 法令IDからe-Gov法令検索の詳細ページURLを生成（文字列版）
   * @param lawIdString 法令ID文字列
   * @returns e-Gov法令検索の詳細ページURL
   */
  static buildLawDetailUrlFromString(lawIdString: string): string {
    if (!lawIdString || lawIdString.trim().length === 0) {
      throw new Error('Law ID cannot be empty')
    }
    
    // 法令IDの基本的なフォーマット検証
    const lawIdPattern = /^[0-9A-Z]{15}$/
    if (!lawIdPattern.test(lawIdString)) {
      throw new Error(`Invalid law ID format: ${lawIdString}`)
    }
    
    return `${this.E_GOV_BASE_URL}/law/${lawIdString}`
  }

  /**
   * e-Gov法令検索のトップページURLを取得
   * @returns e-Gov法令検索のトップページURL
   */
  static getSearchTopUrl(): string {
    return this.E_GOV_BASE_URL
  }

  /**
   * キーワード検索URLを生成
   * @param keyword 検索キーワード
   * @returns e-Gov法令検索のキーワード検索URL
   */
  static buildKeywordSearchUrl(keyword: string): string {
    if (!keyword || keyword.trim().length === 0) {
      throw new Error('Search keyword cannot be empty')
    }
    
    const encodedKeyword = encodeURIComponent(keyword.trim())
    return `${this.E_GOV_BASE_URL}/search/elawsSearch/elaws_search/lsg0100/?searchWord=${encodedKeyword}`
  }
}