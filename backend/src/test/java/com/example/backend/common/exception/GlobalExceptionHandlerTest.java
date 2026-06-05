package com.example.backend.common.exception;

import com.example.backend.common.response.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void apiExceptionShouldReturn400() {
        ResponseEntity<ErrorResponse> resp = handler.handleApiException(new ApiException("bad request"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertEquals(400, resp.getBody().getStatus());
        assertEquals("bad request", resp.getBody().getMessage());
        assertNotNull(resp.getBody().getTimestamp());
    }

    @Test
    void emailAlreadyExistsShouldReturn409() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleEmailAlreadyExists(new EmailAlreadyExistsException("Email taken"));
        assertEquals(HttpStatus.CONFLICT, resp.getStatusCode());
        assertEquals(409, resp.getBody().getStatus());
        assertEquals("Email taken", resp.getBody().getMessage());
    }

    @Test
    void resourceNotFoundShouldReturn404() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleResourceNotFound(new ResourceNotFoundException("Not found"));
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
        assertEquals(404, resp.getBody().getStatus());
        assertEquals("Not found", resp.getBody().getMessage());
    }

    @Test
    void invalidTokenShouldReturn400() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleInvalidToken(new InvalidTokenException("Bad token"));
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
        assertEquals(400, resp.getBody().getStatus());
        assertEquals("Bad token", resp.getBody().getMessage());
    }

    @Test
    void badCredentialsShouldReturn401() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleBadCredentials(new BadCredentialsException("wrong"));
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        assertEquals(401, resp.getBody().getStatus());
        assertEquals("Invalid email or password.", resp.getBody().getMessage());
    }

    @Test
    void disabledAccountShouldReturn403() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleDisabled(new DisabledException("disabled"));
        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
        assertEquals("Account is disabled.", resp.getBody().getMessage());
    }

    @Test
    void lockedAccountShouldReturn403WithSuspendedMessage() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleLocked(new LockedException("locked"));
        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
        assertTrue(resp.getBody().getMessage().contains("suspended"));
    }

    @Test
    void unexpectedExceptionShouldReturn500() {
        ResponseEntity<ErrorResponse> resp =
            handler.handleUnexpected(new RuntimeException("oops"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, resp.getStatusCode());
        assertEquals(500, resp.getBody().getStatus());
        assertEquals("An unexpected error occurred.", resp.getBody().getMessage());
    }

    @Test
    void errorResponseTimestampShouldNotBeNull() {
        ResponseEntity<ErrorResponse> resp = handler.handleApiException(new ApiException("x"));
        assertNotNull(resp.getBody().getTimestamp());
    }
}
