package com.example.backend.service;

public interface EmailService {

    void sendEmailConfirmation(String to, String firstName, String confirmationUrl);

    void sendPasswordReset(String to, String firstName, String resetUrl);
}
