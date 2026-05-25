# Chat (WebSocket + STOMP)

Minimal guide for chat events, message status, and typing indicators.

## WebSocket
- Endpoint: `/ws`
- App prefix: `/app`
- Topic prefix: `/topic`

### Auth header (required)
```
Authorization: Bearer <access_token>
```

## Send message
- Destination: `/app/chat.send`
- Subscribe: `/topic/chat/{chatRoomId}`

Payload:
```json
{
  "senderId": "uuid",
  "recipientId": "uuid",
  "chatRoomId": "uuid",
  "content": "Hello",
  "type": "TEXT"
}
```

## Typing indicator
- Destination: `/app/chat.typing`
- Subscribe: `/topic/chat/{chatRoomId}/typing`

Payload:
```json
{
  "chatRoomId": "uuid",
  "userId": "uuid",
  "typing": true
}
```

## Status updates (delivered/read)
- Destination: `/app/chat.status`
- Subscribe: `/topic/chat/{chatRoomId}/status`

Payload:
```json
{
  "chatRoomId": "uuid",
  "messageId": 123,
  "userId": "uuid",
  "status": "DELIVERED"
}
```

## Rooms
- `GET /api/chat/rooms` (auth required)

Response:
```json
["uuid", "uuid"]
```

Room ownership:
- A room is created when a provider accepts a ticket.
- The room is tied to `ticket_id`, `customer_id`, and `provider_id` in `chat_rooms`.

## History REST
- `GET /api/chat/{chatRoomId}/messages?page=0&size=50`
- Optional `before`: `&before=2026-05-22T10:15:30`
