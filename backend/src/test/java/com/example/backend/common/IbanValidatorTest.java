package com.example.backend.common;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class IbanValidatorTest {

    // ── Valid IBANs ──────────────────────────────────────────────────────────

    @Test
    void validSlovenianIban() {
        assertTrue(IbanValidator.isValid("SI56191000000123438"));
    }

    @Test
    void validGermanIban() {
        assertTrue(IbanValidator.isValid("DE89370400440532013000"));
    }

    @Test
    void validGbIban() {
        assertTrue(IbanValidator.isValid("GB29NWBK60161331926819"));
    }

    @Test
    void validIbanWithSpacesShouldPass() {
        // normalize() strips spaces
        assertTrue(IbanValidator.isValid("GB29 NWBK 6016 1331 9268 19"));
    }

    @Test
    void validIbanLowercaseShouldPass() {
        assertTrue(IbanValidator.isValid("gb29nwbk60161331926819"));
    }

    // ── Invalid IBANs ────────────────────────────────────────────────────────

    @Test
    void nullShouldReturnFalse() {
        assertFalse(IbanValidator.isValid(null));
    }

    @Test
    void emptyShouldReturnFalse() {
        assertFalse(IbanValidator.isValid(""));
    }

    @Test
    void tooShortShouldReturnFalse() {
        assertFalse(IbanValidator.isValid("DE89"));
    }

    @Test
    void unknownCountryCodeShouldReturnFalse() {
        assertFalse(IbanValidator.isValid("ZZ89370400440532013000"));
    }

    @Test
    void wrongLengthForCountryShouldReturnFalse() {
        // DE requires 22 chars — 21 here
        assertFalse(IbanValidator.isValid("DE8937040044053201300"));
    }

    @Test
    void badChecksumShouldReturnFalse() {
        // One digit changed from the valid DE IBAN
        assertFalse(IbanValidator.isValid("DE89370400440532013001"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"DE89 370400 44 0532013000!", "DE89-3704-0044-0532-0130-00"})
    void specialCharactersShouldReturnFalse(String iban) {
        assertFalse(IbanValidator.isValid(iban));
    }

    // ── normalize ────────────────────────────────────────────────────────────

    @Test
    void normalizeStripsSpacesAndUppercases() {
        assertEquals("GB29NWBK60161331926819", IbanValidator.normalize("gb29 nwbk 6016 1331 9268 19"));
    }

    @Test
    void normalizeNullReturnsEmpty() {
        assertEquals("", IbanValidator.normalize(null));
    }
}
