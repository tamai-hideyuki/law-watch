export interface DateRange {
  readonly from: Date
  readonly to: Date
}

export const createDateRange = (from: Date, to: Date): DateRange => {
  if (from > to) {
    throw new Error('From date must be before or equal to to date')
  }
  
  return { from, to }
}

export const createDateRangeFromStrings = (
  fromStr: string, 
  toStr: string
): DateRange => {
  const from = new Date(fromStr)
  const to = new Date(toStr)
  
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error('Invalid date format')
  }
  
  return createDateRange(from, to)
}

export const createLastNDaysRange = (days: number): DateRange => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  
  return createDateRange(from, to)
}

export const createThisMonthRange = (): DateRange => {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return createDateRange(from, to)
}

export const createThisYearRange = (): DateRange => {
  const now = new Date()
  const from = new Date(now.getFullYear(), 0, 1)
  const to = new Date(now.getFullYear(), 11, 31)
  
  return createDateRange(from, to)
}

export const isDateInRange = (date: Date, range: DateRange): boolean => {
  return date >= range.from && date <= range.to
}

export const formatDateRange = (range: DateRange): string => {
  const fromStr = range.from.toISOString().split('T')[0]
  const toStr = range.to.toISOString().split('T')[0]
  return `${fromStr} ~ ${toStr}`
}