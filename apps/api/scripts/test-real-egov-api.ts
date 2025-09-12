#!/usr/bin/env tsx

/**
 * Real e-Gov API Integration Test Script
 * 
 * このスクリプトは実際のe-Gov APIに接続してテストを行います。
 * 本番API使用前の動作確認用です。
 * 
 * 使用方法:
 * npm run test:real-egov
 * または
 * npx tsx scripts/test-real-egov-api.ts
 */

import 'dotenv/config'
import { RealEGovClient } from '../src/infrastructure/e-gov/real-e-gov-client'
import { createSimpleSearchQuery, createLawId } from '../src/domain/law'
import { createLogger } from '../src/infrastructure/logging/logger'

const logger = createLogger('TestRealEGovAPI')

async function testRealEGovAPI() {
  logger.info('🚀 Starting real e-Gov API integration test')
  
  const client = new RealEGovClient()
  let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: [] as string[]
  }

  // テスト1: 全法令一覧取得
  logger.info('📋 Test 1: Getting all laws list')
  testResults.totalTests++
  try {
    const allLawsQuery = createSimpleSearchQuery('__ALL_LAWS__')
    const allLaws = await client.searchLaws(allLawsQuery)
    
    logger.info('✅ All laws retrieved successfully', {
      totalCount: allLaws.totalCount,
      sampleLaws: allLaws.laws.slice(0, 3).map(law => ({
        id: law.id,
        name: law.name,
        category: law.category
      }))
    })
    testResults.passedTests++
  } catch (error) {
    const errorMsg = `❌ Failed to get all laws: ${error instanceof Error ? error.message : 'Unknown error'}`
    logger.error(errorMsg)
    testResults.errors.push(errorMsg)
    testResults.failedTests++
  }

  // テスト2: キーワード検索（労働）
  logger.info('🔍 Test 2: Searching laws with keyword "労働"')
  testResults.totalTests++
  try {
    const searchQuery = createSimpleSearchQuery('労働')
    const searchResults = await client.searchLaws(searchQuery)
    
    logger.info('✅ Keyword search successful', {
      keyword: '労働',
      foundCount: searchResults.totalCount,
      laws: searchResults.laws.map(law => ({
        id: law.id,
        name: law.name
      }))
    })
    testResults.passedTests++
  } catch (error) {
    const errorMsg = `❌ Failed keyword search: ${error instanceof Error ? error.message : 'Unknown error'}`
    logger.error(errorMsg)
    testResults.errors.push(errorMsg)
    testResults.failedTests++
  }

  // テスト3: 全法令検索（空のキーワードと同じ）
  logger.info('🔍 Test 3: Searching all laws with special keyword')
  testResults.totalTests++
  try {
    const allLawsQuery = createSimpleSearchQuery('__ALL_LAWS__')
    const allResults = await client.searchLaws(allLawsQuery)
    
    logger.info('✅ All laws search successful', {
      totalCount: allResults.totalCount
    })
    testResults.passedTests++
  } catch (error) {
    const errorMsg = `❌ Failed all laws search: ${error instanceof Error ? error.message : 'Unknown error'}`
    logger.error(errorMsg)
    testResults.errors.push(errorMsg)
    testResults.failedTests++
  }

  // テスト4: 法令詳細取得（労働基準法）
  logger.info('📄 Test 4: Getting law detail for 労働基準法')
  testResults.totalTests++
  try {
    // 労働基準法のIDは一般的に 322AC0000000049
    const lawId = createLawId('322AC0000000049')
    const lawDetail = await client.getLawDetail(lawId)
    
    logger.info('✅ Law detail retrieved successfully', {
      id: lawDetail.id,
      name: lawDetail.name,
      number: lawDetail.number,
      promulgationDate: lawDetail.promulgationDate,
      category: lawDetail.category,
      status: lawDetail.status
    })
    testResults.passedTests++
  } catch (error) {
    const errorMsg = `❌ Failed to get law detail: ${error instanceof Error ? error.message : 'Unknown error'}`
    logger.error(errorMsg)
    testResults.errors.push(errorMsg)
    testResults.failedTests++
  }

  // テスト5: 存在しない法令ID
  logger.info('❓ Test 5: Getting detail for non-existent law ID')
  testResults.totalTests++
  try {
    const invalidId = createLawId('INVALID_ID_12345')
    await client.getLawDetail(invalidId)
    
    // この場合はエラーが期待される
    const errorMsg = '❌ Expected error for invalid ID but got success'
    logger.error(errorMsg)
    testResults.errors.push(errorMsg)
    testResults.failedTests++
  } catch (error) {
    logger.info('✅ Correctly handled invalid law ID', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.passedTests++
  }

  // テスト結果サマリー
  logger.info('📊 Test Results Summary', {
    totalTests: testResults.totalTests,
    passedTests: testResults.passedTests,
    failedTests: testResults.failedTests,
    successRate: `${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`
  })

  if (testResults.errors.length > 0) {
    logger.error('🚨 Errors encountered:', testResults.errors)
  }

  if (testResults.failedTests === 0) {
    logger.info('🎉 All tests passed! Real e-Gov API integration is working correctly.')
  } else {
    logger.warn('⚠️  Some tests failed. Please check the errors above.')
  }

  return testResults.failedTests === 0
}

// CLI実行の場合
if (require.main === module) {
  testRealEGovAPI()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      logger.error('💥 Unhandled error during testing', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      process.exit(1)
    })
}

export { testRealEGovAPI }