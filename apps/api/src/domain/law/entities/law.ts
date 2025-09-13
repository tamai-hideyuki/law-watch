import { 
    LawId,
    LawCategory,
    LawStatus,
    createLawId,
    createLawCategory,
    createLawStatus,
    isActiveLaw
} from '../value-objects'
import { EGovUrlBuilder } from '../services/e-gov-url-builder'

export interface Law {
  readonly id: LawId
  readonly name: string
  readonly number: string
  readonly promulgationDate: Date
  readonly category: LawCategory
  readonly status: LawStatus
  readonly lastModified?: Date
}

export const createLaw = (params: {
  id: string
  name: string
  number: string
  promulgationDate: Date
  category: string
  status: string
  lastModified?: Date
}): Law => {
  if (!params.name.trim()) {
    throw new Error('Law name cannot be empty')
  }
  
  if (!params.number.trim()) {
    throw new Error('Law number cannot be empty')
  }

  return {
    id: createLawId(params.id),
    name: params.name.trim(),
    number: params.number.trim(),
    promulgationDate: params.promulgationDate,
    category: createLawCategory(params.category),
    status: createLawStatus(params.status),
    lastModified: params.lastModified
  }
}

export const isLawActive = (law: Law): boolean => {
  return isActiveLaw(law.status)
}

export const getLawAge = (law: Law): number => {
  const now = new Date()
  const diffTime = now.getTime() - law.promulgationDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
}

/**
 * 法令のe-Gov法令検索詳細ページURLを取得
 * @param law 法令エンティティ
 * @returns e-Gov法令検索の詳細ページURL
 */
export const getLawDetailUrl = (law: Law): string => {
  return EGovUrlBuilder.buildLawDetailUrl(law.id)
}
