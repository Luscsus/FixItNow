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

export type ServiceCategoryDto =
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

export type StatusHistoryEntryDto = {
  status: TicketStatusDto;
  changedAt: string;
};

export type TicketResponseDto = {
  id: number;
  serviceType: string;
  category: ServiceCategoryDto;
  description: string;
  location: string;
  status: TicketStatusDto;
  priority: TicketPriorityDto | null;
  estimatedCost: number | null;
  createdAt: string;
  assignedServiceProviderName: string | null;
  assignedServiceProviderId?: string | null;
  assignedServiceProviderProfilePictureUrl?: string | null;
  submittedByName: string | null;
  submittedById?: string | null;
  submittedByProfilePictureUrl?: string | null;
  chatRoomId?: string | null;
  requestedStartAt: string | null;
  requestedEndAt: string | null;
  statusHistory?: StatusHistoryEntryDto[] | null;
  imageUrls?: string[];
  // Assigned provider's bank/payout details — present only on the detail view.
  bankAccountHolder?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  bankName?: string | null;
  bankRecipientStreet?: string | null;
  bankRecipientCity?: string | null;
};

export type OpenTicketSummaryDto = {
  serviceType: string;
  category: ServiceCategoryDto;
};

export type CreateTicketRequestDto = {
  serviceType: string;
  category: ServiceCategoryDto;
  description: string;
  location: string;
  /** Exact coordinates from address autocomplete (optional). */
  latitude?: number | null;
  longitude?: number | null;
  priority: TicketPriorityDto;
  assignedProviderId?: string | null;
  requestedStartAt?: string | null;
  requestedEndAt?: string | null;
  imageUrls?: string[];
};
