package com.example.backend.service;

public interface EmailService {

    void sendEmailConfirmation(String to, String firstName, String confirmationUrl);

    void sendPasswordReset(String to, String firstName, String resetUrl);

    void sendProviderApprovalPending(String to, String firstName);

    void sendAdminNewProviderApprovalRequest(String to, String adminFirstName, String providerEmail, String providerFullName);

    void sendProviderApproved(String to, String firstName);

    void sendProviderDeclined(String to, String firstName, String reason);
}
