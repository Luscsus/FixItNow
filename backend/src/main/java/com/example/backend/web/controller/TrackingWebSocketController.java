package com.example.backend.web.controller;

import com.example.backend.dto.ProviderLocationUpdate;
import com.example.backend.dto.TrackingUpdateResponse;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Receives the provider's live GPS updates over STOMP and relays the computed
 * tracking snapshot to the customer's per-ticket topic.
 *
 *   provider  --(/app/tracking.update)-->  server
 *   server    --(/topic/tracking/{id}) -->  customer
 */
@Controller
@RequiredArgsConstructor
public class TrackingWebSocketController {

    private final TrackingService trackingService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/tracking.update")
    public void update(@Valid @Payload ProviderLocationUpdate update, Principal principal) {
        UserPrincipal userPrincipal = requireUser(principal);
        TrackingUpdateResponse snapshot =
            trackingService.handleProviderUpdate(userPrincipal.getUser().getId(), update);
        messagingTemplate.convertAndSend("/topic/tracking/" + snapshot.ticketId(), snapshot);
    }

    private UserPrincipal requireUser(Principal principal) {
        if (!(principal instanceof UsernamePasswordAuthenticationToken auth)
            || !(auth.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new AccessDeniedException("Missing or invalid authentication");
        }
        return userPrincipal;
    }
}
