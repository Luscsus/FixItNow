package com.example.backend.security;

import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserRole;
import com.example.backend.domain.user.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.*;

class UserPrincipalTest {

    private User buildUser(UserStatus status, UserRole role) {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPassword("encoded");
        user.setStatus(status);
        user.setRole(role);
        return user;
    }

    @Test
    void getUsernameShouldReturnEmail() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER);
        assertEquals("test@example.com", new UserPrincipal(user).getUsername());
    }

    @Test
    void getPasswordShouldReturnUserPassword() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER);
        assertEquals("encoded", new UserPrincipal(user).getPassword());
    }

    @Test
    void activeUserShouldBeEnabled() {
        assertTrue(new UserPrincipal(buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER)).isEnabled());
    }

    @Test
    void deletedUserShouldNotBeEnabled() {
        assertFalse(new UserPrincipal(buildUser(UserStatus.DELETED, UserRole.CUSTOMER)).isEnabled());
    }

    @Test
    void pendingVerificationUserShouldBeEnabled() {
        // Pending-verification users are allowed through so AuthService can give a tailored error
        assertTrue(new UserPrincipal(buildUser(UserStatus.PENDING_VERIFICATION, UserRole.CUSTOMER)).isEnabled());
    }

    @Test
    void suspendedUserShouldNotBeAccountNonLocked() {
        assertFalse(new UserPrincipal(buildUser(UserStatus.SUSPENDED, UserRole.CUSTOMER)).isAccountNonLocked());
    }

    @Test
    void activeUserShouldBeAccountNonLocked() {
        assertTrue(new UserPrincipal(buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER)).isAccountNonLocked());
    }

    @Test
    void accountNonExpiredAlwaysTrue() {
        assertTrue(new UserPrincipal(buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER)).isAccountNonExpired());
    }

    @Test
    void credentialsNonExpiredAlwaysTrue() {
        assertTrue(new UserPrincipal(buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER)).isCredentialsNonExpired());
    }

    @Test
    void authoritiesShouldContainRolePrefix() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.ADMIN);
        Collection<? extends GrantedAuthority> authorities = new UserPrincipal(user).getAuthorities();
        assertEquals(1, authorities.size());
        assertEquals("ROLE_ADMIN", authorities.iterator().next().getAuthority());
    }

    @Test
    void customerRoleShouldMapToRoleCustomer() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER);
        String authority = new UserPrincipal(user).getAuthorities().iterator().next().getAuthority();
        assertEquals("ROLE_CUSTOMER", authority);
    }

    @Test
    void providerRoleShouldMapToRoleProvider() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.PROVIDER);
        String authority = new UserPrincipal(user).getAuthorities().iterator().next().getAuthority();
        assertEquals("ROLE_PROVIDER", authority);
    }

    @Test
    void getUserShouldReturnWrappedUser() {
        User user = buildUser(UserStatus.ACTIVE, UserRole.CUSTOMER);
        assertSame(user, new UserPrincipal(user).getUser());
    }
}
