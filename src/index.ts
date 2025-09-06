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
        name:'Law Watch',
        description: '法的変化の早期発見によって社会的な安全性を向上させるシステム',
        version: '0.1.0'
    })
})

const port = 3000
console.log(`port number: ${port}`)

serve({
    fetch: app.fetch,
    port
})

export default app
