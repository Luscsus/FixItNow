import type { CreateTicketRequestDto, TicketResponseDto } from "@/dto/ticket";
import type { Ticket, TicketStatus } from "@/domain/ticket";
import { mapTicket, mapTickets } from "@/mappers/ticketMapper";
import { requestJson } from "@/services/httpClient";

function authHeader(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function createTicket(
  payload: CreateTicketRequestDto,
  accessToken?: string,
): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>("/api/tickets", {
    method: "POST",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
  return mapTicket(data);
}

export async function listTickets(accessToken?: string): Promise<Ticket[]> {
  const data = await requestJson<TicketResponseDto[]>("/api/tickets", {
    headers: authHeader(accessToken),
  });
  return mapTickets(data);
}

export async function getTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(`/api/tickets/${ticketId}`, {
    headers: authHeader(accessToken),
  });
  return mapTicket(data);
}

export async function updateTicketStatus(
  ticketId: number,
  newStatus: TicketStatus,
  accessToken?: string,
): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(
    `/api/tickets/${ticketId}/status?newStatus=${encodeURIComponent(newStatus)}`,
    {
      method: "PUT",
      headers: authHeader(accessToken),
    },
  );
  return mapTicket(data);
}

export async function getNearbyTickets(
  latitude: number,
  longitude: number,
  radiusKm: number,
): Promise<Ticket[]> {
  const data = await requestJson<TicketResponseDto[]>(
    `/api/tickets/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`,
  );
  return mapTickets(data);
}

