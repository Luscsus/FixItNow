package com.example.backend.web.controller;

import com.example.backend.service.AuthService;
import com.example.backend.web.dto.request.LoginRequest;
import com.example.backend.web.dto.request.RegisterRequest;
import com.example.backend.web.dto.response.AuthResponse;
import com.example.backend.web.dto.response.MessageResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@org.junit.jupiter.api.extension.ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
public class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @org.mockito.Mock
    private AuthService authService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        AuthController controller = new AuthController(authService);
        mockMvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(controller).build();
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("POST /register returns 201 and message")
    void registerEndpointSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("a@b.com");
        req.setFirstName("A");
        req.setLastName("B");
        req.setPassword("pass1234");

        when(authService.register(any())).thenReturn(new MessageResponse("Registration successful. Please check your email to verify your account."));

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.message").value("Registration successful. Please check your email to verify your account."));

        verify(authService).register(any());
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("POST /login returns tokens")
    void loginEndpointSuccess() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("a@b.com");
        req.setPassword("pass1234");

        AuthResponse resp = AuthResponse.builder()
            .accessToken("access-token")
            .refreshToken("refresh-token")
            .tokenType("Bearer")
            .requiresTwoFactor(false)
            .build();

        when(authService.login(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.requiresTwoFactor").value(false));

        verify(authService).login(any());
    }

}









