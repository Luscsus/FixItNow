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
  submittedByName: string | null;
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
  priority: TicketPriorityDto;
  assignedProviderId?: string | null;
};
