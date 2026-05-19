package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import jakarta.validation.constraints.NotBlank;

public class CreateTicketRequest {

    @NotBlank
    private String serviceType;

    @NotBlank
    private String description;

    @NotBlank
    private String location;

    private Double latitude;

    private Double longitude;

    private TicketPriority priority;

    public CreateTicketRequest() {
    }

    public CreateTicketRequest(String serviceType, String description, String location, Double latitude,
                               Double longitude, TicketPriority priority) {
        this.serviceType = serviceType;
        this.description = description;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.priority = priority;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }
}

