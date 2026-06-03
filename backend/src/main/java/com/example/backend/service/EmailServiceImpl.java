package com.example.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.util.ByteArrayDataSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

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

    @Override
    @Async
    public void sendInvoiceEmail(String to, String customerFirstName, String ticketCode,
                                 String serviceType, String providerName, BigDecimal amount,
                                 byte[] pdfBytes) {
        String subject = "Your invoice for " + ticketCode + " — FixItNow";
        String html = buildInvoiceEmailHtml(customerFirstName, ticketCode, serviceType, providerName, amount);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.addAttachment("Invoice-" + ticketCode + ".pdf",
                    new ByteArrayDataSource(pdfBytes, "application/pdf"));
            mailSender.send(message);
            log.info("Invoice email sent to {} for ticket {}", to, ticketCode);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send invoice email to {}: {}", to, e.getMessage());
        }
    }

    private String buildInvoiceEmailHtml(String customerFirstName, String ticketCode,
                                         String serviceType, String providerName, BigDecimal amount) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"/><title>Invoice — FixItNow</title></head>
            <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    <tr>
                      <td style="background:#0B1E3F;border-radius:12px 12px 0 0;padding:28px 36px;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="background:#F59E0B;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                            <span style="font-size:16px;">🔧</span>
                          </td>
                          <td style="padding-left:10px;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px;">
                            FixIt<span style="color:#F59E0B;">Now</span>
                          </td>
                          <td style="padding-left:180px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);letter-spacing:0.1em;text-transform:uppercase;vertical-align:middle;">
                            Invoice
                          </td>
                        </tr></table>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#fff;padding:40px 36px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
                        <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#64748B;text-transform:uppercase;">Invoice received</p>
                        <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0F172A;letter-spacing:-0.4px;">
                          Your invoice is ready, %s.
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                          <strong>%s</strong> has completed the work on ticket <strong>%s</strong>
                          and issued an invoice. Please find the PDF attached to this email.
                        </p>
                        <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:28px;">
                          <tr>
                            <td style="padding:20px 24px;">
                              <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="font-size:13px;color:#64748B;">Ticket</td>
                                  <td style="font-size:13px;color:#0F172A;font-weight:600;text-align:right;">%s</td>
                                </tr>
                                <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #E2E8F0;"/></td></tr>
                                <tr>
                                  <td style="font-size:13px;color:#64748B;">Service</td>
                                  <td style="font-size:13px;color:#0F172A;font-weight:600;text-align:right;">%s</td>
                                </tr>
                                <tr><td colspan="2" style="padding:6px 0;"><hr style="border:none;border-top:1px solid #E2E8F0;"/></td></tr>
                                <tr>
                                  <td style="font-size:15px;color:#0F172A;font-weight:700;">Total due</td>
                                  <td style="font-size:20px;color:#0B1E3F;font-weight:700;text-align:right;">€%s</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0;font-size:13px;color:#94A3B8;">
                          The full invoice PDF is attached. Please process payment at your earliest convenience.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 FixItNow · Your maintenance marketplace</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(
                escape(customerFirstName),
                escape(providerName),
                escape(ticketCode),
                escape(ticketCode),
                escape(serviceType),
                amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString()
        );
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
        // Three placeholders in the template: greeting, button href, and the
        // plain-text copy-paste version of the link. Must match the arg count
        // in the .formatted(...) call at the end.
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
            """.formatted(escape(firstName), resetUrl, resetUrl);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
    }
}
