package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.review.Review;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.Provider;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.web.dto.request.CreateReviewRequest;
import com.example.backend.web.dto.response.ProviderRatingStats;
import com.example.backend.web.dto.response.ReviewResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private ProviderRepository providerRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    // ── helpers ──────────────────────────────────────────────────────────────

    private Provider provider() {
        Provider p = new Provider();
        p.setId(UUID.randomUUID());
        p.setEmail("provider@test.com");
        p.setFirstName("Ana");
        p.setLastName("Kovač");
        p.setPassword("encoded");
        p.setRole(UserRole.PROVIDER);
        p.setStatus(UserStatus.ACTIVE);
        return p;
    }

    private User reviewer() {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("reviewer@test.com");
        u.setFirstName("Janez");
        u.setLastName("Novak");
        u.setPassword("encoded");
        u.setRole(UserRole.CUSTOMER);
        u.setStatus(UserStatus.ACTIVE);
        return u;
    }

    private CreateReviewRequest reviewRequest(int rating) {
        CreateReviewRequest r = new CreateReviewRequest();
        r.setRating(rating);
        r.setComment("Great service!");
        return r;
    }

    // ── upsertReview ─────────────────────────────────────────────────────────

    @Test
    void upsertReviewShouldThrowWhenReviewingSelf() {
        UUID id = UUID.randomUUID();
        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(id, id, reviewRequest(5)));
    }

    @Test
    void upsertReviewShouldThrowForRatingBelowOne() {
        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(UUID.randomUUID(), UUID.randomUUID(), reviewRequest(0)));
    }

    @Test
    void upsertReviewShouldThrowForRatingAboveFive() {
        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(UUID.randomUUID(), UUID.randomUUID(), reviewRequest(6)));
    }

    @Test
    void upsertReviewShouldThrowWhenProviderNotFound() {
        UUID reviewerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        when(providerRepository.findById(providerId)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
            () -> reviewService.upsertReview(reviewerId, providerId, reviewRequest(5)));
    }

    @Test
    void upsertReviewShouldThrowWhenNoCompletedTicket() {
        User reviewer = reviewer();
        Provider prov = provider();
        when(providerRepository.findById(prov.getId())).thenReturn(Optional.of(prov));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewer.getId(), prov.getId(), TicketStatus.COMPLETED)).thenReturn(false);

        assertThrows(ApiException.class,
            () -> reviewService.upsertReview(reviewer.getId(), prov.getId(), reviewRequest(4)));
    }

    @Test
    void upsertReviewShouldCreateNewReview() {
        User reviewer = reviewer();
        Provider prov = provider();
        CreateReviewRequest req = reviewRequest(5);

        when(providerRepository.findById(prov.getId())).thenReturn(Optional.of(prov));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewer.getId(), prov.getId(), TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewer.getId(), prov.getId()))
            .thenReturn(Optional.empty());
        when(userRepository.findById(reviewer.getId())).thenReturn(Optional.of(reviewer));

        Review savedReview = Review.builder()
            .id(UUID.randomUUID())
            .reviewer(reviewer)
            .provider(prov)
            .rating(5)
            .comment("Great service!")
            .build();
        when(reviewRepository.save(any())).thenReturn(savedReview);
        doNothing().when(notificationService).notifyReviewReceived(any(), any(), any(), any(), any(), any());

        ReviewResponse resp = reviewService.upsertReview(reviewer.getId(), prov.getId(), req);

        assertNotNull(resp);
        assertEquals(5, resp.getRating());
        verify(notificationService).notifyReviewReceived(any(), any(), any(), any(), any(), any());
    }

    @Test
    void upsertReviewShouldUpdateExistingReview() {
        User reviewer = reviewer();
        Provider prov = provider();

        Review existing = Review.builder()
            .id(UUID.randomUUID())
            .reviewer(reviewer)
            .provider(prov)
            .rating(3)
            .comment("OK")
            .build();

        when(providerRepository.findById(prov.getId())).thenReturn(Optional.of(prov));
        when(ticketRepository.existsByUser_IdAndAssignedServiceProvider_IdAndStatus(
            reviewer.getId(), prov.getId(), TicketStatus.COMPLETED)).thenReturn(true);
        when(reviewRepository.findByReviewerIdAndProviderId(reviewer.getId(), prov.getId()))
            .thenReturn(Optional.of(existing));
        when(reviewRepository.save(any())).thenReturn(existing);

        reviewService.upsertReview(reviewer.getId(), prov.getId(), reviewRequest(5));

        assertEquals(5, existing.getRating());
        // No notification for an edit
        verify(notificationService, never()).notifyReviewReceived(any(), any(), any(), any(), any(), any());
    }

    // ── listForProvider ──────────────────────────────────────────────────────

    @Test
    void listForProviderShouldReturnMappedList() {
        UUID providerId = UUID.randomUUID();
        User reviewer = reviewer();
        Provider prov = provider();
        Review r = Review.builder()
            .id(UUID.randomUUID())
            .reviewer(reviewer)
            .provider(prov)
            .rating(4)
            .comment("Good")
            .build();
        when(reviewRepository.findAllByProviderIdOrderByCreatedAtDesc(providerId)).thenReturn(List.of(r));

        List<ReviewResponse> result = reviewService.listForProvider(providerId);
        assertEquals(1, result.size());
    }

    // ── getStats ─────────────────────────────────────────────────────────────

    @Test
    void getStatsShouldReturnAverageWhenReviewsExist() {
        UUID providerId = UUID.randomUUID();
        when(reviewRepository.countByProviderId(providerId)).thenReturn(3L);
        when(reviewRepository.averageRatingByProviderId(providerId)).thenReturn(4.33);

        ProviderRatingStats stats = reviewService.getStats(providerId);
        assertEquals(3L, stats.getReviewCount());
        assertEquals(4.33, stats.getAverageRating());
    }

    @Test
    void getStatsShouldReturnNullAverageWhenNoReviews() {
        UUID providerId = UUID.randomUUID();
        when(reviewRepository.countByProviderId(providerId)).thenReturn(0L);

        ProviderRatingStats stats = reviewService.getStats(providerId);
        assertEquals(0L, stats.getReviewCount());
        assertNull(stats.getAverageRating());
    }

    // ── deleteOwnReview ──────────────────────────────────────────────────────

    @Test
    void deleteOwnReviewShouldDeleteWhenFound() {
        UUID reviewerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        Review r = Review.builder().id(UUID.randomUUID()).rating(3).build();
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.of(r));

        reviewService.deleteOwnReview(reviewerId, providerId);
        verify(reviewRepository).delete(r);
    }

    @Test
    void deleteOwnReviewShouldSilentlySkipWhenNotFound() {
        UUID reviewerId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        when(reviewRepository.findByReviewerIdAndProviderId(reviewerId, providerId))
            .thenReturn(Optional.empty());

        assertDoesNotThrow(() -> reviewService.deleteOwnReview(reviewerId, providerId));
        verify(reviewRepository, never()).delete(any());
    }
}
