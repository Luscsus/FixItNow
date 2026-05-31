package com.example.backend.web.controller;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.SavedProvider;
import com.example.backend.domain.user.SavedProvider.SavedProviderId;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.SavedProviderRepository;
import com.example.backend.security.UserPrincipal;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/saved-providers")
@RequiredArgsConstructor
@Tag(name = "Saved providers", description = "Customer's bookmarked providers.")
public class SavedProviderController {

    private final SavedProviderRepository savedProviderRepository;
    private final ProviderRepository providerRepository;

    @Operation(summary = "List the current user's saved providers.")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProviderSearchResult>> list(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUser().getId();
        List<SavedProvider> saved = savedProviderRepository.findAllByIdUserIdOrderByCreatedAtDesc(userId);
        List<UUID> providerIds = saved.stream().map(s -> s.getId().getProviderId()).toList();
        if (providerIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<Provider> providers = providerRepository.findAllById(providerIds);
        List<ProviderSearchResult> results = providerIds.stream()
            .map(id -> providers.stream().filter(p -> p.getId().equals(id)).findFirst().orElse(null))
            .filter(p -> p != null)
            .map(p -> ProviderSearchResult.from(p, null))
            .toList();
        return ResponseEntity.ok(results);
    }

    @Operation(summary = "Save a provider.")
    @PostMapping("/{providerId}")
    @Transactional
    public ResponseEntity<MessageResponse> save(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID providerId
    ) {
        UUID userId = principal.getUser().getId();
        if (userId.equals(providerId)) {
            throw new ApiException("You cannot save yourself.");
        }
        if (!providerRepository.existsById(providerId)) {
            throw new ResourceNotFoundException("Provider not found");
        }
        if (!savedProviderRepository.existsByIdUserIdAndIdProviderId(userId, providerId)) {
            savedProviderRepository.save(SavedProvider.builder()
                .id(new SavedProviderId(userId, providerId))
                .build());
        }
        return ResponseEntity.ok(new MessageResponse("Saved"));
    }

    @Operation(summary = "Unsave a provider.")
    @DeleteMapping("/{providerId}")
    @Transactional
    public ResponseEntity<MessageResponse> unsave(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID providerId
    ) {
        UUID userId = principal.getUser().getId();
        savedProviderRepository.deleteByIdUserIdAndIdProviderId(userId, providerId);
        return ResponseEntity.ok(new MessageResponse("Unsaved"));
    }
}
