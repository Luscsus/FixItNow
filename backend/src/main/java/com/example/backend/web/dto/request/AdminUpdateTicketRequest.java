package com.example.backend.web.dto.request;

import com.example.backend.domain.ticket.TicketPriority;
import com.example.backend.domain.ticket.TicketStatus;
import lombok.Data;

@Data
public class AdminUpdateTicketRequest {

    private TicketStatus status;
    private TicketPriority priority;
}
