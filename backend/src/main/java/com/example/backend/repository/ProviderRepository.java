package com.example.backend.repository;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, UUID> {

    List<Provider> findAllByStatus(UserStatus status);
}
