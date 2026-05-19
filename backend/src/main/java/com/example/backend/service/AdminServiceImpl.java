package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
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
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUser(user);
        log.info("User {} marked as deleted", user.getEmail());
        return new MessageResponse("User deleted.");
    }
}
