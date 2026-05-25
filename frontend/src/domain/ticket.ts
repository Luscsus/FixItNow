export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TicketStatus =
  | "PENDING_APPROVAL"
  | "DECLINED"
  | "APPROVED"
  | "IN_TRANSIT"
  | "PENDING_PROVIDER_INVOICE"
  | "PENDING_PAYMENT"
  | "COMPLETED"
  | "CANCELLED";

export type Ticket = {
  id: number;
  serviceType: string;
  description: string;
  location: string;
  status: TicketStatus;
  priority: TicketPriority;
  estimatedCost: number | null;
  createdAt: Date;
  assignedServiceProviderName?: string | null;
  submittedByName?: string | null;
  chatRoomId?: string | null;
};

