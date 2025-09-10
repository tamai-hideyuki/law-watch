import { Result, ok, err } from '../../common/result'

export type LawId = string & { readonly brand: unique symbol }

/**
 * 法令ID作成時のエラー種別
 */
export type LawIdError = 
  | 'EMPTY_VALUE'
  | 'INVALID_FORMAT'

export const LAW_ID_ERRORS = {
  EMPTY_VALUE: '法令IDは空にできません',
  INVALID_FORMAT: '無効な法令IDフォーマットです'
} as const

/**
 * 法令IDの有効なフォーマットかどうかを判定する
 * @param value 検証する文字列
 * @returns フォーマットが有効な場合はtrue
 */
export const isValidLawIdFormat = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false
  }
  
  // 法令IDのフォーマット: 数字3桁 + AC + 10桁の数字
  // 例: 322AC0000000049, 324AC0000000100
  const lawIdPattern = /^[0-9]{3}AC[0-9]{10}$/
  return lawIdPattern.test(value)
}

/**
 * 文字列から型安全なLawIdを作成する（Result型版）
 * @param value 法令ID文字列
 * @returns Result<LawId, LawIdError>
 */
export const createLawIdSafe = (value: string): Result<LawId, LawIdError> => {
    // null/undefined/空文字列チェック
    if (!value || value.trim().length === 0) {
        return err('EMPTY_VALUE')
    }
    
    // フォーマットチェック
    if (!isValidLawIdFormat(value)) {
        return err('INVALID_FORMAT')
    }
    
    return ok(value as LawId)
}

/**
 * 従来のthrow版も互換性のため残す
 * @deprecated createLawIdSafe を使用してください
 */
export const createLawId = (value: string): LawId => {
    const result = createLawIdSafe(value)
    
    if (result.success) {
        return result.data
    }
    
    throw new Error(LAW_ID_ERRORS[result.error])
}