import { Law, LawId, LawCategory, SimpleSearchQuery as SearchQuery, SimpleSearchResult as SearchResult } from '../../domain/law'

export interface LawRepository {
  save(law: Law): Promise<Law>
  findById(id: LawId): Promise<Law | null>
  search(query: SearchQuery): Promise<SearchResult>
  findAll(): Promise<Law[]>
  findByIds(ids: LawId[]): Promise<Law[]>
  findByCategory(category: LawCategory): Promise<Law[]>
  delete(id: LawId): Promise<void>
}
