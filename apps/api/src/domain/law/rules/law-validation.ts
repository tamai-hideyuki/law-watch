import { Result, ok, err } from '../../common/result'
import { LawCategory, isValidLawCategory } from '../value-objects/law-category'
import { LawStatus, isValidLawStatus } from '../value-objects/law-status'

export interface LawValidationError {
  field: string
  message: string
  code: string
}

export interface Law {
  id: string
  name: string
  number: string
  category: LawCategory
  status: LawStatus
  promulgationDate: Date
}

// Japanese era patterns for law number validation
const ERA_PATTERNS = [
  /^明治([一二三四五六七八九十百]+)年法律第([一二三四五六七八九十百]+)号$/,
  /^大正([一二三四五六七八九十百]+)年法律第([一二三四五六七八九十百]+)号$/,
  /^昭和([一二三四五六七八九十百]+)年法律第([一二三四五六七八九十百]+)号$/,
  /^平成([一二三四五六七八九十百]+)年法律第([一二三四五六七八九十百]+)号$/,
  /^令和([一二三四五六七八九十百]+)年法律第([一二三四五六七八九十百]+)号$/
]

/**
 * Validates Japanese law number format
 * Accepts formats like: 昭和二十二年法律第四十九号
 */
export const validateLawNumber = (number: string): Result<boolean, LawValidationError> => {
  if (!number || typeof number !== 'string') {
    return err({
      field: 'number',
      message: 'Law number is required',
      code: 'REQUIRED'
    })
  }

  const trimmed = number.trim()
  if (trimmed.length === 0) {
    return err({
      field: 'number',
      message: 'Law number cannot be empty',
      code: 'EMPTY'
    })
  }

  // Check if it matches any era pattern
  const isValidFormat = ERA_PATTERNS.some(pattern => 
    pattern.test(trimmed)
  )

  if (!isValidFormat) {
    return err({
      field: 'number',
      message: 'Invalid law number format. Expected format: [Era][Year]年法律第[Number]号',
      code: 'INVALID_FORMAT'
    })
  }

  return ok(true)
}

/**
 * Validates law name
 */
export const validateLawName = (name: string): Result<boolean, LawValidationError> => {
  if (!name || typeof name !== 'string') {
    return err({
      field: 'name',
      message: 'Law name is required',
      code: 'REQUIRED'
    })
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return err({
      field: 'name',
      message: 'Law name cannot be empty',
      code: 'EMPTY'
    })
  }

  if (trimmed.length < 2) {
    return err({
      field: 'name',
      message: 'Law name must be at least 2 characters',
      code: 'TOO_SHORT'
    })
  }

  if (trimmed.length > 200) {
    return err({
      field: 'name',
      message: 'Law name cannot exceed 200 characters',
      code: 'TOO_LONG'
    })
  }

  // Check for valid Japanese characters, alphanumeric, and common punctuation
  const validPattern = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEFA-Za-z0-9\s\u3000・（）「」『』、。・ー]+$/
  if (!validPattern.test(trimmed)) {
    return err({
      field: 'name',
      message: 'Law name contains invalid characters',
      code: 'INVALID_CHARACTERS'
    })
  }

  // Check if it starts with a number
  if (/^\d/.test(trimmed)) {
    return err({
      field: 'name',
      message: 'Law name cannot start with a number',
      code: 'INVALID_START'
    })
  }

  return ok(true)
}

/**
 * Validates promulgation date
 */
export const validatePromulgationDate = (date: Date | null | undefined): Result<boolean, LawValidationError> => {
  if (!date || !(date instanceof Date)) {
    return err({
      field: 'promulgationDate',
      message: 'Promulgation date is required',
      code: 'REQUIRED'
    })
  }

  if (isNaN(date.getTime())) {
    return err({
      field: 'promulgationDate',
      message: 'Invalid date',
      code: 'INVALID_DATE'
    })
  }

  // Modern law system began in Meiji era (1868)
  const minDate = new Date('1868-01-01')
  if (date < minDate) {
    return err({
      field: 'promulgationDate',
      message: 'Promulgation date cannot be before 1868 (start of modern legal system)',
      code: 'TOO_EARLY'
    })
  }

  // Cannot be in the future
  const now = new Date()
  if (date > now) {
    return err({
      field: 'promulgationDate',
      message: 'Promulgation date cannot be in the future',
      code: 'FUTURE_DATE'
    })
  }

  return ok(true)
}

/**
 * Validates e-Gov law ID format
 */
export const validateLawId = (id: string): Result<boolean, LawValidationError> => {
  if (!id || typeof id !== 'string') {
    return err({
      field: 'id',
      message: 'Law ID is required',
      code: 'REQUIRED'
    })
  }

  const trimmed = id.trim()
  if (trimmed.length === 0) {
    return err({
      field: 'id',
      message: 'Law ID cannot be empty',
      code: 'EMPTY'
    })
  }

  // e-Gov law ID format: 15 alphanumeric characters
  const egovPattern = /^[0-9A-Z]{15}$/
  if (!egovPattern.test(trimmed)) {
    return err({
      field: 'id',
      message: 'Invalid e-Gov law ID format. Expected: 15 alphanumeric characters',
      code: 'INVALID_FORMAT'
    })
  }

  return ok(true)
}

/**
 * Validates complete law object
 */
export const validateLaw = (law: any): Result<boolean, LawValidationError[]> => {
  if (!law || typeof law !== 'object') {
    return err([{
      field: 'law',
      message: 'Law object is required',
      code: 'REQUIRED'
    }])
  }

  const errors: LawValidationError[] = []

  // Validate each field
  const idResult = validateLawId(law.id)
  if (!idResult.success) {
    errors.push(idResult.error)
  }

  const nameResult = validateLawName(law.name)
  if (!nameResult.success) {
    errors.push(nameResult.error)
  }

  const numberResult = validateLawNumber(law.number)
  if (!numberResult.success) {
    errors.push(numberResult.error)
  }

  // Validate category
  if (!isValidLawCategory(law.category)) {
    errors.push({
      field: 'category',
      message: 'Invalid law category',
      code: 'INVALID_CATEGORY'
    })
  }

  // Validate status
  if (!isValidLawStatus(law.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid law status',
      code: 'INVALID_STATUS'
    })
  }

  const dateResult = validatePromulgationDate(law.promulgationDate)
  if (!dateResult.success) {
    errors.push(dateResult.error)
  }

  if (errors.length > 0) {
    return err(errors)
  }

  return ok(true)
}

/**
 * Type guard for Law objects
 */
export const isValidLawObject = (obj: unknown): obj is Law => {
  const result = validateLaw(obj)
  return result.success
}