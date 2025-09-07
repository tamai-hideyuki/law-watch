import { LawId, LawCategory, LawStatus } from '../value-objects'

export interface Law {
    readonly id: LawId
    readonly name: string
    readonly number: string
    readonly promulgationDate: Date
    readonly category: LawCategory
    readonly status: LawStatus
}
