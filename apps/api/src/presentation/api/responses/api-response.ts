import { Context } from 'hono'
export interface SuccessResponse<T = any> {
  success: true
  data?: T
  [key: string]: any
}

export interface ErrorResponse {
  success: false
  error: string
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

export const successResponse = <T>(c: Context, data?: T, additionalFields?: Record<string, any>) => {
  const response: SuccessResponse<T> = {
    success: true,
    ...(data && { data }),
    ...additionalFields
  }
  return c.json(response)
}

export const errorResponse = (c: Context, message: string, statusCode: 400 | 401 | 403 | 404 | 500 = 500) => {
  const response: ErrorResponse = {
    success: false,
    error: message
  }
  return c.json(response, statusCode)
}

export const notFoundResponse = (c: Context, resource: string) => {
  return errorResponse(c, `${resource} not found`, 404)
}

export const badRequestResponse = (c: Context, message: string) => {
  return errorResponse(c, message, 400)
}