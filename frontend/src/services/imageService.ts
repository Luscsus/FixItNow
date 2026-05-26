import { env } from '@/config/env'
import { ApiError } from '@/services/httpClient'

export async function uploadImage(
  file: File,
  folder: string = 'uploads',
  accessToken?: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const headers: HeadersInit = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(new URL('/api/v1/images/upload', env.apiBaseUrl).toString(), {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(response.status, body)
  }

  const data: { url: string } = await response.json()
  return data.url
}

export async function uploadFile(
  file: File,
  folder: string = 'chat',
  accessToken?: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const headers: HeadersInit = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const response = await fetch(new URL('/api/v1/images/upload-file', env.apiBaseUrl).toString(), {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(response.status, body)
  }

  const data: { url: string } = await response.json()
  return data.url
}
