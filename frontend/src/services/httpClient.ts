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
    const body = await response.text()
    throw new ApiError(response.status, body)
  }

  return response.json() as Promise<T>
}
