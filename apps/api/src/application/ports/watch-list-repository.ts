import { WatchList } from '../../domain/monitoring/entities/watch-list'

export interface WatchListRepository {
  save(watchList: WatchList): Promise<void>
  findById(id: string): Promise<WatchList | null>
  findByUserId(userId: string): Promise<WatchList[]>
  findAll(): Promise<WatchList[]>
  delete(id: string): Promise<void>
}
