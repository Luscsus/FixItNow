package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.web.dto.request.DeclineProviderRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminServiceImpl implements AdminService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public List<ProviderResponse> listPendingProviders() {
        return providerRepository.findAllByStatus(UserStatus.PENDING_APPROVAL)
            .stream().map(ProviderResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProviderResponse> listAllProviders() {
        return providerRepository.findAll()
            .stream().map(ProviderResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderResponse getProvider(UUID providerId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new ResourceNotFoundException("Provider not found."));
        return ProviderResponse.from(provider);
    }

    @Override
    public MessageResponse approveProvider(UUID providerId, UUID adminId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new ResourceNotFoundException("Provider not found."));

        if (provider.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new ApiException("Provider is not pending approval. Current status: " + provider.getStatus());
        }

        provider.setStatus(UserStatus.ACTIVE);
        provider.setEmailVerified(true);
        provider.setApprovedAt(LocalDateTime.now());
        provider.setApprovedBy(adminId);
        provider.setRejectionReason(null);
        providerRepository.save(provider);

        emailService.sendProviderApproved(provider.getEmail(), provider.getFirstName());
        log.info("Provider {} approved by admin {}", provider.getEmail(), adminId);
        return new MessageResponse("Provider approved successfully.");
    }

    @Override
    public MessageResponse declineProvider(UUID providerId, DeclineProviderRequest request, UUID adminId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new ResourceNotFoundException("Provider not found."));

        if (provider.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new ApiException("Provider is not pending approval. Current status: " + provider.getStatus());
        }

        provider.setStatus(UserStatus.REJECTED);
        provider.setRejectionReason(request.getReason());
        providerRepository.save(provider);

        emailService.sendProviderDeclined(provider.getEmail(), provider.getFirstName(), request.getReason());
        log.info("Provider {} declined by admin {}", provider.getEmail(), adminId);
        return new MessageResponse("Provider declined.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listAllUsers() {
        return userRepository.findAll()
            .stream().map(UserSummaryResponse::from).toList();
    }

    @Override
    public MessageResponse suspendUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUser(user);
        log.info("User {} suspended", user.getEmail());
        return new MessageResponse("User suspended.");
    }

    @Override
    public MessageResponse reactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getStatus() != UserStatus.SUSPENDED) {
            throw new ApiException("User is not suspended.");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        log.info("User {} reactivated", user.getEmail());
        return new MessageResponse("User reactivated.");
    }

    @Override
    public MessageResponse deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        user.setDeleted(true);
        user.setStatus(UserStatus.DELETED);
        user.setDeletedAt(LocalDateTime.now());
        if (user.getDeletionReason() == null) {
            user.setDeletionReason("Removed by administrator");
        }
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUser(user);
        log.info("User {} soft-deleted by admin", user.getEmail());
        return new MessageResponse("User deleted.");
    }

    @Override
    public MessageResponse restoreUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (!user.isDeleted() && user.getStatus() != UserStatus.DELETED) {
            throw new ApiException("User is not deleted.");
        }
        user.setDeleted(false);
        user.setStatus(UserStatus.ACTIVE);
        user.setDeletedAt(null);
        user.setDeletedBy(null);
        user.setDeletionReason(null);
        userRepository.save(user);
        log.info("User {} restored by admin", user.getEmail());
        return new MessageResponse("User restored.");
    }

    @Override
    public MessageResponse permanentlyDeleteUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        // Only hard-delete an already soft-deleted account, and only when nothing
        // references it — otherwise referential integrity (tickets/reviews/chats)
        // blocks it and we surface a clear message instead of a 500.
        if (!user.isDeleted()) {
            throw new ApiException("Soft-delete the account first before permanent deletion.");
        }
        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new ApiException(
                "This account still has linked records (tickets, messages, reviews) and cannot be permanently deleted. It remains soft-deleted for record-keeping.");
        }
        log.warn("User {} PERMANENTLY deleted by admin", user.getEmail());
        return new MessageResponse("User permanently deleted.");
    }

    @Override
    public MessageResponse changeUserRole(UUID userId, UserRole newRole, UUID adminId) {
        if (userId.equals(adminId)) {
            throw new ApiException("You cannot change your own role.");
        }
        if (newRole != UserRole.CUSTOMER && newRole != UserRole.ADMIN) {
            throw new ApiException("Only CUSTOMER and ADMIN roles can be assigned here.");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getRole() == UserRole.PROVIDER) {
            throw new ApiException("Provider role changes aren't supported here.");
        }

        user.setRole(newRole);
        userRepository.save(user);
        // Role lives in the JWT — revoke refresh tokens so the change takes effect on next login.
        refreshTokenRepository.revokeAllByUser(user);
        log.info("User {} role changed to {} by admin {}", user.getEmail(), newRole, adminId);
        return new MessageResponse("User role updated. The user must sign in again for it to take effect.");
    }
}
