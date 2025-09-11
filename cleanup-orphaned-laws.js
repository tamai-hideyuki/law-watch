const { PrismaClient } = require('@prisma/client')

async function cleanupOrphanedLaws() {
  const prisma = new PrismaClient()
  
  try {
    console.log('孤立した法令データをクリーンアップ中...')
    
    // 監視リストに含まれていない法令を特定
    const orphanedLaws = await prisma.law.findMany({
      where: {
        watchListLaws: {
          none: {}
        }
      }
    })
    
    console.log(`孤立した法令: ${orphanedLaws.length}件`)
    orphanedLaws.forEach(law => {
      console.log(`- ${law.name} (${law.id})`)
    })
    
    if (orphanedLaws.length > 0) {
      // 孤立した法令を削除
      const result = await prisma.law.deleteMany({
        where: {
          watchListLaws: {
            none: {}
          }
        }
      })
      
      console.log(`${result.count}件の孤立した法令を削除しました`)
    } else {
      console.log('孤立した法令は見つかりませんでした')
    }
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOrphanedLaws()