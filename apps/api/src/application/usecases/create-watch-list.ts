import { WatchListRepository } from '../ports/watch-list-repository'
import { createWatchList } from '../../domain/monitoring/entities/watch-list'

export class CreateWatchListUseCase {
  constructor(
    private readonly watchListRepository: WatchListRepository
  ) {}

  async execute(userId: string, name: string) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID cannot be empty')
    }

    if (!name || name.trim() === '') {
      throw new Error('Watch list name cannot be empty')
    }

    const watchList = createWatchList({
      id: crypto.randomUUID(),
      userId: userId.trim(),
      name: name.trim()
    })

    await this.watchListRepository.save(watchList)

    return watchList
  }
}
