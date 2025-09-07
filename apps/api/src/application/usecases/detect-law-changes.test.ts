import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DetectLawChangesUseCase } from './detect-law-changes'
import { createLawId } from '../../domain/law'

describe('DetectLawChangesUseCase', () => {
  let mockWatchListRepository: any
  let mockEGovApi: any
  let mockNotificationRepository: any
  let useCase: DetectLawChangesUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockWatchListRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn()
    }

    mockEGovApi = {
      searchLaws: vi.fn(),
      getLawDetail: vi.fn()
    }

    mockNotificationRepository = {
      save: vi.fn(),
      findByUserId: vi.fn(),
      markAsRead: vi.fn()
    }

    useCase = new DetectLawChangesUseCase(
      mockWatchListRepository,
      mockEGovApi,
      mockNotificationRepository
    )
  })

  it('監視中の法令に変更がある場合、通知を作成する', async () => {
    // Arrange
    const watchLists = [{
      id: 'watch-001',
      userId: 'user-001',
      name: 'マイウォッチリスト',
      lawIds: [createLawId('322AC0000000049')],
      createdAt: new Date(),
      updatedAt: new Date()
    }]

    const updatedLaw = {
      id: '322AC0000000049',
      name: '労働基準法（改正版）',
      number: '昭和二十二年法律第四十九号',
      promulgationDate: '1947-04-07',
      category: '憲法・法律',
      status: '施行中'
    }

    mockWatchListRepository.findAll.mockResolvedValue(watchLists)
    mockEGovApi.getLawDetail.mockResolvedValue(updatedLaw)

    // Act
    const notifications = await useCase.execute()

    // Assert
    expect(notifications).toHaveLength(1)
    expect(notifications[0].title).toContain('労働基準法')
    expect(mockNotificationRepository.save).toHaveBeenCalled()
  })
})
