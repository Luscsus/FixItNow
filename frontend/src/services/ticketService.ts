import type { CreateTicketRequestDto, OpenTicketSummaryDto, TicketResponseDto } from "@/dto/ticket";
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

export async function listProviderTickets(accessToken?: string): Promise<Ticket[]> {
  const data = await requestJson<TicketResponseDto[]>("/api/tickets/provider", {
    headers: authHeader(accessToken),
  });
  return mapTickets(data);
}

export async function listOpenTickets(accessToken?: string): Promise<Ticket[]> {
  const data = await requestJson<TicketResponseDto[]>("/api/tickets/open", {
    headers: authHeader(accessToken),
  });
  return mapTickets(data);
}

export async function acceptTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(`/api/tickets/${ticketId}/accept`, {
    method: "POST",
    headers: authHeader(accessToken),
  });
  return mapTicket(data);
}

export async function confirmTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(`/api/tickets/${ticketId}/confirm`, {
    method: "POST",
    headers: authHeader(accessToken),
  });
  return mapTicket(data);
}

export async function declineTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(
    `/api/tickets/${ticketId}/status?newStatus=DECLINED`,
    { method: "PUT", headers: authHeader(accessToken) },
  );
  return mapTicket(data);
}

export async function getPublicOpenTickets(): Promise<OpenTicketSummaryDto[]> {
  return requestJson<OpenTicketSummaryDto[]>("/api/tickets/public/open");
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

