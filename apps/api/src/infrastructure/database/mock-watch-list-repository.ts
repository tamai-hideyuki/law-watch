import { WatchListRepository } from '../../application/ports/watch-list-repository'
import { WatchList } from '../../domain/monitoring/entities/watch-list'

export interface MockWatchListRepository {
  save(watchList: WatchList): Promise<void>
  findById(id: string): Promise<WatchList | null>
  findByUserId(userId: string): Promise<WatchList[]>
  findAll(): Promise<WatchList[]>
}

export class MockWatchListRepository implements WatchListRepository {
  private watchLists: Map<string, WatchList> = new Map()

  async save(watchList: WatchList): Promise<void> {
    // 既存のウォッチリストを更新するか、新しいものを保存したい
    this.watchLists.set(watchList.id, { ...watchList })
  }

  async findById(id: string): Promise<WatchList | null> {
    // 指定されたIDのウォッチリストを取得、存在しない場合はnullにしたい
    const watchList = this.watchLists.get(id)
    return watchList ? { ...watchList } : null
  }

  async findByUserId(userId: string): Promise<WatchList[]> {
    // 指定されたユーザーIDのウォッチリストをすべて取得したい
    const userWatchLists = Array.from(this.watchLists.values())
      .filter(watchList => watchList.userId === userId)
    
    // オブジェクトをコピーして返す（参照の共有を避けたい）
    return userWatchLists.map(watchList => ({ ...watchList }))
  }
  // 全ウォッチリストを取得
  async findAll(): Promise<WatchList[]> {
    return Array.from(this.watchLists.values()).map(watchList => ({ ...watchList }))
  }
}
