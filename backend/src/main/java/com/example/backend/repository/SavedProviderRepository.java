package com.example.backend.repository;

import com.example.backend.domain.user.SavedProvider;
import com.example.backend.domain.user.SavedProvider.SavedProviderId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedProviderRepository extends JpaRepository<SavedProvider, SavedProviderId> {

    List<SavedProvider> findAllByIdUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByIdUserIdAndIdProviderId(UUID userId, UUID providerId);

    void deleteByIdUserIdAndIdProviderId(UUID userId, UUID providerId);
}
