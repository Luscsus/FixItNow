package com.example.backend.domain.notification;

public enum NotificationType {
    TICKET_STATUS_CHANGE,
    NEW_MESSAGE,
    PROVIDER_NEARBY,
    // Provider-facing alerts:
    INBOUND_REQUEST,   // a customer requested this provider directly on a new ticket
    PAYMENT_RECEIVED,  // a customer paid the invoice and the ticket is now complete
    REVIEW_RECEIVED    // a customer left this provider a review
}
