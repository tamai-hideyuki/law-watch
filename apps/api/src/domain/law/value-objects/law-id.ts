export type LawId = string & { readonly brand: unique symbol }

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
 * 文字列から型安全なLawIdを作成する
 * @param value 法令ID文字列
 * @returns LawId
 * @throws {Error} 無効な値の場合
 */
export const createLawId = (value: string): LawId => {
    // null/undefined チェック
    if (value === null || value === undefined) {
        throw new Error('LawId は空にできません')
    }
    
    // 空文字列・空白チェック
    if (!value || value.trim().length === 0) {
        throw new Error('LawId は空にできません')
    }
    
    // フォーマットチェック
    if (!isValidLawIdFormat(value)) {
        throw new Error('無効な法令IDフォーマットです')
    }
    
    return value as LawId
}
