import type { CreateTicketRequestDto, MatchingOpenTicketDto, OpenTicketSummaryDto, TicketResponseDto } from "@/dto/ticket";
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

export async function cancelTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(`/api/tickets/${ticketId}/cancel`, {
    method: "POST",
    headers: authHeader(accessToken),
  });
  return mapTicket(data);
}

export async function releaseTicket(ticketId: number, accessToken?: string): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(`/api/tickets/${ticketId}/release`, {
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

export async function getMatchingOpenTickets(accessToken?: string): Promise<MatchingOpenTicketDto[]> {
  return requestJson<MatchingOpenTicketDto[]>("/api/tickets/open/matching", {
    headers: authHeader(accessToken),
  });
}

export async function issueInvoice(
  ticketId: number,
  amount: number,
  pdfBlob: Blob,
  accessToken?: string,
): Promise<Ticket> {
  const form = new FormData();
  form.append('amount', amount.toString());
  form.append('pdf', pdfBlob, `Invoice-FIX-${String(ticketId).padStart(4, '0')}.pdf`);
  const data = await requestJson<TicketResponseDto>(
    `/api/tickets/${ticketId}/invoice`,
    {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: form,
      // Do NOT set Content-Type — browser sets it with the multipart boundary
    },
  );
  return mapTicket(data);
}

/**
 * Starts a Stripe Checkout session for the ticket's invoice and returns the
 * hosted payment URL the caller should redirect the browser to.
 */
export async function createCheckoutSession(
  ticketId: number,
  accessToken?: string,
): Promise<string> {
  const data = await requestJson<{ url: string }>(
    `/api/tickets/${ticketId}/checkout-session`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return data.url;
}

/**
 * Confirms payment after returning from Stripe Checkout. The backend checks the
 * session with Stripe and advances the ticket to COMPLETED if it was paid.
 * Returns the (possibly updated) ticket.
 */
export async function confirmPayment(
  ticketId: number,
  accessToken?: string,
): Promise<Ticket> {
  const data = await requestJson<TicketResponseDto>(
    `/api/tickets/${ticketId}/payment/confirm`,
    { method: "POST", headers: authHeader(accessToken) },
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

