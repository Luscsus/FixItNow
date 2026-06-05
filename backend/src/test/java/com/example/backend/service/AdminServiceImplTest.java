package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.domain.user.*;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.web.dto.request.DeclineProviderRequest;
import com.example.backend.web.dto.response.MessageResponse;
import com.example.backend.web.dto.response.ProviderResponse;
import com.example.backend.web.dto.response.UserSummaryResponse;
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
class AdminServiceImplTest {

    @Mock private ProviderRepository providerRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmailService emailService;

    @InjectMocks
    private AdminServiceImpl adminService;

    // ── helpers ──────────────────────────────────────────────────────────────

    private Provider pendingProvider() {
        Provider p = new Provider();
        p.setId(UUID.randomUUID());
        p.setEmail("provider@test.com");
        p.setFirstName("Ana");
        p.setLastName("Kovač");
        p.setPassword("encoded");
        p.setStatus(UserStatus.PENDING_APPROVAL);
        p.setRole(UserRole.PROVIDER);
        return p;
    }

    private User activeUser() {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("user@test.com");
        u.setFirstName("Janez");
        u.setLastName("Novak");
        u.setPassword("encoded");
        u.setStatus(UserStatus.ACTIVE);
        u.setRole(UserRole.CUSTOMER);
        return u;
    }

    // ── listPendingProviders ─────────────────────────────────────────────────

    @Test
    void listPendingProvidersShouldReturnList() {
        when(providerRepository.findAllByStatus(UserStatus.PENDING_APPROVAL))
            .thenReturn(List.of(pendingProvider()));
        List<ProviderResponse> result = adminService.listPendingProviders();
        assertEquals(1, result.size());
    }

    // ── approveProvider ──────────────────────────────────────────────────────

