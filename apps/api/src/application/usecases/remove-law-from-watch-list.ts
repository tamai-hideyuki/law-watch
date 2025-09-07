import { LawId } from '../../domain/law'
import { WatchList, removeLawFromWatchList } from '../../domain/monitoring/entities/watch-list'
import { WatchListRepository } from '../ports/watch-list-repository'

export class RemoveLawFromWatchListUseCase {
  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(watchListId: string, lawId: LawId): Promise<WatchList> {
    const watchList = await this.watchListRepository.findById(watchListId)
    
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    const updatedWatchList = removeLawFromWatchList(watchList, lawId)
    await this.watchListRepository.save(updatedWatchList)
    
    return updatedWatchList
  }
}
