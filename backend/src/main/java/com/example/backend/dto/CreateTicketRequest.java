package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
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
}

