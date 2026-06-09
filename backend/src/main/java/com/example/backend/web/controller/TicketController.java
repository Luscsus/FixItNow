package com.example.backend.web.controller;

import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.dto.CreateTicketRequest;
import com.example.backend.dto.OpenTicketSummary;
import com.example.backend.dto.TicketResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.TicketService;
import com.example.backend.web.dto.request.ScheduleTicketRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;

import java.util.List;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final com.example.backend.service.TrackingService trackingService;

    public TicketController(TicketService ticketService,
                            com.example.backend.service.TrackingService trackingService) {
        this.ticketService = ticketService;
        this.trackingService = trackingService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> createTicket(
        @Valid @RequestBody CreateTicketRequest request,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ticketService.createTicket(request, userDetails.getUser().getId()));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponse>> getUserTickets(@AuthenticationPrincipal UserPrincipal userDetails) {
        return ResponseEntity.ok(ticketService.getUserTickets(userDetails.getUser().getId()));
    }

    @GetMapping("/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> getTicketDetails(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(
            ticketService.getTicketDetails(ticketId, userDetails.getUser().getId()));
    }

    /** Last-known live-tracking snapshot for a ticket (customer or assigned provider). */
    @GetMapping("/{ticketId}/tracking")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<com.example.backend.dto.TrackingUpdateResponse> getTracking(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(
            trackingService.getSnapshot(userDetails.getUser().getId(), ticketId));
    }

    @PutMapping("/{ticketId}/status")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> updateTicketStatus(
        @PathVariable Long ticketId,
        @Parameter(
            description = "New ticket status",
            schema = @Schema(
                allowableValues = {
                    "PENDING_APPROVAL",
                    "DECLINED",
                    "APPROVED",
                    "IN_TRANSIT",
                    "PENDING_PROVIDER_INVOICE",
                    "PENDING_PAYMENT",
                    "COMPLETED",
                    "CANCELLED"
                }
            )
        )
        @RequestParam TicketStatus newStatus
    ) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(ticketId, newStatus));
    }

    /** Assigned provider records an out-of-band payment, completing the ticket. */
    @PostMapping("/{ticketId}/payment/received")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> markPaymentReceived(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(
            ticketService.markPaymentReceivedByProvider(ticketId, userDetails.getUser().getId()));
    }

    @PostMapping("/{ticketId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> cancelTicket(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.cancelTicketByCustomer(ticketId, userDetails.getUser().getId()));
    }

    @GetMapping("/provider")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<List<TicketResponse>> getProviderTickets(@AuthenticationPrincipal UserPrincipal userDetails) {
        return ResponseEntity.ok(ticketService.getProviderTickets(userDetails.getUser().getId()));
    }

    @GetMapping("/open")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<List<TicketResponse>> getOpenTickets() {
        return ResponseEntity.ok(ticketService.getOpenTicketsFull());
    }

    @GetMapping("/open/matching")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<List<com.example.backend.web.dto.response.MatchingOpenTicketResponse>> getMatchingOpenTickets(
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.getMatchingOpenTickets(userDetails.getUser().getId()));
    }

    @PostMapping("/{ticketId}/accept")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> acceptOpenTicket(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.acceptOpenTicket(ticketId, userDetails.getUser().getId()));
    }

    @PostMapping("/{ticketId}/release")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> releaseTicket(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.releaseTicket(ticketId, userDetails.getUser().getId()));
    }

    @DeleteMapping("/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteTicket(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        ticketService.deleteTicket(ticketId, userDetails.getUser().getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/open")
    public ResponseEntity<List<OpenTicketSummary>> getPublicOpenTickets() {
        return ResponseEntity.ok(ticketService.getPublicOpenTicketSummaries());
    }

    @PostMapping("/{ticketId}/confirm")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> confirmTicket(
        @PathVariable Long ticketId,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.confirmTicket(ticketId, userDetails.getUser().getId()));
    }

    @PutMapping("/{ticketId}/schedule")
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> scheduleTicket(
        @PathVariable Long ticketId,
        @Valid @RequestBody ScheduleTicketRequest request,
        @AuthenticationPrincipal UserPrincipal userDetails
    ) {
        return ResponseEntity.ok(ticketService.scheduleTicket(
            ticketId,
            userDetails.getUser().getId(),
            request.getStartAt(),
            request.getEndAt()
        ));
    }

    @PostMapping(value = "/{ticketId}/invoice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PROVIDER')")
    public ResponseEntity<TicketResponse> issueInvoice(
        @PathVariable Long ticketId,
        @RequestParam BigDecimal amount,
        @RequestPart("pdf") MultipartFile pdfFile
    ) throws IOException {
        return ResponseEntity.ok(ticketService.issueInvoice(ticketId, amount, pdfFile.getBytes()));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<TicketResponse>> findNearbyTickets(
        @RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(defaultValue = "5") Double radiusKm
    ) {
        return ResponseEntity.ok(ticketService.findNearbyTickets(latitude, longitude, radiusKm));
    }
}
