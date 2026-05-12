package com.example.backend.service;

public interface TwoFactorService {

    String generateSecret();

    String getQrCodeUri(String secret, String email, String issuer);

    boolean verifyCode(String secret, String code);
}
