package com.example.backend.web.controller;

import com.example.backend.common.exception.GlobalExceptionHandler;
import com.example.backend.domain.user.*;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.SavedProviderRepository;
import com.example.backend.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SavedProviderControllerTest {

    @Mock private SavedProviderRepository savedProviderRepository;
    @Mock private ProviderRepository providerRepository;

    @InjectMocks
    private SavedProviderController savedProviderController;

    private MockMvc mockMvc;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(savedProviderController)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("customer@test.com");
        user.setPassword("encoded");
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        principal = new UserPrincipal(user);

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listShouldReturn200WithEmptyListWhenNoneSaved() throws Exception {
        when(savedProviderRepository.findAllByIdUserIdOrderByCreatedAtDesc(principal.getUser().getId()))
            .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/saved-providers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void saveShouldReturn200WhenProviderExists() throws Exception {
        UUID providerId = UUID.randomUUID();
        when(providerRepository.existsById(providerId)).thenReturn(true);
        when(savedProviderRepository.existsByIdUserIdAndIdProviderId(principal.getUser().getId(), providerId))
            .thenReturn(false);
        when(savedProviderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/api/v1/saved-providers/{providerId}", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Saved"));
    }

    @Test
    void saveShouldReturn200WhenAlreadySaved() throws Exception {
        UUID providerId = UUID.randomUUID();
        when(providerRepository.existsById(providerId)).thenReturn(true);
        when(savedProviderRepository.existsByIdUserIdAndIdProviderId(principal.getUser().getId(), providerId))
            .thenReturn(true);

        mockMvc.perform(post("/api/v1/saved-providers/{providerId}", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Saved"));
        verify(savedProviderRepository, never()).save(any());
    }

    @Test
    void saveShouldReturn404WhenProviderNotFound() throws Exception {
        UUID providerId = UUID.randomUUID();
        when(providerRepository.existsById(providerId)).thenReturn(false);

        mockMvc.perform(post("/api/v1/saved-providers/{providerId}", providerId))
            .andExpect(status().isNotFound());
    }

    @Test
    void saveShouldReturn400WhenSavingSelf() throws Exception {
        UUID selfId = principal.getUser().getId();

        mockMvc.perform(post("/api/v1/saved-providers/{providerId}", selfId))
            .andExpect(status().isBadRequest());
    }

    @Test
    void unsaveShouldReturn200() throws Exception {
        UUID providerId = UUID.randomUUID();
        doNothing().when(savedProviderRepository).deleteByIdUserIdAndIdProviderId(principal.getUser().getId(), providerId);

        mockMvc.perform(delete("/api/v1/saved-providers/{providerId}", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Unsaved"));
    }
}
