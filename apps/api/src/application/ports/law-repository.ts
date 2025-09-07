import { Law, LawId, SearchQuery, SearchResult } from '../../domain/law'

export interface LawRepository {
  save(law: Law): Promise<void>
  findById(id: LawId): Promise<Law | null>
  search(query: SearchQuery): Promise<SearchResult>
}
