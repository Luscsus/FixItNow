package com.example.backend.service;

import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import org.springframework.data.domain.Page;

import java.util.Set;

public interface ProviderSearchService {

    Page<ProviderSearchResult> search(ProviderSearchParams params);

    Set<ServiceCategory> getActiveCategories();
}
