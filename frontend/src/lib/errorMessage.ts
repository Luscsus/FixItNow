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
