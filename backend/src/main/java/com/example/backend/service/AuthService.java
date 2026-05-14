package com.example.backend.service;

import com.example.backend.web.dto.request.*;
import com.example.backend.web.dto.response.*;

public interface AuthService {

    MessageResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request);

    MessageResponse confirmEmail(String token);

    MessageResponse resendEmailConfirmation(ForgotPasswordRequest request);

    MessageResponse forgotPassword(ForgotPasswordRequest request);

    MessageResponse resetPassword(ResetPasswordRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    MessageResponse logout(String refreshToken);

    TwoFactorSetupResponse setupTwoFactor(String userEmail);

    MessageResponse enableTwoFactor(EnableTwoFactorRequest request, String userEmail);

    MessageResponse disableTwoFactor(TwoFactorVerifyRequest request, String userEmail);
}
