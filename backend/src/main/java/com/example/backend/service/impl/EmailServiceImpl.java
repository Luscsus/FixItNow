package com.example.backend.service.impl;

import com.example.backend.service.EmailService;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final SendGrid sendGrid;

    @Value("${app.email.from-address}")
    private String fromAddress;

    @Value("${app.email.from-name}")
    private String fromName;

    @Override
    @Async
    public void sendEmailConfirmation(String to, String firstName, String confirmationUrl) {
        String subject = "Confirm your email address";
        String body = buildEmailConfirmationHtml(firstName, confirmationUrl);
        sendEmail(to, subject, body);
    }

    @Override
    @Async
    public void sendPasswordReset(String to, String firstName, String resetUrl) {
        String subject = "Reset your password";
        String body = buildPasswordResetHtml(firstName, resetUrl);
        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        Email from = new Email(fromAddress, fromName);
        Email recipient = new Email(to);
        Content content = new Content("text/html", htmlBody);
        Mail mail = new Mail(from, subject, recipient, content);

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);
            log.info("Email sent to {}. Status: {}", to, response.getStatusCode());
        } catch (IOException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildEmailConfirmationHtml(String firstName, String confirmationUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Confirm your email address</h2>
                <p>Hi %s,</p>
                <p>Please confirm your email address by clicking the button below:</p>
                <a href="%s" style="background-color: #4CAF50; color: white; padding: 14px 20px;
                   text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
                    Confirm Email
                </a>
                <p>This link expires in 24 hours.</p>
                <p>If you didn't create an account, please ignore this email.</p>
            </body>
            </html>
            """.formatted(firstName, confirmationUrl);
    }

    private String buildPasswordResetHtml(String firstName, String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Reset your password</h2>
                <p>Hi %s,</p>
                <p>You requested a password reset. Click the button below to proceed:</p>
                <a href="%s" style="background-color: #008CBA; color: white; padding: 14px 20px;
                   text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
                    Reset Password
                </a>
                <p>This link expires in 2 hours.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
            </body>
            </html>
            """.formatted(firstName, resetUrl);
    }
}
