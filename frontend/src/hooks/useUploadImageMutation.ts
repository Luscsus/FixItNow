import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/context/auth'
import { uploadImage } from '@/services/imageService'

export function useUploadImageMutation() {
  const { accessToken } = useAuth()

  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
      uploadImage(file, folder ?? 'uploads', accessToken),
  })
}
