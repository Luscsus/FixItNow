package com.example.backend.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Hosted Stripe Checkout URL the frontend redirects the customer to. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutSessionResponse {
    private String url;
}
