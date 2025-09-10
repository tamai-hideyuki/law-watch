import { SimpleSearchQuery as SearchQuery, SimpleSearchResult as SearchResult, createSimpleSearchResult as createSearchResult, createLaw } from '../../domain/law'
import { LawRepository } from '../ports/law-repository'
import { EGovApi } from '../ports/e-gov-api'

export class SearchLawsUseCase {
  constructor(
    private readonly lawRepository: LawRepository,
    private readonly egovApi: EGovApi
  ) {}

  async execute(query: SearchQuery): Promise<SearchResult> {
    const apiResponse = await this.egovApi.searchLaws(query)
    
    const laws = apiResponse.laws.map(lawData => 
      createLaw({
        id: lawData.id,
        name: lawData.name,
        number: lawData.number,
        promulgationDate: new Date(lawData.promulgationDate),
        category: lawData.category,
        status: lawData.status
      })
    )

    return createSearchResult(laws, apiResponse.totalCount, query.keyword)
  }
}