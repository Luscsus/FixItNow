import type { TicketResponseDto } from "@/dto/ticket";
import type { Ticket, StatusHistoryEntry } from "@/domain/ticket";

export function mapTicket(dto: TicketResponseDto): Ticket {
  return {
    id: dto.id,
    serviceType: dto.serviceType,
    category: dto.category,
    description: dto.description,
    location: dto.location,
    status: dto.status,
    priority: dto.priority,
    estimatedCost: dto.estimatedCost,
    createdAt: new Date(dto.createdAt),
    assignedServiceProviderName: dto.assignedServiceProviderName ?? null,
    submittedByName: dto.submittedByName ?? null,
    requestedStartAt: dto.requestedStartAt ? new Date(dto.requestedStartAt) : null,
    requestedEndAt: dto.requestedEndAt ? new Date(dto.requestedEndAt) : null,
    statusHistory: dto.statusHistory
      ? dto.statusHistory.map((h): StatusHistoryEntry => ({
          status: h.status,
          changedAt: new Date(h.changedAt),
        }))
      : null,
  };
}

export function mapTickets(dtos: TicketResponseDto[]): Ticket[] {
  return dtos.map(mapTicket);
}

