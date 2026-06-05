package com.example.backend.service.impl;

import com.example.backend.service.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender);
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@example.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Backend App");
    }

    @Test
    void sendEmailConfirmation_shouldBuildAndSendConfirmationEmail() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendEmailConfirmation(
                "john@example.com",
                "John",
                "http://localhost:3000/confirm-email?token=abc123"
        );

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        MimeMessage sentMessage = messageCaptor.getValue();
        assertNotNull(sentMessage);
        assertEquals("Confirm your email address", sentMessage.getSubject());

        InternetAddress from = (InternetAddress) sentMessage.getFrom()[0];
        assertEquals("noreply@example.com", from.getAddress());
        assertEquals("Backend App", from.getPersonal());

        assertEquals("john@example.com", ((InternetAddress) sentMessage.getAllRecipients()[0]).getAddress());

        String content = (String) sentMessage.getContent();
        assertTrue(content.contains("Hi John,"));
        assertTrue(content.contains("http://localhost:3000/confirm-email?token=abc123"));
        assertTrue(content.contains("Confirm email address"));
        verify(mailSender).createMimeMessage();
    }

    @Test
    void sendPasswordReset_shouldBuildAndSendResetEmail() throws Exception {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendPasswordReset(
                "mary@example.com",
                "Mary",
                "http://localhost:3000/reset-password?token=xyz789"
        );

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        MimeMessage sentMessage = messageCaptor.getValue();
        assertNotNull(sentMessage);
        assertEquals("Reset your password", sentMessage.getSubject());

        InternetAddress from = (InternetAddress) sentMessage.getFrom()[0];
        assertEquals("noreply@example.com", from.getAddress());
        assertEquals("Backend App", from.getPersonal());

        assertEquals("mary@example.com", ((InternetAddress) sentMessage.getAllRecipients()[0]).getAddress());

        String content = (String) sentMessage.getContent();
        assertTrue(content.contains("Hi Mary,"));
        assertTrue(content.contains("http://localhost:3000/reset-password?token=xyz789"));
        assertTrue(content.contains("Reset password"));
        assertTrue(content.contains("This link expires in"));
        verify(mailSender).createMimeMessage();
    }
}

