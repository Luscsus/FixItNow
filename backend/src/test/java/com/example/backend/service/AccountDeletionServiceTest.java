package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.TicketRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AccountDeletionService accountDeletionService;

    private User activeCustomer() {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("customer@test.com");
        u.setPassword("encoded");
        u.setFirstName("Janez");
        u.setLastName("Novak");
        u.setRole(UserRole.CUSTOMER);
        u.setStatus(UserStatus.ACTIVE);
        u.setDeleted(false);
        return u;
    }

    private User activeProvider() {
        // Use User object with PROVIDER role to avoid JPA join-table issues in unit tests
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("provider@test.com");
        u.setPassword("encoded");
        u.setFirstName("Ana");
        u.setLastName("Kovač");
        u.setRole(UserRole.PROVIDER);
        u.setStatus(UserStatus.ACTIVE);
        u.setDeleted(false);
        return u;
    }

    @Test
    void deleteOwnAccountShouldThrowWhenUserNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> accountDeletionService.deleteOwnAccount(id));
    }

    @Test
    void deleteOwnAccountShouldThrowWhenAlreadyDeleted() {
        User user = activeCustomer();
        user.setDeleted(true);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class, () -> accountDeletionService.deleteOwnAccount(user.getId()));
    }

    @Test
    void deleteOwnAccountShouldThrowWhenAlreadyDeletedByStatus() {
        User user = activeCustomer();
        user.setStatus(UserStatus.DELETED);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class, () -> accountDeletionService.deleteOwnAccount(user.getId()));
    }

    @Test
    void deleteOwnAccountShouldThrowForCustomerWithActiveTickets() {
        User user = activeCustomer();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(ticketRepository.countByUser_IdAndStatusIn(eq(user.getId()), any())).thenReturn(1L);

        ApiException ex = assertThrows(ApiException.class,
            () -> accountDeletionService.deleteOwnAccount(user.getId()));
        assertTrue(ex.getMessage().contains("active tickets"));
    }

    @Test
    void deleteOwnAccountShouldThrowForProviderWithActiveJobs() {
        User user = activeProvider();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(ticketRepository.countByAssignedServiceProvider_IdAndStatusIn(eq(user.getId()), any())).thenReturn(2L);

        ApiException ex = assertThrows(ApiException.class,
            () -> accountDeletionService.deleteOwnAccount(user.getId()));
        assertTrue(ex.getMessage().contains("active jobs"));
    }

    @Test
    void deleteOwnAccountShouldSoftDeleteCustomerWithNoActiveTickets() {
        User user = activeCustomer();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(ticketRepository.countByUser_IdAndStatusIn(eq(user.getId()), any())).thenReturn(0L);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        accountDeletionService.deleteOwnAccount(user.getId());

        assertTrue(user.isDeleted());
        assertEquals(UserStatus.DELETED, user.getStatus());
        assertNotNull(user.getDeletedAt());
        assertEquals(user.getId(), user.getDeletedBy());
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    void deleteOwnAccountShouldSoftDeleteProviderWithNoActiveJobs() {
        User user = activeProvider();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(ticketRepository.countByAssignedServiceProvider_IdAndStatusIn(eq(user.getId()), any())).thenReturn(0L);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        accountDeletionService.deleteOwnAccount(user.getId());

        assertTrue(user.isDeleted());
        assertEquals(UserStatus.DELETED, user.getStatus());
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    void deleteOwnAccountShouldPreserveExistingDeletionReason() {
        User user = activeCustomer();
        user.setDeletionReason("My reason");
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(ticketRepository.countByUser_IdAndStatusIn(eq(user.getId()), any())).thenReturn(0L);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        accountDeletionService.deleteOwnAccount(user.getId());

        // Existing reason should not be overwritten
        assertEquals("My reason", user.getDeletionReason());
    }
}
