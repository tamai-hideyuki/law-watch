import { PrismaClient } from '@prisma/client'

const mockLawData = [
  // 労働関連
  {
    id: '322AC0000000049',
    name: '労働基準法',
    number: '昭和二十二年法律第四十九号',
    promulgationDate: new Date('1947-04-07'),
    category: 'labor',
    status: 'active'
  },
  {
    id: '347AC0000000057',
    name: '労働安全衛生法',
    number: '昭和四十七年法律第五十七号',
    promulgationDate: new Date('1972-06-08'),
    category: 'labor',
    status: 'active'
  },
  {
    id: '360AC0000000116',
    name: '労働者派遣事業の適正な運営の確保及び派遣労働者の保護等に関する法律',
    number: '昭和六十年法律第八十八号',
    promulgationDate: new Date('1985-07-05'),
    category: 'labor',
    status: 'active'
  },
  // 建築関連
  {
    id: '325AC1000000201',
    name: '建築基準法',
    number: '昭和二十五年法律第二百一号',
    promulgationDate: new Date('1950-05-24'),
    category: 'construction',
    status: 'active'
  },
  {
    id: '324AC0000000100',
    name: '建設業法',
    number: '昭和二十四年法律第百号',
    promulgationDate: new Date('1949-05-24'),
    category: 'construction',
    status: 'active'
  },
  // 消費者関連
  {
    id: '412AC0000000061',
    name: '消費者契約法',
    number: '平成十二年法律第六十一号',
    promulgationDate: new Date('2000-05-12'),
    category: 'consumer',
    status: 'active'
  },
  {
    id: '343AC0000000078',
    name: '消費者基本法',
    number: '昭和四十三年法律第七十八号',
    promulgationDate: new Date('1968-05-30'),
    category: 'consumer',
    status: 'active'
  },
  // 環境関連
  {
    id: '405AC0000000091',
    name: '環境基本法',
    number: '平成五年法律第九十一号',
    promulgationDate: new Date('1993-11-19'),
    category: 'environment',
    status: 'active'
  },
  // 交通関連
  {
    id: '335AC0000000105',
    name: '道路交通法',
    number: '昭和三十五年法律第百五号',
    promulgationDate: new Date('1960-06-25'),
    category: 'traffic',
    status: 'active'
  }
]

export async function seedLaws(prisma: PrismaClient) {
  console.log('🌱 Seeding law data...')
  
  for (const law of mockLawData) {
    await prisma.law.upsert({
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
  
  console.log(`✅ Seeded ${mockLawData.length} laws`)
}

// スクリプトとして直接実行された場合の処理
if (require.main === module) {
  const prisma = new PrismaClient()
  
  seedLaws(prisma)
    .catch((e) => {
      console.error('❌ Seeding failed:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}