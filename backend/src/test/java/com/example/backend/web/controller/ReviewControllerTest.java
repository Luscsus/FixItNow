package com.example.backend.web.controller;

import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.ReviewService;
import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    @Mock private ReviewService reviewService;

    @InjectMocks
    private ReviewController reviewController;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private UserPrincipal principal;
    private final UUID providerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
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
    void listReviewsForProviderShouldReturn200() throws Exception {
        ReviewResponse review = ReviewResponse.builder()
            .id(UUID.randomUUID())
            .providerId(providerId)
            .reviewerId(principal.getUser().getId())
            .reviewerName("Janez Novak")
            .rating(5)
            .comment("Great!")
            .build();
        when(reviewService.listForProvider(providerId)).thenReturn(List.of(review));

        mockMvc.perform(get("/api/v1/providers/{providerId}/reviews", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].rating").value(5))
            .andExpect(jsonPath("$[0].reviewerName").value("Janez Novak"));
    }

    @Test
    void getRatingStatsShouldReturn200() throws Exception {
        ProviderRatingStats stats = ProviderRatingStats.builder()
            .providerId(providerId)
            .averageRating(4.5)
            .reviewCount(10)
            .build();
        when(reviewService.getStats(providerId)).thenReturn(stats);

        mockMvc.perform(get("/api/v1/providers/{providerId}/reviews/stats", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reviewCount").value(10))
            .andExpect(jsonPath("$.averageRating").value(4.5));
    }

    @Test
    void createReviewShouldReturn200() throws Exception {
        CreateReviewRequest req = new CreateReviewRequest();
        req.setRating(5);
        req.setComment("Excellent!");

        ReviewResponse response = ReviewResponse.builder()
            .id(UUID.randomUUID())
            .providerId(providerId)
            .rating(5)
            .comment("Excellent!")
            .build();
        when(reviewService.upsertReview(any(), eq(providerId), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/providers/{providerId}/reviews", providerId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.rating").value(5));
    }

    @Test
    void deleteOwnReviewShouldReturn200() throws Exception {
        doNothing().when(reviewService).deleteOwnReview(any(), eq(providerId));

        mockMvc.perform(delete("/api/v1/providers/{providerId}/reviews", providerId))
            .andExpect(status().isOk());
    }

    @Test
    void listReviewsEmptyProviderShouldReturn200WithEmptyArray() throws Exception {
        when(reviewService.listForProvider(providerId)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/providers/{providerId}/reviews", providerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }
}
