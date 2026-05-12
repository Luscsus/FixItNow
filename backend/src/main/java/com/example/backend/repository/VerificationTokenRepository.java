package com.example.backend.repository;

import com.example.backend.domain.token.TokenType;
import com.example.backend.domain.token.VerificationToken;
import com.example.backend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {

    Optional<VerificationToken> findByTokenAndTokenType(String token, TokenType tokenType);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.user = :user AND vt.tokenType = :tokenType")
    void deleteAllByUserAndTokenType(User user, TokenType tokenType);
}
