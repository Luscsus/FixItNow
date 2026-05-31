package com.example.backend.service;

import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ProviderSpecification;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProviderSearchServiceImpl implements ProviderSearchService {

    private final ProviderRepository providerRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProviderSearchResult> search(ProviderSearchParams params) {
        Specification<Provider> spec = Specification
            .where(ProviderSpecification.isActive())
            .and(ProviderSpecification.hasAnyCategory(params.getCategories()))
            .and(ProviderSpecification.minPrice(params.getMinPrice()))
            .and(ProviderSpecification.maxPrice(params.getMaxPrice()))
            .and(ProviderSpecification.minYearsOfExperience(params.getMinYearsOfExperience()))
            .and(ProviderSpecification.withinRadius(params.getLatitude(), params.getLongitude(), params.getRadiusKm()));

        return providerRepository.findAll(spec, PageRequest.of(params.getPage(), params.getSize()))
            .map(p -> ProviderSearchResult.from(p, computeDistance(p, params)));
    }

    @Override
    @Transactional(readOnly = true)
    public Set<ServiceCategory> getActiveCategories() {
        return providerRepository.findDistinctCategoriesByStatus(UserStatus.ACTIVE);
    }

    @Override
    @Transactional(readOnly = true)
    public ProviderSearchResult getPublicProfile(UUID id) {
        // Mapping happens inside the transaction so lazy associations (location, categories)
        // can be initialized before the session closes.
        Provider p = providerRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + id));
        return ProviderSearchResult.from(p, null);
    }

    private Double computeDistance(Provider provider, ProviderSearchParams params) {
        if (params.getLatitude() == null || params.getLongitude() == null
                || provider.getLocation() == null
                || provider.getLocation().getLatitude() == null
                || provider.getLocation().getLongitude() == null) {
            return null;
        }
        double lat1 = Math.toRadians(params.getLatitude());
        double lon1 = Math.toRadians(params.getLongitude());
        double lat2 = Math.toRadians(provider.getLocation().getLatitude());
        double lon2 = Math.toRadians(provider.getLocation().getLongitude());
        double cosAngle = Math.sin(lat1) * Math.sin(lat2)
            + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        // clamp to [-1, 1] to guard against floating-point rounding past domain of acos
        cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
        return 6371.0 * Math.acos(cosAngle);
    }
}
