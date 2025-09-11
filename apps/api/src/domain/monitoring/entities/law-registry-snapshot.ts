/**
 * 全法令レジストリの状態を表すスナップショット
 * 新規追加・変更・廃止を検知するための基準点
 */
export interface LawRegistrySnapshot {
  readonly id: string
  readonly snapshotDate: Date
  readonly totalLawCount: number
  readonly lawsChecksum: string // 全法令のハッシュ値
  readonly metadata: LawRegistryMetadata
  readonly createdAt: Date
}

export interface LawRegistryMetadata {
  readonly version: string
  readonly lastUpdateDate: Date
  readonly source: string // e.g., "e-Gov API"
  readonly categories: LawCategorySummary[]
}

export interface LawCategorySummary {
  readonly category: string
  readonly count: number
  readonly lastModified: Date
}

/**
 * 全法令差分検知結果
 */
export interface LawRegistryDiff {
  readonly previousSnapshotId: string
  readonly currentSnapshotId: string
  readonly detectedAt: Date
  readonly newLaws: LawDiffEntry[]
  readonly modifiedLaws: LawDiffEntry[]
  readonly removedLaws: LawDiffEntry[]
  readonly summary: DiffSummary
}

export interface LawDiffEntry {
  readonly lawId: string
  readonly name: string
  readonly number: string
  readonly category: string
  readonly changeType: LawRegistryChangeType
  readonly previousValue?: string
  readonly currentValue?: string
  readonly detectedAt: Date
}

export enum LawRegistryChangeType {
  NEW = 'new',
  MODIFIED = 'modified', 
  REMOVED = 'removed',
  STATUS_CHANGED = 'status_changed',
  CATEGORY_CHANGED = 'category_changed'
}

export interface DiffSummary {
  readonly totalNew: number
  readonly totalModified: number
  readonly totalRemoved: number
  readonly affectedCategories: string[]
}

export const createLawRegistrySnapshot = (params: {
  id: string
  totalLawCount: number
  lawsChecksum: string
  metadata: LawRegistryMetadata
}): LawRegistrySnapshot => {
  return {
    id: params.id,
    snapshotDate: new Date(),
    totalLawCount: params.totalLawCount,
    lawsChecksum: params.lawsChecksum,
    metadata: params.metadata,
    createdAt: new Date()
  }
}

export const createLawRegistryDiff = (params: {
  previousSnapshotId: string
  currentSnapshotId: string
  newLaws: LawDiffEntry[]
  modifiedLaws: LawDiffEntry[]
  removedLaws: LawDiffEntry[]
}): LawRegistryDiff => {
  const summary: DiffSummary = {
    totalNew: params.newLaws.length,
    totalModified: params.modifiedLaws.length,
    totalRemoved: params.removedLaws.length,
    affectedCategories: [
      ...new Set([
        ...params.newLaws.map(law => law.category),
        ...params.modifiedLaws.map(law => law.category),
        ...params.removedLaws.map(law => law.category)
      ])
    ]
  }

  return {
    previousSnapshotId: params.previousSnapshotId,
    currentSnapshotId: params.currentSnapshotId,
    detectedAt: new Date(),
    newLaws: params.newLaws,
    modifiedLaws: params.modifiedLaws,
    removedLaws: params.removedLaws,
    summary
  }
}

export const hasSignificantChanges = (diff: LawRegistryDiff): boolean => {
  return diff.summary.totalNew > 0 || 
         diff.summary.totalModified > 0 || 
         diff.summary.totalRemoved > 0
}

export const getChangeSummaryText = (diff: LawRegistryDiff): string => {
  const parts = []
  
  if (diff.summary.totalNew > 0) {
    parts.push(`新規: ${diff.summary.totalNew}件`)
  }
  
  if (diff.summary.totalModified > 0) {
    parts.push(`変更: ${diff.summary.totalModified}件`)
  }
  
  if (diff.summary.totalRemoved > 0) {
    parts.push(`廃止: ${diff.summary.totalRemoved}件`)
  }
  
  return parts.length > 0 ? parts.join(', ') : '変更なし'
}