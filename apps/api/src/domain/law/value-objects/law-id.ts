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
  
  // 実際のe-Gov APIで使用されている法令IDのフォーマット
  // 基本構造: 数字3桁 + 文字列
  // 例:
  // - 321CONSTITUTION (憲法)
  // - 106DF0000000065 (太政官布告)
  // - 117DF1000000032 (太政官布告)
  // - 122AC0000000034 (法律)
  // - 132AC1000000040 (法律変形)
  
  // 最も柔軟なパターン: 3桁の数字で始まり、その後に文字と数字の組み合わせ
  const lawIdPattern = /^[0-9]{3}[A-Z0-9]+$/
  
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
