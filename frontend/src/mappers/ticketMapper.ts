import type { TicketResponseDto } from "@/dto/ticket";
import type { Ticket } from "@/domain/ticket";

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
  };
}

export function mapTickets(dtos: TicketResponseDto[]): Ticket[] {
  return dtos.map(mapTicket);
}

