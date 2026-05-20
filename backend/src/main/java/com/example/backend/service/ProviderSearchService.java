package com.example.backend.service;

import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import org.springframework.data.domain.Page;

public interface ProviderSearchService {

    Page<ProviderSearchResult> search(ProviderSearchParams params);
}
