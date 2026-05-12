package com.example.backend.service.impl;

import com.example.backend.common.exception.*;
import com.example.backend.domain.token.RefreshToken;
import com.example.backend.domain.token.TokenType;
import com.example.backend.domain.token.VerificationToken;
import com.example.backend.domain.user.User;
import com.example.backend.domain.user.UserStatus;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.VerificationTokenRepository;
import com.example.backend.security.JwtTokenProvider;
import com.example.backend.security.UserPrincipal;
import com.example.backend.service.AuthService;
import com.example.backend.service.EmailService;
import com.example.backend.service.TwoFactorService;
import com.example.backend.web.dto.request.*;
import com.example.backend.web.dto.response.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final TwoFactorService twoFactorService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.jwt.refresh-token-expiration-days}")
    private int refreshTokenExpirationDays;

    @Value("${app.token.email-confirmation-expiration-hours:24}")
    private int emailConfirmationExpirationHours;

    @Value("${app.token.password-reset-expiration-hours:2}")
    private int passwordResetExpirationHours;

    @Value("${app.name:App}")
    private String appName;

    @Override
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new EmailAlreadyExistsException("Email is already registered.");
        }

        User user = User.builder()
            .email(request.getEmail().toLowerCase())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .build();

        userRepository.save(user);

        String token = generateAndSaveVerificationToken(user, TokenType.EMAIL_CONFIRMATION, emailConfirmationExpirationHours);
        String confirmationUrl = frontendUrl + "/auth/confirm-email?token=" + token;
        emailService.sendEmailConfirmation(user.getEmail(), user.getFirstName(), confirmationUrl);

        log.info("Registered new user: {}", user.getEmail());
        return new MessageResponse("Registration successful. Please check your email to verify your account.");
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

        if (!user.isEmailVerified()) {
            throw new ApiException("Please verify your email address before logging in.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException("Account is not active. Status: " + user.getStatus());
        }

        if (user.isTwoFactorEnabled()) {
            String tempToken = jwtTokenProvider.generateTempToken(user.getEmail());
            return AuthResponse.builder()
                .requiresTwoFactor(true)
                .tempToken(tempToken)
                .build();
        }

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request) {
        String email = jwtTokenProvider.extractEmailFromTempToken(request.getTempToken());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new ApiException("Invalid two-factor authentication code.");
        }

        return buildAuthResponse(user);
    }

    @Override
    public MessageResponse confirmEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository
            .findByTokenAndTokenType(token, TokenType.EMAIL_CONFIRMATION)
            .orElseThrow(() -> new InvalidTokenException("Invalid or expired email confirmation token."));

        validateToken(verificationToken);

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);

        log.info("Email confirmed for: {}", user.getEmail());
        return new MessageResponse("Email verified successfully. You can now log in.");
    }

    @Override
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            verificationTokenRepository.deleteAllByUserAndTokenType(user, TokenType.PASSWORD_RESET);
            String token = generateAndSaveVerificationToken(user, TokenType.PASSWORD_RESET, passwordResetExpirationHours);
            String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;
            emailService.sendPasswordReset(user.getEmail(), user.getFirstName(), resetUrl);
            log.info("Password reset requested for: {}", user.getEmail());
        });
        // Always return the same message to prevent email enumeration
        return new MessageResponse("If an account with that email exists, a password reset link has been sent.");
    }

    @Override
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        VerificationToken verificationToken = verificationTokenRepository
            .findByTokenAndTokenType(request.getToken(), TokenType.PASSWORD_RESET)
            .orElseThrow(() -> new InvalidTokenException("Invalid or expired password reset token."));

        validateToken(verificationToken);

        User user = verificationToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);

        refreshTokenRepository.revokeAllByUser(user);

        log.info("Password reset for: {}", user.getEmail());
        return new MessageResponse("Password reset successfully. Please log in with your new password.");
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new InvalidTokenException("Invalid refresh token."));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token has expired or been revoked.");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(refreshToken.getUser());
    }

    @Override
    public MessageResponse logout(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
        });
        return new MessageResponse("Logged out successfully.");
    }

    @Override
    public TwoFactorSetupResponse setupTwoFactor(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.isTwoFactorEnabled()) {
            throw new ApiException("Two-factor authentication is already enabled.");
        }

        String secret = twoFactorService.generateSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String qrCodeUri = twoFactorService.getQrCodeUri(secret, user.getEmail(), appName);
        return new TwoFactorSetupResponse(secret, qrCodeUri);
    }

    @Override
    public MessageResponse enableTwoFactor(EnableTwoFactorRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getTwoFactorSecret() == null) {
            throw new ApiException("Please initiate two-factor setup first.");
        }

        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new ApiException("Invalid verification code.");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        log.info("2FA enabled for: {}", userEmail);
        return new MessageResponse("Two-factor authentication enabled successfully.");
    }

    @Override
    public MessageResponse disableTwoFactor(TwoFactorVerifyRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!user.isTwoFactorEnabled()) {
            throw new ApiException("Two-factor authentication is not enabled.");
        }

        if (!twoFactorService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new ApiException("Invalid verification code.");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        log.info("2FA disabled for: {}", userEmail);
        return new MessageResponse("Two-factor authentication disabled successfully.");
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshTokenValue = createRefreshToken(user);
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshTokenValue)
            .tokenType("Bearer")
            .requiresTwoFactor(false)
            .build();
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.revokeAllByUser(user);
        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
            .token(tokenValue)
            .user(user)
            .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays))
            .build();
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }

    private String generateAndSaveVerificationToken(User user, TokenType tokenType, int expirationHours) {
        String tokenValue = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
            .token(tokenValue)
            .tokenType(tokenType)
            .user(user)
            .expiresAt(LocalDateTime.now().plusHours(expirationHours))
            .build();
        verificationTokenRepository.save(verificationToken);
        return tokenValue;
    }

    private void validateToken(VerificationToken token) {
        if (token.isUsed()) {
            throw new InvalidTokenException("Token has already been used.");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Token has expired.");
        }
    }
}
