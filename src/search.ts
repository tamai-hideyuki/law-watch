import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    status: 'ok!',
    message: 'Law Watch API is running!!',
    timestamp: new Date().toISOString()
  })
})

app.get('/', (c) => {
  return c.json({
    name: 'Law Watch',
    description: '法的変化の早期発見によって社会的な安全性を向上させるシステム',
    version: '0.1.0'
  })
})

app.get('/api/search', async (c) => {
  const query = c.req.query('q')
  
  if (!query || query.trim() === '') {
    return c.json({ error: 'Query parameter is required' }, 400)
  }

  
  const results = [
    { name: '労働基準法', lawNo: '昭和二十二年法律第四十九号', lawId: '322AC0000000049' },
    { name: '労働安全衛生法', lawNo: '昭和四十七年法律第五十七号', lawId: '347AC0000000057' }
  ]

  return c.json({
    query,
    results
  })
})

if (require.main === module) {
  
  const port = 3001
  console.log(`🔥 Law Watch API is running on http://localhost:${port}`)
  
  serve({
    fetch: app.fetch,
    port
  })
}

export default app