package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Soft-deletes user accounts. The user row is preserved (so tickets, messages,
 * invoices, payouts, reviews, and audit history stay intact) — we only flip the
 * {@code deleted}/{@code status} flags and revoke sessions.
 */
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);

    // A ticket in any of these states blocks account deletion (open / in-flight
    // work, or money not yet settled). COMPLETED / CANCELLED / DECLINED are terminal.
    private static final Set<TicketStatus> BLOCKING = EnumSet.of(
        TicketStatus.PENDING_APPROVAL,
        TicketStatus.APPROVED,
        TicketStatus.IN_TRANSIT,
        TicketStatus.PENDING_PROVIDER_INVOICE,
        TicketStatus.PENDING_PAYMENT
    );

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Soft-deletes the caller's own account after validating they have no
     * outstanding work or payments. Throws {@link ApiException} (mapped to a
     * 4xx) with a user-facing message when blocked.
     */
    @Transactional
    public void deleteOwnAccount(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (user.isDeleted() || user.getStatus() == UserStatus.DELETED) {
            throw new ApiException("This account has already been deleted.");
        }

        if (user.getRole() == UserRole.PROVIDER) {
            long active = ticketRepository.countByAssignedServiceProvider_IdAndStatusIn(userId, BLOCKING);
            if (active > 0) {
                throw new ApiException(
                    "You cannot delete your account while you have active jobs, pending payouts, or unresolved disputes.");
            }
        } else {
            long active = ticketRepository.countByUser_IdAndStatusIn(userId, BLOCKING);
            if (active > 0) {
                throw new ApiException(
                    "You cannot delete your account while you have active tickets, disputes, or pending payments.");
            }
        }

        softDelete(user, userId, "Self-service deletion");
        log.info("Account {} ({}) soft-deleted by self", user.getId(), user.getEmail());
    }

    private void softDelete(User user, UUID deletedBy, String reason) {
        user.setDeleted(true);
        user.setStatus(UserStatus.DELETED);
        user.setDeletedAt(LocalDateTime.now());
        user.setDeletedBy(deletedBy);
        if (user.getDeletionReason() == null) {
            user.setDeletionReason(reason);
        }
        userRepository.save(user);
        // Revoke all sessions so the account is logged out everywhere immediately.
        refreshTokenRepository.revokeAllByUser(user);
    }
}
