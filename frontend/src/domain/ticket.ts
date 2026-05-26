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

export type ServiceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "CARPENTRY"
  | "PAINTING"
  | "CLEANING"
  | "GARDENING"
  | "MOVING"
  | "APPLIANCE_REPAIR"
  | "HVAC"
  | "ROOFING"
  | "LOCKSMITH"
  | "PEST_CONTROL"
  | "TUTORING"
  | "IT_SUPPORT"
  | "OTHER";

export type StatusHistoryEntry = {
  status: TicketStatus;
  changedAt: Date;
};

export type Ticket = {
  id: number;
  serviceType: string;
  category: ServiceCategory;
  description: string;
  location: string;
  status: TicketStatus;
  priority: TicketPriority | null;
  estimatedCost: number | null;
  createdAt: Date;
  assignedServiceProviderName?: string | null;
  assignedServiceProviderId?: string | null;
  assignedServiceProviderProfilePictureUrl?: string | null;
  submittedByName?: string | null;
  submittedByProfilePictureUrl?: string | null;
  chatRoomId?: string | null;
  requestedStartAt?: Date | null;
  requestedEndAt?: Date | null;
  statusHistory?: StatusHistoryEntry[] | null;
  imageUrls?: string[];
};

