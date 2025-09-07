import { serve } from '@hono/node-server'
import { createSearchApp } from './presentation/api/search'
import { MockEGovClient } from './infrastructure/e-gov/mock-e-gov-client'

const mockLawRepository = {
  save: async () => {},
  findById: async () => null,
  search: async () => { throw new Error('Use EGovApi for search') }
}

const egovClient = new MockEGovClient()
const app = createSearchApp(mockLawRepository, egovClient)

const port = 3000
console.log(`🔥 Law Watch API running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})


