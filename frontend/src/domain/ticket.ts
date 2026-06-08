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
  submittedById?: string | null;
  submittedByProfilePictureUrl?: string | null;
  /** Customer's phone — present only to the assigned provider on the detail view. */
  customerPhoneNumber?: string | null;
  chatRoomId?: string | null;
  requestedStartAt?: Date | null;
  requestedEndAt?: Date | null;
  statusHistory?: StatusHistoryEntry[] | null;
  imageUrls?: string[];
  // Assigned provider's bank/payout details — present only on the detail view.
  bankAccountHolder?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  bankName?: string | null;
  bankRecipientStreet?: string | null;
  bankRecipientCity?: string | null;
};

