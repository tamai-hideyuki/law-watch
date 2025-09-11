export type LawId = string & { readonly brand: unique symbol }

/**
 * e-Gov APIで使用される法令IDの正規表現パターン
 * 基本構造: 数字3桁 + 英数字・アンダースコアの組み合わせ
 * 
 * 実際の法令IDの例:
 * - 321CONSTITUTION (憲法)
 * - 321CONSTITUTION_19470503_000000000000000 (憲法改正版)
 * - 106DF0000000065 (太政官布告)
 * - 117DF1000000032 (太政官布告)
 * - 122AC0000000034 (法律)
 * - 132AC1000000040 (法律変形)
 * - 322AC0000000049 (法律)
 * - 322AC0000000049_20250101_507AC0000000089 (法律改正版)
 */
const LAW_ID_PATTERN = /^[0-9]{3}[A-Z0-9_]+$/

/**
 * 法令IDの有効なフォーマットかどうかを判定する
 * @param value 検証する文字列
 * @returns フォーマットが有効な場合はtrue
 */
export const isValidLawIdFormat = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false
  }
  
  return LAW_ID_PATTERN.test(value)
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
