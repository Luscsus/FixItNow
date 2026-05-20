package com.example.backend.service;

import com.example.backend.domain.user.Provider;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ProviderSpecification;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProviderSearchServiceImpl implements ProviderSearchService {

    private final ProviderRepository providerRepository;

    @Override
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

    private Double computeDistance(Provider provider, ProviderSearchParams params) {
        if (params.getLatitude() == null || params.getLongitude() == null
                || provider.getLocationLat() == null || provider.getLocationLon() == null) {
            return null;
        }
        double lat1 = Math.toRadians(params.getLatitude());
        double lon1 = Math.toRadians(params.getLongitude());
        double lat2 = Math.toRadians(provider.getLocationLat().doubleValue());
        double lon2 = Math.toRadians(provider.getLocationLon().doubleValue());
        double cosAngle = Math.sin(lat1) * Math.sin(lat2)
            + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        // clamp to [-1, 1] to guard against floating-point rounding past domain of acos
        cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
        return 6371.0 * Math.acos(cosAngle);
    }
}
