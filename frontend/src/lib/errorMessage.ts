import type { TFunction } from 'i18next'
import { ApiError } from '@/services/httpClient'

function extractApiMessage(body: string): string {
  try {
    const parsed = JSON.parse(body)
    if (parsed && typeof parsed.message === 'string' && parsed.message) {
      return parsed.message
    }
  } catch {
    // body is plain text
  }
  return body || 'Request failed.'
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return extractApiMessage(error.body)
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed.'
}

export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body)
      if (parsed?.fieldErrors && typeof parsed.fieldErrors === 'object') {
        return parsed.fieldErrors as Record<string, string>
      }
    } catch {
      // not JSON
    }
  }
  return null
}

function translateBackendMessage(message: string, t: TFunction): string {
  if (message === 'must not be blank' || message === 'must not be null') {
    return t('validation.required')
  }
  const sizeMatch = /^size must be between (\d+) and (\d+)$/.exec(message)
  if (sizeMatch) {
    const min = Number(sizeMatch[1])
    const max = Number(sizeMatch[2])
    if (min === 0) return t('validation.tooLong', { max })
    return t('validation.sizeBetween', { min, max })
  }
  if (message === 'must be positive') return t('validation.positive')
  if (message === 'must be positive or zero') return t('validation.positiveOrZero')
  if (message === 'must be a well-formed email address') return t('validation.invalidEmail')
  const minMatch = /^must be greater than or equal to (.+)$/.exec(message)
  if (minMatch) return t('validation.min', { min: minMatch[1] })
  const maxMatch = /^must be less than or equal to (.+)$/.exec(message)
  if (maxMatch) return t('validation.max', { max: maxMatch[1] })
  const digitsMatch = /must have at most (\d+) digits? before the decimal/i.exec(message)
  if (digitsMatch) return t('validation.digitsBeforeDecimal', { max: digitsMatch[1] })
  return message
}

export function getTranslatedFieldErrors(
  error: unknown,
  t: TFunction,
): Record<string, string> | null {
  const raw = getFieldErrors(error)
  if (!raw) return null
  return Object.fromEntries(
    Object.entries(raw).map(([field, msg]) => [field, translateBackendMessage(msg, t)]),
  )
}
