package com.example.backend.service;

import com.example.backend.web.dto.request.DeclineProviderRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface AdminService {

    List<ProviderResponse> listPendingProviders();

    List<ProviderResponse> listAllProviders();

    ProviderResponse getProvider(UUID providerId);

    MessageResponse approveProvider(UUID providerId, UUID adminId);

    MessageResponse declineProvider(UUID providerId, DeclineProviderRequest request, UUID adminId);

    List<UserSummaryResponse> listAllUsers();

    MessageResponse suspendUser(UUID userId);

    MessageResponse reactivateUser(UUID userId);

    MessageResponse deleteUser(UUID userId);
}
