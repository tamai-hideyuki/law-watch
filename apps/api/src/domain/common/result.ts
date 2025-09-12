/**
 * 関数型プログラミングスタイルのResult型
 * エラーハンドリングを型安全にし、例外を回避する
 */
export type Result<T, E = Error> = Success<T> | Failure<E>

export interface Success<T> {
  readonly success: true
  readonly data: T
}

export interface Failure<E> {
  readonly success: false
  readonly error: E
}

/**
 * 成功結果を作成
 */
export const ok = <T>(data: T): Success<T> => ({
  success: true,
  data
})

/**
 * 失敗結果を作成
 */
export const err = <E>(error: E): Failure<E> => ({
  success: false,
  error
})

/**
 * Resultが成功かどうかを型ガードで判定
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
  return result.success
}

/**
 * Resultが失敗かどうかを型ガードで判定
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => {
  return !result.success
}

/**
 * Resultの値をmapで変換（成功時のみ）
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> => {
  if (isSuccess(result)) {
    return ok(fn(result.data))
  }
  return result
}

/**
 * Resultのエラーをmapで変換（失敗時のみ）
 */
export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  if (isFailure(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * Resultをflatmapで変換（モナドパターン）
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => {
  if (isSuccess(result)) {
    return fn(result.data)
  }
  return result
}

/**
 * 成功時の値を取得（失敗時はデフォルト値）
 */
export const getOrElse = <T, E>(
  result: Result<T, E>,
  defaultValue: T
): T => {
  return isSuccess(result) ? result.data : defaultValue
}

/**
 * 複数のResultを組み合わせる（全て成功時のみ成功）
 */
export const combine = <T, E>(
  results: Result<T, E>[]
): Result<T[], E> => {
  const data: T[] = []
  
  for (const result of results) {
    if (isFailure(result)) {
      return result
    }
    data.push(result.data)
  }
  
  return ok(data)
}

/**
 * try-catch を Result に変換するヘルパー
 */
export const tryCatch = <T>(
  fn: () => T,
  onError?: (error: unknown) => Error
): Result<T, Error> => {
  try {
    return ok(fn())
  } catch (error) {
    const errorHandler = onError ?? ((e) => e instanceof Error ? e : new Error(String(e)))
    return err(errorHandler(error))
  }
}

/**
 * 非同期関数のtry-catchをResultに変換
 */
export const tryCatchAsync = async <T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => Error
): Promise<Result<T, Error>> => {
  try {
    const data = await fn()
    return ok(data)
  } catch (error) {
    const errorHandler = onError ?? ((e) => e instanceof Error ? e : new Error(String(e)))
    return err(errorHandler(error))
  }
}