package com.example.backend.service;

import com.example.backend.domain.location.Location;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProviderSearchServiceImplTest {

    @Mock private ProviderRepository providerRepository;

    @InjectMocks
    private ProviderSearchServiceImpl providerSearchService;

    private Provider activeProvider() {
        Provider p = new Provider();
        p.setId(UUID.randomUUID());
        p.setEmail("provider@test.com");
        p.setFirstName("Ana");
        p.setLastName("Kovač");
        p.setPassword("encoded");
        p.setRole(UserRole.PROVIDER);
        p.setStatus(UserStatus.ACTIVE);
        p.setDeleted(false);
        return p;
    }

    // ── search ───────────────────────────────────────────────────────────────

    @Test
    void searchShouldReturnPagedResults() {
        ProviderSearchParams params = new ProviderSearchParams();
        params.setPage(0);
        params.setSize(10);

        Provider p = activeProvider();
        Page<Provider> page = new PageImpl<>(List.of(p), PageRequest.of(0, 10), 1);

        when(providerRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<ProviderSearchResult> result = providerSearchService.search(params);

        assertEquals(1, result.getTotalElements());
        verify(providerRepository).findAll(any(Specification.class), any(PageRequest.class));
    }

    @Test
    void searchShouldComputeDistanceWhenCoordinatesProvided() {
        ProviderSearchParams params = new ProviderSearchParams();
        params.setPage(0);
        params.setSize(10);
        params.setLatitude(46.0569);
        params.setLongitude(14.5058);

        Provider p = activeProvider();
        Location loc = new Location();
        loc.setLatitude(46.5547);
        loc.setLongitude(15.6467);
        p.setLocation(loc);

        Page<Provider> page = new PageImpl<>(List.of(p), PageRequest.of(0, 10), 1);
        when(providerRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<ProviderSearchResult> result = providerSearchService.search(params);

        assertEquals(1, result.getTotalElements());
        ProviderSearchResult searchResult = result.getContent().get(0);
        // Distance should be computed (roughly 110 km between Ljubljana and Maribor)
        assertNotNull(searchResult.getDistanceKm());
        assertTrue(searchResult.getDistanceKm() > 50 && searchResult.getDistanceKm() < 150);
    }

    @Test
    void searchShouldReturnNullDistanceWhenNoCoordinates() {
        ProviderSearchParams params = new ProviderSearchParams();
        params.setPage(0);
        params.setSize(10);
        // No lat/lng set

        Provider p = activeProvider();
        Page<Provider> page = new PageImpl<>(List.of(p), PageRequest.of(0, 10), 1);
        when(providerRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<ProviderSearchResult> result = providerSearchService.search(params);

        ProviderSearchResult searchResult = result.getContent().get(0);
        assertNull(searchResult.getDistanceKm());
    }

    // ── getActiveCategories ──────────────────────────────────────────────────

    @Test
    void getActiveCategoriesShouldReturnSet() {
        Set<ServiceCategory> categories = Set.of(ServiceCategory.PLUMBING, ServiceCategory.ELECTRICAL);
        when(providerRepository.findDistinctCategoriesByStatus(UserStatus.ACTIVE)).thenReturn(categories);

        Set<ServiceCategory> result = providerSearchService.getActiveCategories();

        assertEquals(2, result.size());
        assertTrue(result.contains(ServiceCategory.PLUMBING));
    }

    // ── getPublicProfile ─────────────────────────────────────────────────────

    @Test
    void getPublicProfileShouldReturnActiveProvider() {
        Provider p = activeProvider();
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));

        ProviderSearchResult result = providerSearchService.getPublicProfile(p.getId());

        assertNotNull(result);
        assertEquals(p.getId(), result.getId());
    }

    @Test
    void getPublicProfileShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(providerRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> providerSearchService.getPublicProfile(id));
    }

    @Test
    void getPublicProfileShouldThrowForDeletedProvider() {
        Provider p = activeProvider();
        p.setDeleted(true);
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));

        assertThrows(UserNotFoundException.class, () -> providerSearchService.getPublicProfile(p.getId()));
    }

    @Test
    void getPublicProfileShouldThrowForDeletedStatus() {
        Provider p = activeProvider();
        p.setStatus(UserStatus.DELETED);
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));

        assertThrows(UserNotFoundException.class, () -> providerSearchService.getPublicProfile(p.getId()));
    }
}
