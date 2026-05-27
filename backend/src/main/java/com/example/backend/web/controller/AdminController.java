package com.example.backend.web.controller;

import com.example.backend.dto.TicketResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.AdminService;
import com.example.backend.service.TicketService;
import com.example.backend.web.dto.request.AdminUpdateTicketRequest;
import com.example.backend.web.dto.request.ChangeUserRoleRequest;
import com.example.backend.web.dto.request.DeclineProviderRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Administrative operations: provider approvals and user management. Requires ADMIN role.")
public class AdminController {

    private final AdminService adminService;
    private final TicketService ticketService;

    @Operation(summary = "List providers pending approval")
    @GetMapping("/providers/pending")
    public ResponseEntity<List<ProviderResponse>> listPendingProviders() {
        return ResponseEntity.ok(adminService.listPendingProviders());
    }

    @Operation(summary = "List all providers")
    @GetMapping("/providers")
    public ResponseEntity<List<ProviderResponse>> listAllProviders() {
        return ResponseEntity.ok(adminService.listAllProviders());
    }

    @Operation(summary = "Get a single provider's full details")
    @GetMapping("/providers/{id}")
    public ResponseEntity<ProviderResponse> getProvider(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.getProvider(id));
    }

    @Operation(summary = "Approve a provider application")
    @PostMapping("/providers/{id}/approve")
    public ResponseEntity<MessageResponse> approveProvider(
        @PathVariable UUID id,
        @AuthenticationPrincipal UserPrincipal admin
    ) {
        return ResponseEntity.ok(adminService.approveProvider(id, admin.getUser().getId()));
    }

    @Operation(summary = "Decline a provider application", description = "Rejects an application and emails the applicant with the given reason.")
    @PostMapping("/providers/{id}/decline")
    public ResponseEntity<MessageResponse> declineProvider(
        @PathVariable UUID id,
        @Valid @RequestBody DeclineProviderRequest request,
        @AuthenticationPrincipal UserPrincipal admin
    ) {
        return ResponseEntity.ok(adminService.declineProvider(id, request, admin.getUser().getId()));
    }

    @Operation(summary = "List all users (across all roles)")
    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> listAllUsers() {
        return ResponseEntity.ok(adminService.listAllUsers());
    }

    @Operation(summary = "Suspend a user account")
    @PostMapping("/users/{id}/suspend")
    public ResponseEntity<MessageResponse> suspendUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.suspendUser(id));
    }

    @Operation(summary = "Reactivate a suspended user account")
    @PostMapping("/users/{id}/reactivate")
    public ResponseEntity<MessageResponse> reactivateUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.reactivateUser(id));
    }

    @Operation(summary = "Soft-delete a user")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.deleteUser(id));
    }

    @Operation(summary = "Change a user's role", description = "Only CUSTOMER and ADMIN roles are supported. Provider conversions are not allowed.")
    @PutMapping("/users/{id}/role")
    public ResponseEntity<MessageResponse> changeUserRole(
        @PathVariable UUID id,
        @Valid @RequestBody ChangeUserRoleRequest request,
        @AuthenticationPrincipal UserPrincipal admin
    ) {
        return ResponseEntity.ok(adminService.changeUserRole(id, request.getRole(), admin.getUser().getId()));
    }

    @Operation(summary = "List all tickets (across all customers and providers)")
    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> listAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @Operation(summary = "Update a ticket's status and/or priority", description = "Status changes bypass the normal lifecycle state machine.")
    @PutMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
        @PathVariable Long id,
        @Valid @RequestBody AdminUpdateTicketRequest request
    ) {
        return ResponseEntity.ok(ticketService.adminUpdateTicket(id, request.getStatus(), request.getPriority()));
    }

    @Operation(summary = "Delete a ticket")
    @DeleteMapping("/tickets/{id}")
    public ResponseEntity<MessageResponse> deleteTicket(@PathVariable Long id) {
        ticketService.adminDeleteTicket(id);
        return ResponseEntity.ok(new MessageResponse("Ticket deleted."));
    }
}
