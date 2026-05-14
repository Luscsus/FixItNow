import type { MessageResponseDto } from '@/dto/message'
import type { Message } from '@/domain/message'

export function mapMessageResponse(dto: MessageResponseDto): Message {
  return {
    text: dto.message ?? '',
  }
}
