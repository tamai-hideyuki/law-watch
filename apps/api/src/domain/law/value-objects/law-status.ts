export type LawStatus = '施行中' | '廃止' | '改正待ち' | '未施行'

export const LAW_STATUSES = [
    '施行中',
    '廃止',
    '改正待ち',
    '未施行'
] as const

export const isValidLawStatus = (value: string): value is LawStatus => {
    return LAW_STATUSES.includes(value as LawStatus)
}

export const createLawStatus = (value: string): LawStatus => {
    if(!isValidLawStatus(value)) {
        throw new Error(`無効な法律ステータス: $(value)`)
    }
    return value
}

export const isActiveLaw = (status: LawStatus): boolean => {
    return status === '施行中'
}

export const canBeModified = (status: LawStatus): boolean => {
    return status === '施行中' || status === '改正待ち'
}
