/**
 * 日本時間（JST/UTC+9）のためのタイムゾーンユーティリティ
 */

/**
 * 現在の日本時間を取得
 */
export function getJapanTime(): Date {
  const now = new Date()
  // 日本時間（UTC+9）に変換
  const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  return japanTime
}

/**
 * 指定されたUTC時間を日本時間に変換
 */
export function toJapanTime(utcDate: Date): Date {
  return new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
}

/**
 * 日本時間を ISO 8601 形式の文字列で取得
 */
export function getJapanTimeISO(): string {
  const japanTime = getJapanTime()
  return japanTime.toISOString().replace('Z', '+09:00')
}

/**
 * 日本時間を人間が読みやすい形式で取得
 */
export function getJapanTimeFormatted(): string {
  const japanTime = getJapanTime()
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  return formatter.format(japanTime)
}

/**
 * データベース保存用の日本時間を取得（PostgreSQL TIMESTAMP対応）
 */
export function getJapanTimeForDB(): Date {
  // Prismaは自動的にUTCで保存するため、実際のJST時刻を生成
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
}