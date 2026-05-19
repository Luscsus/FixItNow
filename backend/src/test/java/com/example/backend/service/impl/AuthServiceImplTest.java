package com.example.backend.service.impl;

import com.example.backend.common.exception.EmailAlreadyExistsException;
import com.example.backend.domain.token.VerificationToken;
import com.example.backend.domain.user.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VerificationTokenRepository;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.common.exception.ApiException;
import com.example.backend.service.AuthServiceImpl;
import com.example.backend.service.EmailService;
import com.example.backend.service.TwoFactorService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.example.backend.web.dto.response.AuthResponse;
import com.example.backend.domain.token.RefreshToken;
import com.example.backend.web.dto.request.LoginRequest;
import com.example.backend.web.dto.request.RegisterRequest;
import com.example.backend.web.dto.response.MessageResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl Test Suite")
public class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationTokenRepository verificationTokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    // don't mock JwtTokenProvider (Mockito inline/ByteBuddy has issues with current JVM), use a small stub in tests
    @Mock
    private TwoFactorService twoFactorService;
    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        // Set up string properties via ReflectionTestUtils
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(authService, "emailConfirmationExpirationHours", 24);
        ReflectionTestUtils.setField(authService, "appName", "FixItNow");
        ReflectionTestUtils.setField(authService, "refreshTokenExpirationDays", 7);
    }

    @Test
    @DisplayName("Register Test - User Registration Success")
    void registerUserSuccess() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("janeznovak@gmail.com");
        request.setFirstName("Janez");
        request.setLastName("Novak");
        request.setPassword("geslo123");

        User savedUser = new User();
        savedUser.setEmail("janeznovak@gmail.com");
        savedUser.setFirstName("Janez");
        savedUser.setLastName("Novak");
        savedUser.setPassword("encoded_password");

        // Mock the repository methods
        when(userRepository.existsByEmail(request.getEmail().toLowerCase())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(passwordEncoder.encode("geslo123")).thenReturn("encoded_password");
        when(verificationTokenRepository.save(any(VerificationToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(emailService).sendEmailConfirmation(anyString(), anyString(), anyString());

        // Act
        MessageResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals("Registration successful. Please check your email to verify your account.", response.getMessage());

        // Verify interactions
        verify(userRepository, times(1)).existsByEmail(request.getEmail().toLowerCase());
        verify(userRepository, times(1)).save(any(User.class));
        verify(verificationTokenRepository, times(1)).save(any(VerificationToken.class));
        verify(emailService, times(1)).sendEmailConfirmation(
                eq(request.getEmail().toLowerCase()),
                eq(request.getFirstName()),
                contains("/confirm-email?token=")
        );
    }

    @Test
    @DisplayName("Register Test - User Registration Failure - Email Already Exists")
    void shouldReturnErrorWhenEmailExists() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("janeznovak@gmail.com");
        request.setFirstName("Janez");
        request.setLastName("Novak");
        request.setPassword("geslo123");

        // Mock the repository - email already exists
        when(userRepository.existsByEmail(request.getEmail().toLowerCase())).thenReturn(true);

        // Act & Assert - expect EmailAlreadyExistsException to be thrown
        EmailAlreadyExistsException exception = assertThrows(
                EmailAlreadyExistsException.class,
                () -> authService.register(request),
                "Should throw EmailAlreadyExistsException when email already exists"
        );

        assertEquals("Email is already registered.", exception.getMessage());

        // Verify that only the email check was performed, no save operations
        verify(userRepository, times(1)).existsByEmail(request.getEmail().toLowerCase());
        verify(userRepository, never()).save(any(User.class));
        verify(verificationTokenRepository, never()).save(any(VerificationToken.class));
        verify(emailService, never()).sendEmailConfirmation(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Login test - User Login Success")
    void userLoginSuccess(){
        LoginRequest request = new LoginRequest();
        request.setEmail("janeznovak@gmail.com");
        request.setPassword("geslo123");

        User savedUser = new User();
        savedUser.setEmail("janeznovak@gmail.com");
        savedUser.setPassword("encoded_password");
        savedUser.setEmailVerified(true);
        savedUser.setStatus(com.example.backend.domain.user.UserStatus.ACTIVE);

        // Prepare Authentication and principal
        com.example.backend.security.UserPrincipal principal = new com.example.backend.security.UserPrincipal(savedUser);
        org.springframework.security.core.Authentication authentication = new org.springframework.security.core.Authentication() {
            @Override
            public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
                return principal.getAuthorities();
            }

            @Override
            public Object getCredentials() {
                return principal.getPassword();
            }

            @Override
            public Object getDetails() {
                return null;
            }

            @Override
            public Object getPrincipal() {
                return principal;
            }

            @Override
            public boolean isAuthenticated() {
                return true;
            }

            @Override
            public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {}

            @Override
            public String getName() {
                return principal.getUsername();
            }
        };

        // Provide a simple AuthenticationManager implementation that returns our authentication
        org.springframework.security.authentication.AuthenticationManager authManagerImpl = authentication1 -> authentication;
        ReflectionTestUtils.setField(authService, "authenticationManager", authManagerImpl);

        // use a small JwtTokenProvider stub to avoid Mockito inline mocking issues on newer JDKs
        JwtTokenProvider jwtTokenProviderStub = new JwtTokenProvider() {
            @Override
            public String generateAccessToken(String email, com.example.backend.domain.user.UserRole role) {
                return "access-token";
            }

            @Override
            public String generateTempToken(String email) {
                return "temp-token";
            }
        };

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(savedUser);

        // authenticationManager returns a principal so no need to stub userRepository or passwordEncoder here

        // Inject jwtTokenProvider and refreshToken_repository into service
        ReflectionTestUtils.setField(authService, "jwtTokenProvider", jwtTokenProviderStub);
        ReflectionTestUtils.setField(authService, "refreshTokenRepository", refreshTokenRepository);

        // Act
        AuthResponse resp = authService.login(request);

        // Assert
        assertNotNull(resp);
        assertEquals("access-token", resp.getAccessToken());
        assertNotNull(resp.getRefreshToken());
        assertEquals("Bearer", resp.getTokenType());
        assertFalse(resp.isRequiresTwoFactor());
    }

    @Test
    @DisplayName("Login test - Invalid Password")
    void userLoginInvalidPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("janeznovak@gmail.com");
        request.setPassword("wrongpass");

        // AuthenticationManager that throws BadCredentialsException
        org.springframework.security.authentication.AuthenticationManager authManagerImpl = authentication -> {
            throw new BadCredentialsException("Bad credentials");
        };
        ReflectionTestUtils.setField(authService, "authenticationManager", authManagerImpl);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Login test - Email Not Found")
    void userLoginEmailNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("notfound@example.com");
        request.setPassword("geslo123");

        org.springframework.security.authentication.AuthenticationManager authManagerImpl = authentication -> {
            throw new UsernameNotFoundException("User not found");
        };
        ReflectionTestUtils.setField(authService, "authenticationManager", authManagerImpl);

        assertThrows(UsernameNotFoundException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Two-factor verify - success")
    void twoFactorVerifySuccess() {
        String email = "janeznovak@gmail.com";
        String tempToken = "temp-token-123";

        User user = new User();
        user.setEmail(email);
        user.setTwoFactorSecret("SECRET");

        // stub jwt provider to extract email and generate access token
        JwtTokenProvider jwtTokenProviderStub = new JwtTokenProvider() {
            @Override
            public String extractEmailFromTempToken(String token) {
                return email;
            }

            @Override
            public String generateAccessToken(String e, com.example.backend.domain.user.UserRole role) {
                return "access-token";
            }

            @Override
            public String generateTempToken(String e) {
                return tempToken;
            }
        };

        when(userRepository.findByEmail(email)).thenReturn(java.util.Optional.of(user));
        when(twoFactorService.verifyCode(user.getTwoFactorSecret(), "123456")).thenReturn(true);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(refreshTokenRepository).revokeAllByUser(user);

        ReflectionTestUtils.setField(authService, "jwtTokenProvider", jwtTokenProviderStub);
        ReflectionTestUtils.setField(authService, "refreshTokenRepository", refreshTokenRepository);

        com.example.backend.web.dto.request.TwoFactorVerifyRequest req = new com.example.backend.web.dto.request.TwoFactorVerifyRequest();
        req.setTempToken(tempToken);
        req.setCode("123456");

        AuthResponse resp = authService.verifyTwoFactor(req);

        assertNotNull(resp);
        assertEquals("access-token", resp.getAccessToken());
        assertFalse(resp.isRequiresTwoFactor());
        assertNotNull(resp.getRefreshToken());
    }

    @Test
    @DisplayName("Two-factor verify - failure")
    void twoFactorVerifyFailure() {
        String email = "janeznovak@gmail.com";
        String tempToken = "temp-token-123";

        User user = new User();
        user.setEmail(email);
        user.setTwoFactorSecret("SECRET");

        JwtTokenProvider jwtTokenProviderStub = new JwtTokenProvider() {
            @Override
            public String extractEmailFromTempToken(String token) {
                return email;
            }
        };

        when(userRepository.findByEmail(email)).thenReturn(java.util.Optional.of(user));
        when(twoFactorService.verifyCode(user.getTwoFactorSecret(), "000000")).thenReturn(false);

        ReflectionTestUtils.setField(authService, "jwtTokenProvider", jwtTokenProviderStub);

        com.example.backend.web.dto.request.TwoFactorVerifyRequest req = new com.example.backend.web.dto.request.TwoFactorVerifyRequest();
        req.setTempToken(tempToken);
        req.setCode("000000");

        ApiException ex = assertThrows(ApiException.class, () -> authService.verifyTwoFactor(req));
        assertEquals("Invalid two-factor authentication code.", ex.getMessage());
    }

}
