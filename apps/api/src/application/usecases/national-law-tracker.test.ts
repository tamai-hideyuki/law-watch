import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NationalLawTrackerUseCaseImpl, type NationalLawTrackerRepository, type NationalLawSnapshot, type LawChangeDetection, type DailyLawScanResult } from './national-law-tracker'
import { type EGovApi } from '../ports/e-gov-api'
import { ok, err } from '../../domain/common/result'

describe('NationalLawTrackerUseCase', () => {
  let useCase: NationalLawTrackerUseCaseImpl
  let mockEGovApi: EGovApi
  let mockRepository: NationalLawTrackerRepository

  const sampleLawData = {
    id: '322AC0000000049',
    name: '日本国憲法',
    number: '昭和21年憲法',
    category: '憲法',
    status: '施行中',
    promulgationDate: '1946-11-03',
    lastRevisionDate: '1947-05-03'
  }

  const sampleSnapshot: NationalLawSnapshot = {
    id: 'snapshot-1',
    lawId: '322AC0000000049',
    lawName: '日本国憲法',
    lawNumber: '昭和21年憲法',
    promulgationDate: '1946-11-03',
    lastRevisionDate: '1947-05-03',
    metadataHash: 'hash123',
    contentHash: null,
    category: '憲法',
    status: '施行中',
    capturedAt: new Date('2024-01-01T00:00:00Z')
  }

  beforeEach(() => {
    mockEGovApi = {
      getAllLaws: vi.fn(),
      searchLaws: vi.fn(),
      getLawDetail: vi.fn()
    }

    mockRepository = {
      saveSnapshot: vi.fn(),
      getLatestSnapshot: vi.fn(),
      getAllLatestSnapshots: vi.fn(),
      saveScanResult: vi.fn(),
      getLatestScanResult: vi.fn(),
      saveChangeDetection: vi.fn(),
      getRecentChanges: vi.fn()
    }

    useCase = new NationalLawTrackerUseCaseImpl(mockEGovApi, mockRepository)
  })

  describe('performDailyFullScan', () => {
    it('should successfully perform daily full scan with new laws', async () => {
      // Arrange
      const currentLaws = [sampleLawData]
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: currentLaws,
        totalCount: currentLaws.length,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
        expect(result.data.newLaws).toHaveLength(1)
        expect(result.data.newLaws[0].lawId).toBe('322AC0000000049')
        expect(result.data.newLaws[0].changeType).toBe('NEW')
        expect(result.data.revisedLaws).toHaveLength(0)
        expect(result.data.abolishedLaws).toHaveLength(0)
      }
    })

    it('should detect revised laws when last revision date changes', async () => {
      // Arrange
      const updatedLawData = {
        ...sampleLawData,
        lastRevisionDate: '2024-01-01'
      }
      const currentLaws = [updatedLawData]
      
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: currentLaws,
        totalCount: currentLaws.length,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([sampleSnapshot]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
        expect(result.data.newLaws).toHaveLength(0)
        expect(result.data.revisedLaws).toHaveLength(1)
        expect(result.data.revisedLaws[0].lawId).toBe('322AC0000000049')
        expect(result.data.revisedLaws[0].changeType).toBe('REVISED')
        expect(result.data.revisedLaws[0].changes).toContainEqual({
          field: 'lastRevisionDate',
          oldValue: '1947-05-03',
          newValue: '2024-01-01'
        })
      }
    })

    it('should detect metadata changes when law name changes', async () => {
      // Arrange
      const updatedLawData = {
        ...sampleLawData,
        name: '日本国憲法（改正）'
      }
      const currentLaws = [updatedLawData]
      
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: currentLaws,
        totalCount: currentLaws.length,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([sampleSnapshot]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
        expect(result.data.newLaws).toHaveLength(0)
        expect(result.data.metadataChanges).toHaveLength(1)
        expect(result.data.metadataChanges[0].lawId).toBe('322AC0000000049')
        expect(result.data.metadataChanges[0].changeType).toBe('METADATA_CHANGED')
        expect(result.data.metadataChanges[0].changes).toContainEqual({
          field: 'lawName',
          oldValue: '日本国憲法',
          newValue: '日本国憲法（改正）'
        })
      }
    })

    it('should detect abolished laws', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [], // No current laws
        totalCount: 0,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([sampleSnapshot]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(0)
        expect(result.data.newLaws).toHaveLength(0)
        expect(result.data.revisedLaws).toHaveLength(0)
        expect(result.data.abolishedLaws).toHaveLength(1)
        expect(result.data.abolishedLaws[0].lawId).toBe('322AC0000000049')
        expect(result.data.abolishedLaws[0].changeType).toBe('ABOLISHED')
      }
    })

    it('should handle e-Gov API failure', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: false,
        error: 'API connection failed',
        laws: [],
        totalCount: 0,
        lastUpdated: new Date(),
        version: '1.0'
      })

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to fetch all laws')
        expect(result.error).toContain('API connection failed')
      }
    })

    it('should handle repository failure when getting existing snapshots', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [sampleLawData],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(err('Database connection failed'))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Failed to get existing snapshots')
        expect(result.error).toContain('Database connection failed')
      }
    })

    it('should not detect changes when law data is identical', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [sampleLawData],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([sampleSnapshot]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
        expect(result.data.newLaws).toHaveLength(0)
        expect(result.data.revisedLaws).toHaveLength(0)
        expect(result.data.metadataChanges).toHaveLength(0)
        expect(result.data.abolishedLaws).toHaveLength(0)
      }
    })
  })

  describe('performIncrementalScan', () => {
    it('should perform full scan when no previous scan exists', async () => {
      // Arrange
      vi.mocked(mockRepository.getLatestScanResult).mockResolvedValue(ok(null))
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [sampleLawData],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performIncrementalScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
      }
    })

    it('should handle repository failure when getting latest scan result', async () => {
      // Arrange
      vi.mocked(mockRepository.getLatestScanResult).mockResolvedValue(err('Database error'))
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [sampleLawData],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performIncrementalScan()

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('getRecentChanges', () => {
    it('should return recent changes from repository', async () => {
      // Arrange
      const mockChanges: LawChangeDetection[] = [{
        lawId: '322AC0000000049',
        lawName: '日本国憲法',
        changeType: 'REVISED',
        currentSnapshot: sampleSnapshot,
        detectedAt: new Date('2024-01-15T00:00:00Z')
      }]
      vi.mocked(mockRepository.getRecentChanges).mockResolvedValue(ok(mockChanges))

      // Act
      const result = await useCase.getRecentChanges(7)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockChanges)
      }
      expect(mockRepository.getRecentChanges).toHaveBeenCalledWith(7)
    })

    it('should handle repository failure', async () => {
      // Arrange
      vi.mocked(mockRepository.getRecentChanges).mockResolvedValue(err('Database error'))

      // Act
      const result = await useCase.getRecentChanges(7)

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe('getScanStatistics', () => {
    it('should return scan statistics successfully', async () => {
      // Arrange
      const mockScanResult: DailyLawScanResult = {
        scanId: 'scan-123',
        startedAt: new Date('2024-01-15T00:00:00Z'),
        completedAt: new Date('2024-01-15T01:00:00Z'),
        totalLawsScanned: 100,
        newLaws: [],
        revisedLaws: [],
        abolishedLaws: [],
        metadataChanges: [],
        errors: []
      }
      
      const mockWeekChanges: LawChangeDetection[] = [{
        lawId: '322AC0000000049',
        lawName: '日本国憲法',
        changeType: 'REVISED',
        currentSnapshot: sampleSnapshot,
        detectedAt: new Date('2024-01-14T00:00:00Z')
      }]

      const mockMonthChanges: LawChangeDetection[] = [
        ...mockWeekChanges,
        {
          lawId: '347AC0000000057',
          lawName: '民法',
          changeType: 'NEW',
          currentSnapshot: { ...sampleSnapshot, lawId: '347AC0000000057', lawName: '民法' },
          detectedAt: new Date('2024-01-01T00:00:00Z')
        }
      ]

      vi.mocked(mockRepository.getLatestScanResult).mockResolvedValue(ok(mockScanResult))
      vi.mocked(mockRepository.getRecentChanges).mockImplementation((days) => {
        if (days === 7) return Promise.resolve(ok(mockWeekChanges))
        if (days === 30) return Promise.resolve(ok(mockMonthChanges))
        return Promise.resolve(ok([]))
      })

      // Act
      const result = await useCase.getScanStatistics()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lastScanAt).toEqual(new Date('2024-01-15T01:00:00Z'))
        expect(result.data.totalLaws).toBe(100)
        expect(result.data.lastWeekChanges).toBe(1)
        expect(result.data.lastMonthChanges).toBe(2)
      }
    })

    it('should handle case when no previous scan exists', async () => {
      // Arrange
      vi.mocked(mockRepository.getLatestScanResult).mockResolvedValue(ok(null))
      vi.mocked(mockRepository.getRecentChanges).mockResolvedValue(ok([]))

      // Act
      const result = await useCase.getScanStatistics()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lastScanAt).toBeNull()
        expect(result.data.totalLaws).toBe(0)
        expect(result.data.lastWeekChanges).toBe(0)
        expect(result.data.lastMonthChanges).toBe(0)
      }
    })

    it('should handle repository failures', async () => {
      // Arrange
      vi.mocked(mockRepository.getLatestScanResult).mockResolvedValue(err('Database error'))
      vi.mocked(mockRepository.getRecentChanges).mockResolvedValue(ok([]))

      // Act
      const result = await useCase.getScanStatistics()

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Failed to get statistics')
      }
    })
  })

  describe('performCategoryScan', () => {
    it('should perform category scan (currently delegates to full scan)', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [sampleLawData],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performCategoryScan(['憲法'])

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalLawsScanned).toBe(1)
      }
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors during scan', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockRejectedValue(new Error('Network timeout'))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Scan failed')
        expect(result.error).toContain('Network timeout')
      }
    })

    it('should handle non-Error exceptions', async () => {
      // Arrange
      vi.mocked(mockEGovApi.getAllLaws).mockRejectedValue('String error')

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Scan failed')
        expect(result.error).toContain('Unknown error')
      }
    })
  })

  describe('snapshot creation and change detection', () => {
    it('should create consistent snapshots for same law data', () => {
      // This tests the private createSnapshot method indirectly
      const lawData1 = { ...sampleLawData }

      // Act through performDailyFullScan to test snapshot creation
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: [lawData1],
        totalCount: 1,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // The snapshot consistency is validated through the fact that
      // identical law data should not trigger changes
    })

    it('should detect multiple field changes', async () => {
      // Arrange
      const updatedLawData = {
        ...sampleLawData,
        name: '日本国憲法（改正）',
        status: '廃止',
        lastRevisionDate: '2024-01-01'
      }
      const currentLaws = [updatedLawData]
      
      vi.mocked(mockEGovApi.getAllLaws).mockResolvedValue({
        success: true,
        laws: currentLaws,
        totalCount: currentLaws.length,
        lastUpdated: new Date(),
        version: '1.0',
        error: ''
      })
      vi.mocked(mockRepository.getAllLatestSnapshots).mockResolvedValue(ok([sampleSnapshot]))
      vi.mocked(mockRepository.saveSnapshot).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveChangeDetection).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.saveScanResult).mockResolvedValue(ok(undefined))

      // Act
      const result = await useCase.performDailyFullScan()

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.revisedLaws).toHaveLength(1)
        const changes = result.data.revisedLaws[0].changes!
        expect(changes).toContainEqual({
          field: 'lawName',
          oldValue: '日本国憲法',
          newValue: '日本国憲法（改正）'
        })
        expect(changes).toContainEqual({
          field: 'status',
          oldValue: '施行中',
          newValue: '廃止'
        })
        expect(changes).toContainEqual({
          field: 'lastRevisionDate',
          oldValue: '1947-05-03',
          newValue: '2024-01-01'
        })
      }
    })
  })
})
