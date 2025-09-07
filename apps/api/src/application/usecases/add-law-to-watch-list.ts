import { LawId } from '../../domain/law'
import { WatchList, addLawToWatchList } from '../../domain/monitoring/entities/watch-list'
import { WatchListRepository } from '../ports/watch-list-repository'

export class AddLawToWatchListUseCase {
  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(watchListId: string, lawId: LawId): Promise<WatchList> {
    const watchList = await this.watchListRepository.findById(watchListId)
    
    if (!watchList) {
      throw new Error('Watch list not found')
    }

    const updatedWatchList = addLawToWatchList(watchList, lawId)
    await this.watchListRepository.save(updatedWatchList)
    
    return updatedWatchList
  }
}
