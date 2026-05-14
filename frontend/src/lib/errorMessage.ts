import { ApiError } from '@/services/httpClient'

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.body || 'Request failed.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Request failed.'
}
