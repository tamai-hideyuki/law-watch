import { LawId } from '../../law'

export interface WatchList {
  readonly id: string
  readonly userId: string
  readonly name: string
  readonly lawIds: readonly LawId[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

export const createWatchList = (params: {
    id: string
    userId: string
    name: string
}): WatchList => {
    const now = new Date()
    
    return {
        id: params.id,
        userId: params.userId,
        name: params.name,
        lawIds: [],
        createdAt: now,
        updatedAt: now
    }
}
export const removeLawFromWatchList = (watchList: WatchList, lawId: LawId): WatchList => {
    return {
        ...watchList,
        lawIds: watchList.lawIds.filter(id => id !== lawId),
        updatedAt: new Date()
    }
}

export const addLawToWatchList = (watchList: WatchList, lawId: LawId): WatchList => {
    if (watchList.lawIds.includes(lawId)) {
        return watchList
    }

    return {
        ...watchList,
        lawIds: [...watchList.lawIds, lawId],
        updatedAt: new Date()
    }
}
