package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TicketResponse {

    private Long id;
    private String serviceType;
    private String description;
    private String location;
    private TicketStatus status;
    private TicketPriority priority;
    private BigDecimal estimatedCost;
    private LocalDateTime createdAt;
    private String assignedServiceProviderName;

    public TicketResponse() {
    }

    public TicketResponse(Long id, String serviceType, String description, String location, TicketStatus status,
                          TicketPriority priority, BigDecimal estimatedCost, LocalDateTime createdAt,
                          String assignedServiceProviderName) {
        this.id = id;
        this.serviceType = serviceType;
        this.description = description;
        this.location = location;
        this.status = status;
        this.priority = priority;
        this.estimatedCost = estimatedCost;
        this.createdAt = createdAt;
        this.assignedServiceProviderName = assignedServiceProviderName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAssignedServiceProviderName() {
        return assignedServiceProviderName;
    }

    public void setAssignedServiceProviderName(String assignedServiceProviderName) {
        this.assignedServiceProviderName = assignedServiceProviderName;
    }
}

