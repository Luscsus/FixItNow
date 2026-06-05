package com.example.backend.web.controller;

import com.example.backend.domain.user.UserStatus;
import com.example.backend.service.ProviderSearchService;
import com.example.backend.web.dto.request.ProviderSearchParams;
import com.example.backend.web.dto.response.ProviderSearchResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProviderControllerTest {

    @Mock private ProviderSearchService providerSearchService;

    @InjectMocks
    private ProviderController providerController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(providerController).build();
    }

    private ProviderSearchResult buildResult(UUID id) {
        return ProviderSearchResult.builder()
            .id(id)
            .firstName("Ana")
            .lastName("Kovač")
            .status(UserStatus.ACTIVE)
            .build();
    }

    @Test
    void searchShouldReturn200WithResults() throws Exception {
        UUID id = UUID.randomUUID();
        Page<ProviderSearchResult> page = new PageImpl<>(List.of(buildResult(id)), PageRequest.of(0, 10), 1);
        when(providerSearchService.search(any(ProviderSearchParams.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/providers/search"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].firstName").value("Ana"));
    }

    @Test
    void searchShouldReturn200EmptyPage() throws Exception {
        Page<ProviderSearchResult> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(providerSearchService.search(any(ProviderSearchParams.class))).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/providers/search"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isEmpty());
    }

    @Test
    void getPublicProfileShouldReturn200() throws Exception {
        UUID id = UUID.randomUUID();
        when(providerSearchService.getPublicProfile(id)).thenReturn(buildResult(id));

        mockMvc.perform(get("/api/v1/providers/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("Ana"));
    }

    @Test
    void getCategoriesShouldReturn200() throws Exception {
        when(providerSearchService.getActiveCategories()).thenReturn(Set.of());

        mockMvc.perform(get("/api/v1/providers/categories"))
            .andExpect(status().isOk());
    }
}
