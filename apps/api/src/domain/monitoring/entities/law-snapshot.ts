export interface LawSnapshot {
  id: string
  lawId: string
  contentHash: string
  metadata?: {
    name: string
    number: string
    category: string
    status: string
    promulgationDate: string
  }
  lastContent?: string
  version?: string
  lastChecked: Date
  createdAt: Date
  updatedAt: Date
}

export function createLawSnapshot(params: {
  lawId: string
  contentHash: string
  metadata?: LawSnapshot['metadata']
  lastContent?: string
  version?: string
}): LawSnapshot {
  return {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lawId: params.lawId,
    contentHash: params.contentHash,
    metadata: params.metadata,
    lastContent: params.lastContent,
    version: params.version,
    lastChecked: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
}