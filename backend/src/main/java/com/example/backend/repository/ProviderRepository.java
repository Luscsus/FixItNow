package com.example.backend.repository;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, UUID>, JpaSpecificationExecutor<Provider> {

    List<Provider> findAllByStatus(UserStatus status);

    @Query("SELECT DISTINCT c FROM Provider p JOIN p.categories c WHERE p.status = :status")
    Set<ServiceCategory> findDistinctCategoriesByStatus(@Param("status") UserStatus status);
}
