export type LawCategory = '全法令' | '憲法・法律' | '政令・勅令' | '府省令・規則'

export const LAW_CATEGORIES = [
  '全法令',
  '憲法・法律', 
  '政令・勅令',
  '府省令・規則'
] as const

export const isValidLawCategory = (value: string): value is LawCategory => {
  return LAW_CATEGORIES.includes(value as LawCategory)
}

export const createLawCategory = (value: string): LawCategory => {
  if (!isValidLawCategory(value)) {
    throw new Error(`Invalid law category: ${value}`)
  }
  return value
}
