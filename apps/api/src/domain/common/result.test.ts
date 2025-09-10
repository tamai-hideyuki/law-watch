import { describe, it, expect } from 'vitest'
import { 
  Result, ok, err, isSuccess, isFailure, 
  map, mapError, flatMap, getOrElse, combine, tryCatch, tryCatchAsync 
} from './result'

describe('Result Type', () => {
  describe('ok と err', () => {
    it('ok()は成功結果を作成する', () => {
      const result = ok('success')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
    })

    it('err()は失敗結果を作成する', () => {
      const error = new Error('failure')
      const result = err(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })
  })

  describe('型ガード', () => {
    it('isSuccess()は成功結果でtrueを返す', () => {
      const result = ok('data')
      expect(isSuccess(result)).toBe(true)
      
      if (isSuccess(result)) {
        // 型ガードにより result.data にアクセス可能
        expect(result.data).toBe('data')
      }
    })

    it('isFailure()は失敗結果でtrueを返す', () => {
      const result = err(new Error('error'))
      expect(isFailure(result)).toBe(true)
      
      if (isFailure(result)) {
        // 型ガードにより result.error にアクセス可能
        expect(result.error.message).toBe('error')
      }
    })
  })

  describe('map', () => {
    it('成功時にデータを変換する', () => {
      const result = ok(10)
      const mapped = map(result, x => x * 2)
      
      expect(isSuccess(mapped)).toBe(true)
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(20)
      }
    })

    it('失敗時はそのまま返す', () => {
      const error = new Error('error')
      const result: Result<number, Error> = err(error)
      const mapped = map(result, (x: number) => x * 2)
      
      expect(isFailure(mapped)).toBe(true)
      if (isFailure(mapped)) {
        expect(mapped.error).toBe(error)
      }
    })
  })

  describe('mapError', () => {
    it('失敗時にエラーを変換する', () => {
      const result: Result<string, string> = err('original error')
      const mapped = mapError(result, (error: string) => new Error(`Wrapped: ${error}`))
      
      expect(isFailure(mapped)).toBe(true)
      if (isFailure(mapped)) {
        expect(mapped.error.message).toBe('Wrapped: original error')
      }
    })

    it('成功時はそのまま返す', () => {
      const result: Result<string, string> = ok('data')
      const mapped = mapError(result, (error: string) => new Error('should not be called'))
      
      expect(isSuccess(mapped)).toBe(true)
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe('data')
      }
    })
  })

  describe('flatMap', () => {
    it('成功時に別のResultを返す関数を適用する', () => {
      const result = ok(10)
      const flatMapped = flatMap(result, x => ok(x.toString()))
      
      expect(isSuccess(flatMapped)).toBe(true)
      if (isSuccess(flatMapped)) {
        expect(flatMapped.data).toBe('10')
      }
    })

    it('チェーンの途中で失敗した場合は失敗を返す', () => {
      const result = ok(10)
      const error = new Error('chain failed')
      const flatMapped = flatMap(result, _ => err(error))
      
      expect(isFailure(flatMapped)).toBe(true)
      if (isFailure(flatMapped)) {
        expect(flatMapped.error).toBe(error)
      }
    })
  })

  describe('getOrElse', () => {
    it('成功時は実際の値を返す', () => {
      const result = ok('actual')
      expect(getOrElse(result, 'default')).toBe('actual')
    })

    it('失敗時はデフォルト値を返す', () => {
      const result = err(new Error('error'))
      expect(getOrElse(result, 'default')).toBe('default')
    })
  })

  describe('combine', () => {
    it('全て成功時は配列で返す', () => {
      const results = [ok(1), ok(2), ok(3)]
      const combined = combine(results)
      
      expect(isSuccess(combined)).toBe(true)
      if (isSuccess(combined)) {
        expect(combined.data).toEqual([1, 2, 3])
      }
    })

    it('1つでも失敗時は最初の失敗を返す', () => {
      const error = new Error('first error')
      const results = [ok(1), err(error), ok(3)]
      const combined = combine(results)
      
      expect(isFailure(combined)).toBe(true)
      if (isFailure(combined)) {
        expect(combined.error).toBe(error)
      }
    })
  })

  describe('tryCatch', () => {
    it('正常な関数は成功結果を返す', () => {
      const result = tryCatch(() => 'success')
      
      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('success')
      }
    })

    it('例外を投げる関数は失敗結果を返す', () => {
      const result = tryCatch(() => {
        throw new Error('test error')
      })
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.message).toBe('test error')
      }
    })

    it('カスタムエラーハンドラーを使用できる', () => {
      const result = tryCatch(
        () => { throw 'string error' },
        (error) => new Error(`Custom: ${error}`)
      )
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.message).toBe('Custom: string error')
      }
    })
  })

  describe('tryCatchAsync', () => {
    it('正常な非同期関数は成功結果を返す', async () => {
      const result = await tryCatchAsync(async () => 'async success')
      
      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('async success')
      }
    })

    it('例外を投げる非同期関数は失敗結果を返す', async () => {
      const result = await tryCatchAsync(async () => {
        throw new Error('async error')
      })
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.message).toBe('async error')
      }
    })
  })

  describe('型安全性', () => {
    it('型ガードによりコンパイル時に型が確定される', () => {
      const result: Result<number, string> = Math.random() > 0.5 ? ok(42) : err('error')
      
      if (isSuccess(result)) {
        // この中では result.data は number 型
        expect(typeof result.data).toBe('number')
      } else {
        // この中では result.error は string 型  
        expect(typeof result.error).toBe('string')
      }
    })
  })
})