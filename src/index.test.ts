import { describe, it, expect } from 'vitest'
import app from './index'

describe('apiの動作確認', () => {
    it('正常に動作する際は２００を返すことを確認する', async () => {
        const response = await app.request('./health')
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.status).toBe('ok!')
        expect(json.message).toBe('Law Watch API is running!!')
        expect(json.timestamp).toBeDefined()
    })

    it('APIが正常にメッセージを返すことを確認する', async () => {
        const response = await app.request('/')
        const json = await response.json()

        expect(response.status).toBe(200)
        expect(json.name).toBe('Law Watch')
        expect(json.description).toBe('法的変化の早期発見によって社会的な安全性を向上させるシステム')
    })
})
