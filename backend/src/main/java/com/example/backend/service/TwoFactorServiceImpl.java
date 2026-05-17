package com.example.backend.service;

import com.example.backend.service.TwoFactorService;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

@Service
public class TwoFactorServiceImpl implements TwoFactorService {

    private final DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final DefaultCodeVerifier codeVerifier = new DefaultCodeVerifier(
        new DefaultCodeGenerator(), new SystemTimeProvider()
    );

    @Override
    public String generateSecret() {
        return secretGenerator.generate();
    }

    @Override
    public String getQrCodeUri(String secret, String email, String issuer) {
        QrData data = new QrData.Builder()
            .label(email)
            .secret(secret)
            .issuer(issuer)
            .algorithm(HashingAlgorithm.SHA1)
            .digits(6)
            .period(30)
            .build();
        return data.getUri();
    }

    @Override
    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }
}
