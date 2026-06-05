package com.example.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TwoFactorServiceImplTest {

    private TwoFactorServiceImpl twoFactorService;

    @BeforeEach
    void setUp() {
        twoFactorService = new TwoFactorServiceImpl();
    }

    @Test
    void generateSecretShouldReturnNonNullSecret() {
        String secret = twoFactorService.generateSecret();
        assertNotNull(secret);
        assertFalse(secret.isBlank());
    }

    @Test
    void generateSecretShouldReturnBase32EncodedString() {
        String secret = twoFactorService.generateSecret();
        // Base32 characters: A-Z, 2-7, padding =
        assertTrue(secret.matches("[A-Z2-7=]+"), "Secret should be Base32 encoded");
    }

    @Test
    void generateSecretShouldReturnUniqueSecrets() {
        String s1 = twoFactorService.generateSecret();
        String s2 = twoFactorService.generateSecret();
        assertNotEquals(s1, s2);
    }

    @Test
    void getQrCodeUriShouldContainOtpAuthScheme() {
        String secret = twoFactorService.generateSecret();
        String uri = twoFactorService.getQrCodeUri(secret, "user@example.com", "FixItNow");
        assertTrue(uri.startsWith("otpauth://totp/"), "URI should use otpauth://totp/ scheme");
    }

    @Test
    void getQrCodeUriShouldContainEmailLabel() {
        String secret = twoFactorService.generateSecret();
        String uri = twoFactorService.getQrCodeUri(secret, "user@example.com", "FixItNow");
        assertTrue(uri.contains("user%40example.com") || uri.contains("user@example.com"),
            "URI should contain the email label");
    }

    @Test
    void getQrCodeUriShouldContainIssuer() {
        String secret = twoFactorService.generateSecret();
        String uri = twoFactorService.getQrCodeUri(secret, "user@example.com", "FixItNow");
        assertTrue(uri.contains("FixItNow"), "URI should contain the issuer");
    }

    @Test
    void getQrCodeUriShouldContainSecret() {
        String secret = twoFactorService.generateSecret();
        String uri = twoFactorService.getQrCodeUri(secret, "user@example.com", "FixItNow");
        assertTrue(uri.contains("secret=" + secret), "URI should contain the secret parameter");
    }

    @Test
    void verifyCodeShouldReturnFalseForInvalidCode() {
        String secret = twoFactorService.generateSecret();
        // "000000" is extremely unlikely to be the current TOTP code
        assertFalse(twoFactorService.verifyCode(secret, "000000"));
    }

    @Test
    void verifyCodeShouldThrowForNullCode() {
        String secret = twoFactorService.generateSecret();
        assertThrows(Exception.class, () -> twoFactorService.verifyCode(secret, null));
    }

    @Test
    void verifyCodeShouldReturnFalseForEmptyCode() {
        String secret = twoFactorService.generateSecret();
        assertFalse(twoFactorService.verifyCode(secret, ""));
    }
}
