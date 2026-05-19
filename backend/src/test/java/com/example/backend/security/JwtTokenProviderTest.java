package com.example.backend.security;

import com.example.backend.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        // generate a 32-byte secret and set as base64
        byte[] key = new byte[32];
        for (int i = 0; i < key.length; i++) key[i] = (byte) (i + 1);
        String b64 = Base64.getEncoder().encodeToString(key);
        ReflectionTestUtils.setField(provider, "jwtSecret", b64);
        ReflectionTestUtils.setField(provider, "accessTokenExpirationMs", 60_000L);
        ReflectionTestUtils.setField(provider, "tempTokenExpirationMs", 60_000L);
    }

    @Test
    void generateAccessToken_and_extractEmail_shouldWork() {
        String email = "user@example.com";
        String token = provider.generateAccessToken(email, UserRole.CUSTOMER);
        assertNotNull(token);
        assertEquals(email, provider.extractEmail(token));
        assertTrue(provider.isTokenValid(token));
        assertEquals(UserRole.CUSTOMER.name(), provider.extractRole(token));
    }

    @Test
    void generateTempToken_and_extractEmailFromTempToken_shouldWork() {
        String email = "user2@example.com";
        String token = provider.generateTempToken(email);
        assertNotNull(token);
        assertEquals(email, provider.extractEmailFromTempToken(token));
        // isTokenValid only returns true for access tokens, temp tokens are not considered valid access tokens
        assertFalse(provider.isTokenValid(token));
    }

    @Test
    void tamperedToken_isInvalid() {
        String email = "user3@example.com";
        String token = provider.generateAccessToken(email, UserRole.CUSTOMER);
        // tamper
        String tampered = token + "x";
        assertFalse(provider.isTokenValid(tampered));
    }

    @Test
    void extractTempFromAccess_throws() {
        String email = "user4@example.com";
        String token = provider.generateAccessToken(email, UserRole.CUSTOMER);
        assertThrows(io.jsonwebtoken.JwtException.class, () -> provider.extractEmailFromTempToken(token));
    }
}


