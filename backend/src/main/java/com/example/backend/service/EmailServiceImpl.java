package com.example.backend.service;

import com.example.backend.service.EmailService;
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
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Confirm your email — FixItNow</title>
            </head>
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- Header -->
                    <tr>
                      <td style="background:#0B1E3F;border-radius:12px 12px 0 0;padding:28px 36px;text-align:left;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#F59E0B;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                              <div style="width:14px;height:14px;border:1.6px solid #0B1E3F;border-radius:3px;margin:auto;margin-top:2px;position:relative;"></div>
                            </td>
                            <td style="padding-left:10px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                              FixIt<span style="color:#F59E0B;">Now</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="background:#ffffff;padding:40px 36px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#64748B;text-transform:uppercase;">Email confirmation</p>
                        <h1 style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;line-height:1.2;">
                          Confirm your<br/>email address
                        </h1>
                        <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">Hi %s,</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.6;">
                          You're almost there! Click the button below to confirm your email address and activate your FixItNow account.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#142C5E;border-radius:10px;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                                Confirm email address →
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 6px;font-size:13px;color:#64748B;line-height:1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin:0 0 28px;font-size:12px;color:#94A3B8;word-break:break-all;font-family:'SF Mono',Menlo,monospace;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px;">
                          %s
                        </p>
                        <table cellpadding="0" cellspacing="0" width="100%%" style="border-top:1px solid #F1F5F9;padding-top:24px;margin-top:4px;">
                          <tr>
                            <td style="font-size:13px;color:#94A3B8;line-height:1.6;">
                              This link expires in <strong style="color:#64748B;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                          © 2026 FixItNow · Your maintenance marketplace
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, confirmationUrl, confirmationUrl);
    }

    private String buildPasswordResetHtml(String firstName, String resetUrl) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Reset your password — FixItNow</title>
            </head>
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- Header -->
                    <tr>
                      <td style="background:#0B1E3F;border-radius:12px 12px 0 0;padding:28px 36px;text-align:left;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#F59E0B;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                              <div style="width:14px;height:14px;border:1.6px solid #0B1E3F;border-radius:3px;margin:auto;margin-top:2px;position:relative;"></div>
                            </td>
                            <td style="padding-left:10px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                              FixIt<span style="color:#F59E0B;">Now</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="background:#ffffff;padding:40px 36px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#64748B;text-transform:uppercase;">Password reset</p>
                        <h1 style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;line-height:1.2;">
                          Reset your<br/>password
                        </h1>
                        <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">Hi %s,</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.6;">
                          We received a request to reset your password. Click the button below to choose a new one. This link is valid for 2 hours.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                          <tr>
                            <td style="background:#142C5E;border-radius:10px;">
                              <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                                Reset password →
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 6px;font-size:13px;color:#64748B;line-height:1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin:0 0 28px;font-size:12px;color:#94A3B8;word-break:break-all;font-family:'SF Mono',Menlo,monospace;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:10px 12px;">
                          %s
                        </p>
                        <table cellpadding="0" cellspacing="0" width="100%%" style="border-top:1px solid #F1F5F9;padding-top:24px;margin-top:4px;">
                          <tr>
                            <td style="font-size:13px;color:#94A3B8;line-height:1.6;">
                              This link expires in <strong style="color:#64748B;">2 hours</strong>. If you didn't request a password reset, you can safely ignore this email — your account remains secure.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                          © 2026 FixItNow · Your maintenance marketplace
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName, resetUrl, resetUrl);
    }
}
