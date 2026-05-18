package com.example.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from-address}")
    private String fromAddress;

    @Value("${app.email.from-name}")
    private String fromName;

    @Override
    @Async
    public void sendEmailConfirmation(String to, String firstName, String confirmationUrl) {
        sendEmail(to, "Confirm your email address", buildEmailConfirmationHtml(firstName, confirmationUrl));
    }

    @Override
    @Async
    public void sendPasswordReset(String to, String firstName, String resetUrl) {
        sendEmail(to, "Reset your password", buildPasswordResetHtml(firstName, resetUrl));
    }

    @Override
    @Async
    public void sendProviderApprovalPending(String to, String firstName) {
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Your provider application is under review</h2>
                <p>Hi %s,</p>
                <p>Thank you for applying to become a service provider. Your application has been
                submitted and is now <strong>pending approval</strong> by an administrator.</p>
                <p>You will receive another email once your application has been reviewed.</p>
                <p>You will not be able to log in until your application is approved.</p>
            </body></html>
            """.formatted(escape(firstName));
        sendEmail(to, "Provider application received — pending approval", body);
    }

    @Override
    @Async
    public void sendAdminNewProviderApprovalRequest(String to, String adminFirstName, String providerEmail, String providerFullName) {
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>New provider approval request</h2>
                <p>Hi %s,</p>
                <p>A new service provider has registered and is awaiting your approval:</p>
                <ul>
                    <li><strong>Name:</strong> %s</li>
                    <li><strong>Email:</strong> %s</li>
                </ul>
                <p>Please log in to the admin dashboard to review the application.</p>
            </body></html>
            """.formatted(escape(adminFirstName), escape(providerFullName), escape(providerEmail));
        sendEmail(to, "New provider approval request", body);
    }

    @Override
    @Async
    public void sendProviderApproved(String to, String firstName) {
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Your provider account has been approved</h2>
                <p>Hi %s,</p>
                <p>Great news — your provider application has been <strong>approved</strong>.
                You can now log in and start receiving service requests.</p>
            </body></html>
            """.formatted(escape(firstName));
        sendEmail(to, "Provider application approved", body);
    }

    @Override
    @Async
    public void sendProviderDeclined(String to, String firstName, String reason) {
        String body = """
            <!DOCTYPE html>
            <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Your provider application was declined</h2>
                <p>Hi %s,</p>
                <p>Unfortunately, your provider application has been <strong>declined</strong>.</p>
                <p><strong>Reason:</strong> %s</p>
                <p>If you believe this is a mistake or would like to provide additional information,
                please contact support.</p>
            </body></html>
            """.formatted(escape(firstName), escape(reason));
        sendEmail(to, "Provider application declined", body);
    }

    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
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
            """.formatted(escape(firstName), confirmationUrl);
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
            """.formatted(escape(firstName), resetUrl);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }
}