    @Test
    void approveProviderShouldSetActiveAndSendEmail() {
        Provider p = pendingProvider();
        UUID adminId = UUID.randomUUID();
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));
        when(providerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendProviderApproved(anyString(), anyString());

        MessageResponse resp = adminService.approveProvider(p.getId(), adminId);

        assertEquals(UserStatus.ACTIVE, p.getStatus());
        assertTrue(p.isEmailVerified());
        assertNotNull(p.getApprovedAt());
        assertEquals(adminId, p.getApprovedBy());
        assertEquals("Provider approved successfully.", resp.getMessage());
        verify(emailService).sendProviderApproved(p.getEmail(), p.getFirstName());
    }

    @Test
    void approveProviderShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(providerRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> adminService.approveProvider(id, UUID.randomUUID()));
    }

    @Test
    void approveProviderShouldThrowWhenNotPending() {
        Provider p = pendingProvider();
        p.setStatus(UserStatus.ACTIVE);
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));
        assertThrows(ApiException.class, () -> adminService.approveProvider(p.getId(), UUID.randomUUID()));
    }

    // ── declineProvider ──────────────────────────────────────────────────────

    @Test
    void declineProviderShouldSetRejectedAndSendEmail() {
        Provider p = pendingProvider();
        UUID adminId = UUID.randomUUID();
        DeclineProviderRequest req = new DeclineProviderRequest();
        req.setReason("Missing credentials");
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));
        when(providerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendProviderDeclined(anyString(), anyString(), anyString());

        MessageResponse resp = adminService.declineProvider(p.getId(), req, adminId);

        assertEquals(UserStatus.REJECTED, p.getStatus());
        assertEquals("Missing credentials", p.getRejectionReason());
        assertEquals("Provider declined.", resp.getMessage());
        verify(emailService).sendProviderDeclined(p.getEmail(), p.getFirstName(), "Missing credentials");
    }

    @Test
    void declineProviderShouldThrowWhenNotPending() {
        Provider p = pendingProvider();
        p.setStatus(UserStatus.REJECTED);
        when(providerRepository.findById(p.getId())).thenReturn(Optional.of(p));
        assertThrows(ApiException.class,
            () -> adminService.declineProvider(p.getId(), new DeclineProviderRequest(), UUID.randomUUID()));
    }

    // ── suspendUser ──────────────────────────────────────────────────────────

    @Test
    void suspendUserShouldSuspendAndRevokeTokens() {
        User user = activeUser();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        MessageResponse resp = adminService.suspendUser(user.getId());

        assertEquals(UserStatus.SUSPENDED, user.getStatus());
        assertEquals("User suspended.", resp.getMessage());
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    void suspendUserShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> adminService.suspendUser(id));
    }

    // ── reactivateUser ───────────────────────────────────────────────────────

    @Test
    void reactivateUserShouldSetActive() {
        User user = activeUser();
        user.setStatus(UserStatus.SUSPENDED);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse resp = adminService.reactivateUser(user.getId());

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals("User reactivated.", resp.getMessage());
    }

    @Test
    void reactivateUserShouldThrowWhenNotSuspended() {
        User user = activeUser();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class, () -> adminService.reactivateUser(user.getId()));
    }

    // ── deleteUser ───────────────────────────────────────────────────────────

    @Test
    void deleteUserShouldSoftDeleteAndRevokeTokens() {
        User user = activeUser();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        MessageResponse resp = adminService.deleteUser(user.getId());

        assertTrue(user.isDeleted());
        assertEquals(UserStatus.DELETED, user.getStatus());
        assertNotNull(user.getDeletedAt());
        assertEquals("User deleted.", resp.getMessage());
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    // ── restoreUser ──────────────────────────────────────────────────────────

    @Test
    void restoreUserShouldUndeleteAndSetActive() {
        User user = activeUser();
        user.setDeleted(true);
        user.setStatus(UserStatus.DELETED);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MessageResponse resp = adminService.restoreUser(user.getId());

        assertFalse(user.isDeleted());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertNull(user.getDeletedAt());
        assertEquals("User restored.", resp.getMessage());
    }

    @Test
    void restoreUserShouldThrowWhenNotDeleted() {
        User user = activeUser();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class, () -> adminService.restoreUser(user.getId()));
    }

    // ── permanentlyDeleteUser ────────────────────────────────────────────────

    @Test
    void permanentlyDeleteShouldThrowWhenNotSoftDeleted() {
        User user = activeUser();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class, () -> adminService.permanentlyDeleteUser(user.getId()));
    }

    @Test
    void permanentlyDeleteShouldSucceedForSoftDeletedUser() {
        User user = activeUser();
        user.setDeleted(true);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        doNothing().when(userRepository).delete(user);
        doNothing().when(userRepository).flush();

        MessageResponse resp = adminService.permanentlyDeleteUser(user.getId());
        assertEquals("User permanently deleted.", resp.getMessage());
    }

    // ── changeUserRole ───────────────────────────────────────────────────────

    @Test
    void changeUserRoleShouldThrowWhenChangingOwnRole() {
        UUID id = UUID.randomUUID();
        assertThrows(ApiException.class,
            () -> adminService.changeUserRole(id, UserRole.ADMIN, id));
    }

    @Test
    void changeUserRoleShouldThrowForProviderRole() {
        User user = activeUser();
        user.setRole(UserRole.PROVIDER);
        UUID adminId = UUID.randomUUID();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        assertThrows(ApiException.class,
            () -> adminService.changeUserRole(user.getId(), UserRole.ADMIN, adminId));
    }

    @Test
    void changeUserRoleShouldUpdateAndRevokeTokens() {
        User user = activeUser();
        UUID adminId = UUID.randomUUID();
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        MessageResponse resp = adminService.changeUserRole(user.getId(), UserRole.ADMIN, adminId);

        assertEquals(UserRole.ADMIN, user.getRole());
        assertTrue(resp.getMessage().contains("role updated"));
        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    void listAllUsersShouldReturnList() {
        when(userRepository.findAll()).thenReturn(List.of(activeUser()));
        List<UserSummaryResponse> result = adminService.listAllUsers();
        assertEquals(1, result.size());
    }
}
