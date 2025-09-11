import { createHash } from 'crypto'
import { EGovLawData } from '../../../application/ports/e-gov-api'
import { createLogger } from '../../../infrastructure/logging/logger'

export interface LawContent {
  id: string
  name: string
  number: string
  category: string
  status: string
  promulgationDate: string
  fullText?: string
}

export class HashService {
  private readonly logger = createLogger('HashService')

  generateContentHash(content: LawContent | EGovLawData): string {
    const normalizedContent = this.normalizeContent(content)
    
    const hash = createHash('sha256')
    hash.update(normalizedContent)
    const contentHash = hash.digest('hex')
    
    this.logger.debug('Content hash generated', {
      lawId: content.id,
      hashLength: contentHash.length,
      hashPrefix: contentHash.substring(0, 8)
    })
    
    return contentHash
  }

  private normalizeContent(content: LawContent | EGovLawData): string {
    const normalized = {
      id: content.id,
      name: this.normalizeText(content.name),
      number: this.normalizeText(content.number),
      category: content.category,
      status: content.status,
      promulgationDate: content.promulgationDate,
      fullText: 'fullText' in content ? this.normalizeText(content.fullText || '') : ''
    }
    
    return JSON.stringify(normalized, Object.keys(normalized).sort())
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim()
  }

  compareHashes(hash1: string, hash2: string): boolean {
    const isEqual = hash1 === hash2
    
    this.logger.debug('Hash comparison', {
      hash1Prefix: hash1.substring(0, 8),
      hash2Prefix: hash2.substring(0, 8),
      isEqual
    })
    
    return isEqual
  }

  detectChangedFields(oldContent: LawContent, newContent: LawContent): string[] {
    const changedFields: string[] = []
    
    if (oldContent.name !== newContent.name) changedFields.push('name')
    if (oldContent.number !== newContent.number) changedFields.push('number')
    if (oldContent.category !== newContent.category) changedFields.push('category')
    if (oldContent.status !== newContent.status) changedFields.push('status')
    if (oldContent.promulgationDate !== newContent.promulgationDate) changedFields.push('promulgationDate')
    if (oldContent.fullText !== newContent.fullText) changedFields.push('fullText')
    
    this.logger.info('Changed fields detected', {
      lawId: oldContent.id,
      changedFields,
      changeCount: changedFields.length
    })
    
    return changedFields
  }
}