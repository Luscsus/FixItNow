package com.example.backend.dto;

import com.example.backend.domain.user.ServiceCategory;

public record OpenTicketSummary(String serviceType, ServiceCategory category) {
}
