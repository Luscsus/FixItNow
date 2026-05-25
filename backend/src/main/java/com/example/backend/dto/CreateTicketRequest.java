package com.example.backend.dto;

import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.user.ServiceCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class CreateTicketRequest {

    @NotBlank
    private String serviceType;

    @NotNull
    private ServiceCategory category;

    @NotBlank
    private String description;

    @NotBlank
    private String location;

    private Double latitude;

    private Double longitude;

    private TicketPriority priority;

    private UUID assignedProviderId;

    private LocalDateTime requestedStartAt;

    private LocalDateTime requestedEndAt;

    @Size(max = 10, message = "A ticket may have at most 10 images")
    private List<String> imageUrls;

    public CreateTicketRequest() {
    }
}

