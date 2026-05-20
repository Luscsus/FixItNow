export type TicketPriorityDto = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatusDto =
  | "PENDING_APPROVAL"
  | "DECLINED"
  | "APPROVED"
  | "IN_TRANSIT"
  | "PENDING_PROVIDER_INVOICE"
  | "PENDING_PAYMENT"
  | "COMPLETED"
  | "CANCELLED";

export type TicketResponseDto = {
  id: number;
  serviceType: string;
  description: string;
  status: TicketStatusDto;
  priority: TicketPriorityDto;
  estimatedCost: number;
  createdAt: string;
  assignedServiceProviderName: string | null;
};

export type CreateTicketRequestDto = {
  serviceType: string;
  description: string;
  location: string;
  priority: TicketPriorityDto;
};
