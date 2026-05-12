package com.example.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.temp-token-expiration-ms:300000}")
    private long tempTokenExpirationMs;

    private static final String CLAIM_TOKEN_TYPE = "type";
    private static final String TOKEN_TYPE_ACCESS = "access";
    private static final String TOKEN_TYPE_TEMP = "temp";

    public String generateAccessToken(String email) {
        return buildToken(email, TOKEN_TYPE_ACCESS, accessTokenExpirationMs);
    }

    public String generateTempToken(String email) {
        return buildToken(email, TOKEN_TYPE_TEMP, tempTokenExpirationMs);
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractEmailFromTempToken(String token) {
        Claims claims = extractClaims(token);
        if (!TOKEN_TYPE_TEMP.equals(claims.get(CLAIM_TOKEN_TYPE))) {
            throw new JwtException("Invalid token type.");
        }
        return claims.getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return TOKEN_TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE))
                && !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private String buildToken(String email, String tokenType, long expirationMs) {
        return Jwts.builder()
            .subject(email)
            .claim(CLAIM_TOKEN_TYPE, tokenType)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
