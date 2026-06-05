import type {
  AdminUpdateTicketRequestDto,
  ChangeUserRoleRequestDto,
  DeclineProviderRequestDto,
  ProviderResponseDto,
  UserSummaryResponseDto,
} from "@/dto/admin";
import type { TicketResponseDto } from "@/dto/ticket";
import type { MessageResponseDto } from "@/dto/message";
import type { AdminUser, Provider } from "@/domain/admin";
import type { Ticket } from "@/domain/ticket";
import type { Message } from "@/domain/message";
import type { UserRole } from "@/domain/auth";
import type { TicketPriority, TicketStatus } from "@/domain/ticket";
import { mapProviders, mapUsers } from "@/mappers/adminMapper";
import { mapTicket, mapTickets } from "@/mappers/ticketMapper";
import { mapMessageResponse } from "@/mappers/messageMapper";
import { requestJson } from "@/services/httpClient";

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listPendingProviders(accessToken: string): Promise<Provider[]> {
  const data = await requestJson<ProviderResponseDto[]>(
    "/api/v1/admin/providers/pending",
    { headers: authHeader(accessToken) },
  );
  return mapProviders(data);
}

export async function approveProvider(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/providers/${id}/approve`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function declineProvider(
  id: string,
  reason: string,
  accessToken: string,
): Promise<Message> {
  const payload: DeclineProviderRequestDto = { reason };
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/providers/${id}/decline`,
    {
      method: "POST",
      headers: { ...authHeader(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return mapMessageResponse(data);
}

export async function listAllUsers(accessToken: string): Promise<AdminUser[]> {
  const data = await requestJson<UserSummaryResponseDto[]>(
    "/api/v1/admin/users",
    { headers: authHeader(accessToken) },
  );
  return mapUsers(data);
}

export async function changeUserRole(
  id: string,
  role: Exclude<UserRole, "PROVIDER">,
  accessToken: string,
): Promise<Message> {
  const payload: ChangeUserRoleRequestDto = { role };
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}/role`,
    {
      method: "PUT",
      headers: { ...authHeader(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return mapMessageResponse(data);
}

export async function suspendUser(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}/suspend`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function reactivateUser(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}/reactivate`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function deleteUser(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}`,
    { method: "DELETE", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function restoreUser(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}/restore`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function permanentlyDeleteUser(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/users/${id}/permanent`,
    { method: "DELETE", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function listAllTickets(accessToken: string): Promise<Ticket[]> {
  const data = await requestJson<TicketResponseDto[]>(
    "/api/v1/admin/tickets",
    { headers: authHeader(accessToken) },
  );
  return mapTickets(data);
}

export async function adminUpdateTicket(
  id: number,
  update: { status?: TicketStatus; priority?: TicketPriority },
  accessToken: string,
): Promise<Ticket> {
  const payload: AdminUpdateTicketRequestDto = {
    status: update.status ?? null,
    priority: update.priority ?? null,
  };
  const data = await requestJson<TicketResponseDto>(
    `/api/v1/admin/tickets/${id}`,
    {
      method: "PUT",
      headers: { ...authHeader(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return mapTicket(data);
}

export async function adminDeleteTicket(id: number, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/tickets/${id}`,
    { method: "DELETE", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}
