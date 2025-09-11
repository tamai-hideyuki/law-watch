import { Context } from 'hono'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (!value) {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

export const validateWatchRequest = (body: any): ValidationResult => {
  const errors: ValidationError[] = []
  
  const watchListIdError = validateRequired(body.watchListId, 'watchListId')
  if (watchListIdError) errors.push(watchListIdError)
  
  const lawIdError = validateRequired(body.lawId, 'lawId')
  if (lawIdError) errors.push(lawIdError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateWatchListRequest = (body: any): ValidationResult => {
  const errors: ValidationError[] = []
  
  const userIdError = validateRequired(body.userId, 'userId')
  if (userIdError) errors.push(userIdError)
  
  const nameError = validateRequired(body.name, 'name')
  if (nameError) errors.push(nameError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUpdateWatchListRequest = (body: any): ValidationResult => {
  const errors: ValidationError[] = []
  
  const userIdError = validateRequired(body.userId, 'userId')
  if (userIdError) errors.push(userIdError)
  
  const nameError = validateRequired(body.name, 'name')
  if (nameError) errors.push(nameError)
  
  // 名前の長さチェック
  if (body.name && typeof body.name === 'string') {
    const trimmedName = body.name.trim()
    if (trimmedName.length > 100) {
      errors.push({ field: 'name', message: 'Watch list name must be 100 characters or less' })
    }
    if (trimmedName.length === 0) {
      errors.push({ field: 'name', message: 'Watch list name cannot be empty' })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const handleValidationError = (c: Context, result: ValidationResult) => {
  const firstError = result.errors[0]
  return c.json({ error: firstError.message }, 400)
}