import { SimpleSearchQuery as SearchQuery, LawId } from '../../domain/law'

export interface EGovLawData {
  id: string
  name: string
  number: string
  promulgationDate: string
  category: string
  status: string
}

export interface EGovSearchResponse {
  laws: EGovLawData[]
  totalCount: number
}

export interface EGovApi {
  searchLaws(query: SearchQuery): Promise<EGovSearchResponse>
  getLawDetail(id: LawId): Promise<EGovLawData>
}
