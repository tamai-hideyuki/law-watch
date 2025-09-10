import { Law, LawId, SimpleSearchQuery as SearchQuery, SimpleSearchResult as SearchResult } from '../../domain/law'

export interface LawRepository {
  save(law: Law): Promise<void>
  findById(id: LawId): Promise<Law | null>
  search(query: SearchQuery): Promise<SearchResult>
}
