export interface WatchListNameValidationResult {
  isValid: boolean
  error: string
}

export const validateWatchListName = (name: string): WatchListNameValidationResult => {
  // null/undefined チェック
  if (name == null || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Watch list name is required'
    }
  }

  // 空文字列の場合は特別なメッセージ
  if (name.length === 0) {
    return {
      isValid: false,
      error: 'Watch list name cannot be empty'
    }
  }

  const trimmedName = name.trim()

  // 空白のみチェック
  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: 'Watch list name cannot be empty'
    }
  }

  // 長さチェック（1-100文字）
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: 'Watch list name must be 100 characters or less'
    }
  }

  // 禁止文字チェック（基本的な制御文字を除外）
  const invalidChars = /[\x00-\x1F\x7F]/
  if (invalidChars.test(trimmedName)) {
    return {
      isValid: false,
      error: 'Watch list name contains invalid characters'
    }
  }

  return {
    isValid: true,
    error: ''
  }
}