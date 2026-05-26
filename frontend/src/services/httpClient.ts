import { env } from '@/config/env'

export class ApiError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`Request failed with status ${status}`)
    this.status = status
    this.body = body
  }
}

type AuthRefreshHandler = () => Promise<string | null>

let authRefreshHandler: AuthRefreshHandler | null = null
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export function setAuthRefreshHandler(handler: AuthRefreshHandler | null) {
  authRefreshHandler = handler
}

export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = new URL(path, env.apiBaseUrl)
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Handle 403 Forbidden - try to refresh token
    if (response.status === 403 && authRefreshHandler && !path.includes('/auth/')) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = authRefreshHandler().finally(() => {
          isRefreshing = false
          refreshPromise = null
        })
      }

      if (refreshPromise) {
        try {
          const newToken = await refreshPromise
          // Retry the original request after token refresh with the new token
          const retryHeaders = new Headers(options.headers)

          // Update the Authorization header with the new token if available
          if (newToken) {
            retryHeaders.set('Authorization', `Bearer ${newToken}`)
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          })

          if (!retryResponse.ok) {
            const body = await retryResponse.text()
            throw new ApiError(retryResponse.status, body)
          }

          return retryResponse.json() as Promise<T>
        } catch {
          // If refresh fails, throw the original error
          const body = await response.text()
          throw new ApiError(response.status, body)
        }
      }
    }

    const body = await response.text()
    throw new ApiError(response.status, body)
  }

  return response.json() as Promise<T>
}
