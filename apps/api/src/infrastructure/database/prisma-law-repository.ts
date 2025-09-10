import { PrismaClient } from '@prisma/client'
import { LawRepository } from '../../application/ports/law-repository'
import { Law, createLaw } from '../../domain/law/entities/law'
import { LawId, createLawId } from '../../domain/law/value-objects/law-id'
import { LawCategory, createLawCategory } from '../../domain/law/value-objects/law-category'
import { LawStatus, createLawStatus } from '../../domain/law/value-objects/law-status'
import { SearchQuery, SearchResult, createSearchResult } from '../../domain/law/value-objects'

export class PrismaLawRepository implements LawRepository {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async save(law: Law): Promise<void> {
    await this.prisma.law.upsert({
      where: { id: law.id },
      update: {
        name: law.name,
        number: law.number,
        category: law.category,
        status: law.status,
        promulgationDate: law.promulgationDate,
        updatedAt: new Date()
      },
      create: {
        id: law.id,
        name: law.name,
        number: law.number,
        category: law.category,
        status: law.status,
        promulgationDate: law.promulgationDate
      }
    })
  }

  async findById(id: LawId): Promise<Law | null> {
    const lawData = await this.prisma.law.findUnique({
      where: { id: id }
    })

    if (!lawData) {
      return null
    }

    return createLaw({
      id: lawData.id,
      name: lawData.name,
      number: lawData.number,
      category: lawData.category,
      status: lawData.status,
      promulgationDate: lawData.promulgationDate
    })
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const where = {
      AND: [
        // キーワード検索
        {
          OR: [
            { name: { contains: query.keyword, mode: 'insensitive' as const } },
            { number: { contains: query.keyword, mode: 'insensitive' as const } }
          ]
        },
        // カテゴリフィルター
        ...(query.category ? [{ category: query.category }] : []),
        // ステータスフィルター
        ...(query.status ? [{ status: query.status }] : [])
      ]
    }

    const [laws, totalCount] = await Promise.all([
      this.prisma.law.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.offset || 0,
        take: query.limit || 50
      }),
      this.prisma.law.count({ where })
    ])

    const mappedLaws = laws.map(lawData => 
      createLaw({
        id: lawData.id,
        name: lawData.name,
        number: lawData.number,
        category: lawData.category,
        status: lawData.status,
        promulgationDate: lawData.promulgationDate
      })
    )

    return createSearchResult(mappedLaws, totalCount, query.keyword)
  }

  async findAll(): Promise<Law[]> {
    const laws = await this.prisma.law.findMany({
      orderBy: { name: 'asc' }
    })

    return laws.map(lawData => 
      createLaw({
        id: lawData.id,
        name: lawData.name,
        number: lawData.number,
        category: lawData.category,
        status: lawData.status,
        promulgationDate: lawData.promulgationDate
      })
    )
  }

  async findByIds(ids: LawId[]): Promise<Law[]> {
    const laws = await this.prisma.law.findMany({
      where: {
        id: { in: ids.map(id => id) }
      },
      orderBy: { name: 'asc' }
    })

    return laws.map(lawData => 
      createLaw({
        id: lawData.id,
        name: lawData.name,
        number: lawData.number,
        category: lawData.category,
        status: lawData.status,
        promulgationDate: lawData.promulgationDate
      })
    )
  }

  async findByCategory(category: LawCategory): Promise<Law[]> {
    const laws = await this.prisma.law.findMany({
      where: { category: category },
      orderBy: { name: 'asc' }
    })

    return laws.map(lawData => 
      createLaw({
        id: lawData.id,
        name: lawData.name,
        number: lawData.number,
        category: lawData.category,
        status: lawData.status,
        promulgationDate: lawData.promulgationDate
      })
    )
  }

  async delete(id: LawId): Promise<void> {
    await this.prisma.law.delete({
      where: { id: id }
    })
  }
}