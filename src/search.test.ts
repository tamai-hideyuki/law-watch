import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from './search'

global.fetch = vi.fn()

describe('Law Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should search laws by keyword', async () => {
    const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<DataRoot>
  <r><Code>0</Code></r>
  <ApplData>
    <LawNameListInfo>
      <LawName>労働基準法</LawName>
      <LawNo>昭和二十二年法律第四十九号</LawNo>
      <LawId>322AC0000000049</LawId>
    </LawNameListInfo>
    <LawNameListInfo>
      <LawName>労働安全衛生法</LawName>
      <LawNo>昭和四十七年法律第五十七号</LawNo>
      <LawId>347AC0000000057</LawId>
    </LawNameListInfo>
  </ApplData>
</DataRoot>`

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockXmlResponse)
    } as Response)

    const res = await app.request('/api/search?q=労働')
    const json = await res.json()
    
    console.log('Status:', res.status)
    console.log('Response:', json)

    expect(res.status).toBe(200)
    expect(json.query).toBe('労働')
    expect(json.results).toHaveLength(2)
    expect(json.results[0].name).toBe('労働基準法')
    expect(json.results[1].name).toBe('労働安全衛生法')
  })

  it('should return error for empty query', async () => {
    const res = await app.request('/api/search?q=')
    const json = await res.json()
    
    console.log('Status:', res.status)
    console.log('Response:', json)

    expect(res.status).toBe(400)
    expect(json.error).toBeDefined()
  })
})